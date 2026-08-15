import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const roots = ['apps/web/app', 'apps/web/lib'];
const extensions = new Set(['.ts', '.tsx']);
const excludedFiles = new Set(['apps/web/app/dashboard/about/about-data.ts']);
const forbidden = [
  'Kayıt & Bilgiler',
  'Yeni sürümü yayınla',
  'Yayın dışı',
  'Daha sonra duyurulacak',
  'Yerinizi ayırın',
  'GENEL BAKIŞ',
  'Başvuru açık',
  'Başvuru kapalı',
  'katılımcı deneyimi',
];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return nested.flat();
}

const failures = [];
for (const root of roots) {
  for (const file of await filesIn(root)) {
    const normalized = file.replaceAll('\\', '/');
    if (!extensions.has(extname(file)) || excludedFiles.has(normalized)) continue;
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, index) => forbidden.forEach(term => {
      if (line.includes(term)) failures.push(`${relative('.', file)}:${index + 1} — "${term}"`);
    }));
  }
}

if (failures.length) {
  console.error('Standart dışı ürün terimleri bulundu:\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Ürün dili kontrolü geçti.');
}
