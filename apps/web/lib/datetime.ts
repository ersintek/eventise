// Tek kaynak: tüm tarih görüntüleme bu modülden geçer.
// tr-TR garantisi burada. US formatı (mm/dd/yyyy) sızmasına karşı burayı değiştirmek yeterli.

const locale = 'tr-TR';

/** dd.mm.yyyy — kısa tarih (listeler, tablolar) */
export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

/** dd.mm.yyyy HH:mm — kısa tarih + saat (duyuru listeleri) */
export function formatDateShort(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

/** 21 Temmuz 2026, 14:00 — uzun tarih + saat (etkinlik gösterimi standardı) */
export function formatDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

/** 21 Temmuz 2026 — uzun tarih, saatsiz */
export function formatDateLong(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(iso));
}

/** 21 Temmuz 2026 Salı, 14:00 — tam tarih + saat (public etkinlik sayfası) */
export function formatDateFull(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso));
}

/** Sadece saat kısmı: 14:00 */
export function formatTime(iso: string | Date): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

/**
 * yyyy-mm-dd — LOKAL gün bileşenlerinden (type="date" input değeri için).
 * toISOString().slice(0,10) UTC gününü verir; Türkiye'de akşam saatlerinde
 * etkinlikler bir gün öncesi kaydedilebilir. Bu fonksiyon o bug'ı düzeltir.
 */
export function toLocalDateInputValue(iso: string | Date): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** yyyy-mm-ddTHH:mm — datetime-local input defaultValue için (lokal). */
export function toLocalDatetimeInputValue(iso: string | Date): string {
  const d = new Date(iso);
  const date = toLocalDateInputValue(d);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${date}T${h}:${min}`;
}
