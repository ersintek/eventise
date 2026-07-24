import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'carousel.html');
const pdfPath = path.join(__dirname, 'eventise-carousel.pdf');
const pngDir = path.join(__dirname, 'slides');

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  // Fontların yüklenmesi için ek bekleme
  await page.waitForTimeout(1500);

  const slides = await page.$$('.slide');
  console.log(`${slides.length} slayt bulundu`);

  // 1) Her slaytı PNG olarak kaydet
  const { mkdirSync } = await import('fs');
  try { mkdirSync(pngDir, { recursive: true }); } catch {}

  for (let i = 0; i < slides.length; i++) {
    const png = path.join(pngDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
    await slides[i].screenshot({ path: png });
    console.log(`  → ${path.basename(png)}`);
  }

  // 2) Tek PDF üret: geçici HTML, her slaydı page break ile
  // Playwright page.pdf ile tüm slaytları tek seferde üret
  await page.addStyleTag({ content: `
    body { gap: 0 !important; padding: 0 !important; background: #fff !important; }
    .slide { box-shadow: none !important; page-break-after: always; break-after: page; }
    .slide:last-child { page-break-after: auto; break-after: auto; }
    @page { size: 1080px 1350px; margin: 0; }
  `});

  await page.pdf({
    path: pdfPath,
    width: '1080px',
    height: '1350px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  });

  console.log(`\nPDF oluşturuldu: ${pdfPath}`);
  console.log(`PNG slaytlar: ${pngDir}/`);

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
