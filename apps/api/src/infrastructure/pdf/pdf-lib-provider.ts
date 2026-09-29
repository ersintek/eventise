import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PdfProvider, AttendanceSignatureDocumentInput, CertificateDocumentInput, CertificateField } from './pdf-provider.port';

// pdf-lib tabanlı PDF sağlayıcı.
// - textDocument: basit raporlar için (Helvetica, çok satırlı)
// - certificateDocument: Türkçe font gömme + arka plan görseli + QR ile sertifika üretimi
//
// Türkçe karakterler (ç, ğ, ı, ş, ö, ü) için Plus Jakarta Sans TTF gömülür.
// Mevcut SimplePdfProvider'ın ASCII-fold hatasını kalıcı olarak çözer.

@Injectable()
export class PdfLibProvider implements PdfProvider {
  private async loadFont(doc: PDFDocument, bold: boolean): Promise<PDFFont> {
    try {
      doc.registerFontkit(fontkit);
      const fontFile = bold ? 'PlusJakartaSans-Bold.ttf' : 'PlusJakartaSans-Regular.ttf';
      let bytes: Buffer;
      try {
        bytes = await readFile(join(process.cwd(), 'assets', 'fonts', fontFile));
      } catch {
        // Yerel geliştirmede API paketi depo kökünden çalıştırılabilir.
        bytes = await readFile(join(process.cwd(), 'apps', 'api', 'assets', 'fonts', fontFile));
      }
      return doc.embedFont(bytes, { subset: true });
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

  async attendanceSignatureDocument(input: AttendanceSignatureDocumentInput): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const font = await this.loadFont(doc, false);
    const bold = await this.loadFont(doc, true);
    const rowsPerPage = 17;
    const pageCount = Math.max(1, Math.ceil(input.rows.length / rowsPerPage));

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const page = doc.addPage([595, 842]);
      const rows = input.rows.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);
      const left = 42;
      const right = 553;
      const nameEnd = 220;
      const emailEnd = 408;
      const tableTop = 710;
      const headerHeight = 26;
      const rowHeight = 34;

      page.drawText(this.fit(input.organizationName, bold, 10, right - left), { x: left, y: 802, size: 10, font: bold, color: rgb(0.32, 0.37, 0.45) });
      page.drawText(this.fit(input.eventTitle, bold, 17, right - left), { x: left, y: 774, size: 17, font: bold, color: rgb(0.08, 0.15, 0.28) });
      page.drawText('Katılımcı İmza Listesi', { x: left, y: 752, size: 10, font, color: rgb(0.32, 0.37, 0.45) });
      page.drawLine({ start: { x: left, y: 738 }, end: { x: right, y: 738 }, thickness: 1.2, color: rgb(0.13, 0.26, 0.47) });

      page.drawRectangle({ x: left, y: tableTop - headerHeight, width: right - left, height: headerHeight, color: rgb(0.12, 0.24, 0.43) });
      this.cellText(page, 'İsim', left + 10, tableTop - 17, bold, 10, nameEnd - left - 20, rgb(1, 1, 1));
      this.cellText(page, 'E-posta', nameEnd + 10, tableTop - 17, bold, 10, emailEnd - nameEnd - 20, rgb(1, 1, 1));
      this.cellText(page, 'İmza', emailEnd + 10, tableTop - 17, bold, 10, right - emailEnd - 20, rgb(1, 1, 1));

      rows.forEach((row, index) => {
        const y = tableTop - headerHeight - (index + 1) * rowHeight;
        const background = index % 2 === 0 ? rgb(0.975, 0.98, 0.99) : rgb(1, 1, 1);
        page.drawRectangle({ x: left, y, width: right - left, height: rowHeight, color: background, borderColor: rgb(0.76, 0.8, 0.86), borderWidth: 0.6 });
        page.drawLine({ start: { x: nameEnd, y }, end: { x: nameEnd, y: y + rowHeight }, thickness: 0.6, color: rgb(0.76, 0.8, 0.86) });
        page.drawLine({ start: { x: emailEnd, y }, end: { x: emailEnd, y: y + rowHeight }, thickness: 0.6, color: rgb(0.76, 0.8, 0.86) });
        this.cellText(page, `${row.firstName} ${row.lastName}`.trim(), left + 10, y + 12, font, 10, nameEnd - left - 20, rgb(0.12, 0.15, 0.21));
        this.cellText(page, row.email, nameEnd + 10, y + 12, font, 9, emailEnd - nameEnd - 20, rgb(0.2, 0.25, 0.33));
      });

      const pageLabel = `Sayfa ${pageIndex + 1} / ${pageCount}`;
      const pageLabelWidth = font.widthOfTextAtSize(pageLabel, 9);
      page.drawText(pageLabel, { x: (595 - pageLabelWidth) / 2, y: 42, size: 9, font, color: rgb(0.32, 0.37, 0.45) });
    }

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

  private fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
    let result = text;
    while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) result = result.slice(0, -1);
    return `${result}...`;
  }

  private cellText(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, maxWidth: number, color: ReturnType<typeof rgb>): void {
    page.drawText(this.fit(text, font, size, maxWidth), { x, y, size, font, color });
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
