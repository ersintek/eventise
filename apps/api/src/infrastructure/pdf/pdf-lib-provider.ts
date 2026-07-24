import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PdfProvider, CertificateDocumentInput, CertificateField } from './pdf-provider.port';

// pdf-lib tabanlı PDF sağlayıcı.
// - textDocument: basit raporlar için (Helvetica, çok satırlı)
// - certificateDocument: Türkçe font gömme + arka plan görseli + QR ile sertifika üretimi
//
// Türkçe karakterler (ç, ğ, ı, ş, ö, ü) için Plus Jakarta Sans TTF gömülür.
// Mevcut SimplePdfProvider'ın ASCII-fold hatasını kalıcı olarak çözer.

@Injectable()
export class PdfLibProvider implements PdfProvider {
  private fontCache: { regular?: PDFFont; bold?: PDFFont } = {};

  private async loadFont(doc: PDFDocument, bold: boolean): Promise<PDFFont> {
    if (bold && this.fontCache.bold) return this.fontCache.bold;
    if (!bold && this.fontCache.regular) return this.fontCache.regular;
    try {
      doc.registerFontkit(fontkit);
      const fontPath = join(process.cwd(), 'assets', 'fonts', bold ? 'PlusJakartaSans-Bold.ttf' : 'PlusJakartaSans-Regular.ttf');
      const bytes = await readFile(fontPath);
      const font = await doc.embedFont(bytes, { subset: true });
      if (bold) this.fontCache.bold = font; else this.fontCache.regular = font;
      return font;
    } catch {
      // Font yüklenemezse Helvetica'ya düş — Türkçe karakterler eksik olur ama çökme olmaz.
      return doc.embedFont(StandardFonts.Helvetica);
    }
  }

  async textDocument(title: string, lines: string[]): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const font = await this.loadFont(doc, false);
    const bold = await this.loadFont(doc, true);
    const page = doc.addPage([595, 842]); // A4 dikey
    const { width } = page.getSize();
    let y = 800;
    page.drawText(title, { x: 50, y, size: 18, font: bold, color: rgb(0.1, 0.1, 0.15) });
    y -= 32;
    for (const line of lines) {
      if (y < 60) break;
      page.drawText(line, { x: 50, y, size: 11, font, color: rgb(0.2, 0.2, 0.25) });
      y -= 20;
    }
    void width;
    return Buffer.from(await doc.save());
  }

  async certificateDocument(input: CertificateDocumentInput): Promise<Buffer> {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    // A4: yatay 842×595, dikey 595×842
    const page = doc.addPage(input.orientation === 'LANDSCAPE' ? [842, 595] : [595, 842]);

    // Arka plan görseli (varsa) sayfayı kapla
    if (input.backgroundBytes) {
      try {
        const isPng = input.backgroundBytes[0] === 0x89 && input.backgroundBytes[1] === 0x50;
        const img = isPng ? await doc.embedPng(input.backgroundBytes) : await doc.embedJpg(input.backgroundBytes);
        page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      } catch {
        // Bozuk görsel varsa arka plansız devam et
      }
    }

    // Metin alanları
    for (const field of input.fields) {
      const font = await this.loadFont(doc, Boolean(field.bold));
      const color = this.parseColor(field.color);
      await this.drawText(page, field, font, color);
    }

    // QR kodu
    if (input.qrBytes && input.qrPosition) {
      try {
        const qr = await doc.embedPng(input.qrBytes);
        page.drawImage(qr, {
          x: input.qrPosition.x,
          y: input.qrPosition.y,
          width: input.qrPosition.size,
          height: input.qrPosition.size,
          rotate: degrees(0),
        });
      } catch {
        // QR gömülemezse atla
      }
    }

    return Buffer.from(await doc.save());
  }

  private async drawText(page: PDFPage, field: CertificateField, font: PDFFont, color: ReturnType<typeof rgb>): Promise<void> {
    const lines = this.wrapText(field.text, font, field.size, field.maxWidth ?? Infinity);
    const lineHeight = field.size * 1.3;
    let y = field.y;
    for (const line of lines) {
      const textWidth = font.widthOfTextAtSize(line, field.size);
      const x = field.align === 'center' ? field.x - textWidth / 2 : field.x;
      page.drawText(line, { x, y, size: field.size, font, color });
      y -= lineHeight;
    }
  }

  private wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    if (maxWidth === Infinity) return [text];
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth || !current) {
        current = test;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private parseColor(hex?: string): ReturnType<typeof rgb> {
    if (!hex) return rgb(0.12, 0.14, 0.22); // varsayılan koyu lacivert
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    if ([r, g, b].some(n => Number.isNaN(n))) return rgb(0.12, 0.14, 0.22);
    return rgb(r, g, b);
  }
}
