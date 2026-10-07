type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function formatter(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
}

function partsFor(date: Date, timeZone: string): DateParts {
  const parts = formatter(timeZone).formatToParts(date).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second) };
}

function utcFromParts(parts: DateParts) { return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second); }

function inputParts(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  if ([year, month, day, hour, minute].some(Number.isNaN)) return null;
  return { year, month, day, hour, minute, second: Number.isNaN(second) ? 0 : second };
}

function sameParts(left: DateParts, right: DateParts) { return left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour && left.minute === right.minute; }

/** Converts a datetime-local control value in a selected IANA zone into a UTC ISO instant. */
export function zonedDateTimeToIso(value: string, timeZone: string) {
  const requested = inputParts(value);
  if (!requested) throw new Error('Tarih ve saat geçerli değil.');
  // Formatting a tentative UTC instant as local time reveals the zone offset at that point.
  const naiveUtc = utcFromParts(requested);
  const offsetAt = (instant: number) => utcFromParts(partsFor(new Date(instant), timeZone)) - instant;
  let instant = naiveUtc - offsetAt(naiveUtc);
  // A second pass covers daylight-saving changes around the entered hour.
  instant = naiveUtc - offsetAt(instant);
  const resolved = partsFor(new Date(instant), timeZone);
  if (!sameParts(requested, resolved)) throw new Error('Bu saat seçilen saat diliminde bulunmuyor.');
  return new Date(instant).toISOString();
}

/** Formats a stored UTC instant for a datetime-local control in the supplied IANA zone. */
export function isoToZonedDateTimeInput(value: string | null | undefined, timeZone: string) {
  if (!value) return '';
  const parts = partsFor(new Date(value), timeZone);
  const number = (value: number) => String(value).padStart(2, '0');
  return `${parts.year}-${number(parts.month)}-${number(parts.day)}T${number(parts.hour)}:${number(parts.minute)}`;
}
