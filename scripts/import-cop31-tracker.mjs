import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient, Cop31EventFormat, Cop31EventStatus } from '@prisma/client';
const inputDir = process.argv[2];
if (!inputDir) throw new Error('Usage: node scripts/import-cop31-tracker.mjs <extracted-tracker-directory>');

const prisma = new PrismaClient();
const text = value => String(value ?? '').trim();
const url = value => /^https?:\/\//i.test(text(value)) ? text(value) : undefined;
const slug = value => `tracker-${value}`;
const zone = country => /fiji/i.test(country) ? 'Pacific/Fiji' : /türkiye|turkey/i.test(country) ? 'Europe/Istanbul' : 'UTC';
const format = value => /hybrid/i.test(value) ? Cop31EventFormat.HYBRID : /online|virtual/i.test(value) ? Cop31EventFormat.ONLINE : Cop31EventFormat.IN_PERSON;
const access = (participation, accreditation) => {
  const value = `${participation} ${accreditation}`.toLowerCase();
  if (/accreditation|required badge|blue zone/.test(value)) return 'Accreditation required';
  if (/invite|selection|approval/.test(value)) return 'Application / invitation';
  if (/free|public/.test(value)) return 'Public / free access';
  if (/register|required/.test(value)) return 'Registration required';
  return 'Access details pending';
};
const connection = value => /pre-cop/i.test(value) ? 'Pre-COP / road to COP31' : /indirect|post-cop/i.test(value) ? 'Indirect / post-COP context' : /direct/i.test(value) ? 'Direct COP31' : 'Parallel / associated event';
const time = (date, value, timezone) => {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) return null;
  const match = text(value).match(/(\d{1,2}):(\d{2})/);
  const hour = match ? Number(match[1]) : 9, minute = match ? Number(match[2]) : 0;
  const day = base.toISOString().slice(0, 10);
  const offset = timezone === 'Pacific/Fiji' ? '+12:00' : timezone === 'Europe/Istanbul' ? '+03:00' : 'Z';
  return new Date(`${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${offset}`);
};
const split = value => text(value).split(/\s*[/;]\s*/).filter(Boolean).slice(0, 8);
const summary = row => text(row['Short description']) || `${text(row['Title / Session']) || text(row['Event / Program'])} — COP31-related event.`;

const rows = JSON.parse(await fs.readFile(path.join(inputDir, 'tracker.json'), 'utf8'));
let imported = 0, skipped = 0;
for (const row of rows) {
    const id = text(row.ID);
    const title = text(row['Title / Session']) || text(row['Event / Program']);
    const sourceUrl = url(row['Event page / source']);
    const timezone = zone(text(row.Country));
    const startsAt = time(row.Date, row.Time, timezone);
    if (!id || !title || !sourceUrl || !startsAt || Number.isNaN(startsAt.getTime())) { skipped += 1; continue; }
    const content = {
      title, summary: summary(row), description: summary(row), venueName: text(row.Venue) || undefined, city: text(row.City) || undefined, country: text(row.Country) || undefined,
      organizers: split(row['Organiser(s)']), languages: split(row.Language) || ['English'], topics: split(row.Theme).slice(0, 3), cop31Connection: connection(row['COP31 relationship']), access: access(row.Participation, row['COP accreditation required?']),
      sourceUrl, registrationUrl: url(row['Registration URL']),
    };
    if (!content.organizers.length) content.organizers = ['Not listed'];
    const data = {
      contentTr: content, contentEn: content, titleTr: title, titleEn: title, summaryTr: content.summary, summaryEn: content.summary, descriptionTr: content.description, descriptionEn: content.description,
      startsAt, endsAt: null, timezone, format: format(row.Format), venueName: content.venueName ?? null, venueAddress: null, city: content.city ?? null, country: content.country ?? null,
      organizers: content.organizers, organizerUrl: null, languages: content.languages, topics: content.topics, cop31Connection: content.cop31Connection, registrationUrl: content.registrationUrl ?? null, informationUrl: null, sourceUrl,
      status: Cop31EventStatus.PUBLISHED, featured: false, verifiedAt: new Date(row['Last checked'] || Date.now()),
    };
    await prisma.cop31Event.upsert({ where: { slug: slug(id) }, create: { slug: slug(id), ...data }, update: data });
    imported += 1;
}
await prisma.$disconnect();
console.log(JSON.stringify({ imported, skipped }));
