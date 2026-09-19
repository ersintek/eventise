// Tek kaynak: tüm tarih görüntüleme bu modülden geçer.
// Etkinlik saati, tarayıcının ya da sunucunun değil, etkinliğin seçilen zaman
// diliminde gösterilir. Eski kayıtlar için Türkiye saati güvenli varsayılandır.

const locale = 'tr-TR';
export const DEFAULT_EVENT_TIMEZONE = 'Europe/Istanbul';

export const eventTimezones = [
  { value: 'Europe/Istanbul', label: 'GMT+3 · Türkiye Standart Saati' },
  { value: 'Europe/London', label: 'GMT+0 · Londra' },
  { value: 'Europe/Berlin', label: 'GMT+1 · Orta Avrupa' },
  { value: 'America/New_York', label: 'GMT-5 · New York' },
  { value: 'America/Los_Angeles', label: 'GMT-8 · Los Angeles' },
] as const;

function options(timeZone?: string) { return { timeZone: timeZone || DEFAULT_EVENT_TIMEZONE }; }

export function formatDate(iso: string | Date, timeZone?: string): string { return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', ...options(timeZone) }).format(new Date(iso)); }
export function formatDateShort(iso: string | Date, timeZone?: string): string { return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', ...options(timeZone) }).format(new Date(iso)); }
export function formatDateTime(iso: string | Date, timeZone?: string): string { return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', ...options(timeZone) }).format(new Date(iso)); }
export function formatDateLong(iso: string | Date, timeZone?: string): string { return new Intl.DateTimeFormat(locale, { dateStyle: 'long', ...options(timeZone) }).format(new Date(iso)); }
export function formatDateFull(iso: string | Date, timeZone?: string): string { return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short', ...options(timeZone) }).format(new Date(iso)); }
export function formatTime(iso: string | Date, timeZone?: string): string { return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', ...options(timeZone) }).format(new Date(iso)); }

function zonedParts(iso: string | Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso));
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
}

/** yyyy-mm-dd — etkinliğin zaman dilimindeki tarih input değeri. */
export function toLocalDateInputValue(iso: string | Date, timeZone = DEFAULT_EVENT_TIMEZONE): string { const part = zonedParts(iso, timeZone); return `${part.year}-${part.month}-${part.day}`; }
/** yyyy-mm-ddTHH:mm — datetime-local input değeri, etkinliğin saatinde. */
export function toLocalDatetimeInputValue(iso: string | Date, timeZone = DEFAULT_EVENT_TIMEZONE): string { const part = zonedParts(iso, timeZone); return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}`; }

/** datetime-local değerini seçilen IANA zaman dilimindeki gerçek UTC ana dönüştürür. */
export function zonedDateTimeToUtcIso(value: string, timeZone: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error('Geçerli bir tarih ve saat seçin.');
  const [, year, month, day, hour, minute] = match;
  const desired = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  let utc = desired;
  for (let index = 0; index < 2; index += 1) {
    const part = zonedParts(new Date(utc), timeZone);
    const displayed = Date.UTC(Number(part.year), Number(part.month) - 1, Number(part.day), Number(part.hour), Number(part.minute));
    utc += desired - displayed;
  }
  return new Date(utc).toISOString();
}
