import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tourConfigPath = 'apps/web/app/components/product-tour-config.ts';
const tourComponentPath = 'apps/web/app/components/product-tour.tsx';
const workspaceHeaderPath = 'apps/web/app/dashboard/events/[eventId]/workspace-header.tsx';
const guidePagePath = 'apps/web/app/yardim/page.tsx';
const guideBrowserPath = 'apps/web/app/yardim/guide-browser.tsx';
const globalStylesPath = 'apps/web/app/globals.css';

const [tourConfig, tourComponent, workspaceHeader, guidePage, guideBrowser, globalStyles] = await Promise.all([
  readFile(tourConfigPath, 'utf8'),
  readFile(tourComponentPath, 'utf8'),
  readFile(workspaceHeaderPath, 'utf8'),
  readFile(guidePagePath, 'utf8'),
  readFile(guideBrowserPath, 'utf8'),
  readFile(globalStylesPath, 'utf8'),
]);

test('quick tour has five unique steps and every target exists in the event workspace', () => {
  const ids = [...tourConfig.matchAll(/id:\s*'([^']+)'/g)].map(match => match[1]);
  const targets = [...tourConfig.matchAll(/target:\s*'([^']+)'/g)].map(match => match[1]);
  const workspaceTargets = new Set([
    ...[...workspaceHeader.matchAll(/data-tour-id="([^"]+)"/g)].map(match => match[1]),
    ...[...workspaceHeader.matchAll(/tourId:\s*'([^']+)'/g)].map(match => match[1]),
  ]);

  assert.equal(ids.length, 5);
  assert.equal(targets.length, 5);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(targets).size, targets.length);
  assert.deepEqual(targets.filter(target => !workspaceTargets.has(target)), []);
  assert.match(tourConfig, /EVENTISE_TOUR_VERSION = 'event-workspace-v5'/);
});

test('quick tour safely handles missing targets and intentional dismissal', () => {
  assert.match(tourComponent, /function findAvailableStep/);
  assert.match(tourComponent, /if \(next >= 0\) setIndex\(next\)/);
  assert.match(tourComponent, /else close\(true\)/);
  assert.match(tourComponent, /event\.key === 'Escape'\) close\(true\)/);
  assert.match(tourComponent, /window\.innerWidth - left - 8/);
  assert.match(tourComponent, /window\.innerHeight - top - 8/);
  assert.match(globalStyles, /@media\(max-width:800px\)\{\s*\.problem-report-trigger\{bottom:5\.5rem\}/);
});

test('guide shortcuts point to sections and current product terms are present', () => {
  const sectionIds = new Set([...guidePage.matchAll(/\n\s+id:\s*'([^']+)',\n\s+title:/g)].map(match => match[1]));
  const shortcutIds = [...guideBrowser.matchAll(/\['[^']+',\s*'([^']+)',\s*'[^']+'\]/g)].map(match => match[1]);
  assert.deepEqual(shortcutIds.filter(id => !sectionIds.has(id)), []);

  for (const term of ['Etkinlik Bilgileri', 'Başvurular', 'İletişim', 'Araçlar', 'Katılım', 'Sonuçlar', 'Sertifikalar']) {
    assert.ok(guidePage.includes(term), `Kullanım Rehberi güncel bölüm adını içermiyor: ${term}`);
  }

  for (const obsolete of ['Kapı ve Katılım', 'Davet ve İletişim', 'Formlar ve Onam', 'Sayfa tasarımı']) {
    assert.ok(!guidePage.includes(obsolete), `Kullanım Rehberi eski ürün terimini içeriyor: ${obsolete}`);
  }

  assert.match(guidePage, /Eventise 1\.0 beta ile güncel/);
});
