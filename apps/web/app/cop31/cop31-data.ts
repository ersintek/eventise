import { cache } from 'react';
import type { Cop31Copy, Cop31Event, Cop31Format, Cop31Locale, Cop31LocalizedContent } from './cop31-types';
import { trackerExampleEvents } from './cop31-tracker-examples';

const API = process.env.API_INTERNAL_URL;
// Sample records are useful for a deliberate local design preview, but must
// never silently replace the verified directory in a deployed environment.
const useDemoData = process.env.COP31_DEMO_DATA === 'true';

export const copy: Record<Cop31Locale, Cop31Copy> = {
  tr: {
    label: 'Eventise keşif rehberi', eyebrow: 'COP31 İLE BAĞLANTILI ETKİNLİKLER', title: 'COP31 yolunda neler oluyor?',
    intro: 'COP31 hakkında düşünmek, öğrenmek, birlikte hazırlanmak ve bağlantı kurmak için düzenlenen etkinlikleri keşfedin.',
    search: 'Etkinlik, kurum, şehir veya konu ara…', upcoming: 'Yaklaşan', newest: 'Yeni eklenenler', all: 'Tümü', filters: 'Filtreler',
    topic: 'Konu', filterAccess: 'Erişim', date: 'Tarih', region: 'Bölge', format: 'Katılım biçimi', language: 'Etkinlik dili', allTopics: 'Tüm konular', allFormats: 'Tüm biçimler', allLanguages: 'Tüm diller',
    results: 'etkinlik', featured: 'Öne çıkanlar', latest: 'Yeni eklenenler', details: 'Etkinliği incele', register: 'Kayıt / katılım', information: 'Etkinlik bilgisi',
    source: 'Kaynak', share: 'Paylaş', calendar: 'Takvime ekle', back: 'Tüm etkinliklere dön', eventLanguage: 'Etkinlik dili', organizers: 'Düzenleyen', when: 'Tarih ve saat',
    where: 'Konum', cop31Connection: 'COP31 bağlantısı', updated: 'Son doğrulama', emptyTitle: 'Bu ölçütlerde bir etkinlik yok.',
    emptyBody: 'Aramanızı veya filtrelerinizi değiştirerek başka etkinlikleri inceleyin.', clearFilters: 'Filtreleri temizle', online: 'Çevrim içi', inPerson: 'Yüz yüze', hybrid: 'Hibrit',
    postponed: 'Ertelendi', cancelled: 'İptal edildi', past: 'Geçmiş etkinlik', pastEvents: 'Geçmiş etkinlikler', onThisPage: 'Bu etkinlikte', about: 'Etkinlik hakkında', access: 'Katılım bilgileri',
    noRegistration: 'Kayıt bağlantısı henüz paylaşılmadı.',
  },
  en: {
    label: 'An Eventise discovery guide', eyebrow: 'COP31-RELATED EVENTS', title: 'What is happening on the road to COP31?',
    intro: 'Discover events that help people think, learn, prepare and connect around COP31.',
    search: 'Search an event, organization, city or topic…', upcoming: 'Upcoming', newest: 'Newly added', all: 'All', filters: 'Filters',
    topic: 'Topic', filterAccess: 'Access', date: 'Date', region: 'Region', format: 'Attendance', language: 'Event language', allTopics: 'All topics', allFormats: 'All formats', allLanguages: 'All languages',
    results: 'events', featured: 'Featured', latest: 'Newly added', details: 'View event', register: 'Register / attend', information: 'Event information',
    source: 'Source', share: 'Share', calendar: 'Add to calendar', back: 'Back to all events', eventLanguage: 'Event language', organizers: 'Organized by', when: 'Date and time',
    where: 'Location', cop31Connection: 'COP31 connection', updated: 'Last verified', emptyTitle: 'No events match these filters.',
    emptyBody: 'Try changing your search or filters to explore other events.', clearFilters: 'Clear filters', online: 'Online', inPerson: 'In person', hybrid: 'Hybrid',
    postponed: 'Postponed', cancelled: 'Cancelled', past: 'Past event', pastEvents: 'Past events', onThisPage: 'On this event', about: 'About this event', access: 'How to attend',
    noRegistration: 'A registration link has not been shared yet.',
  },
};

export const topicLabels: Record<string, Record<Cop31Locale, string>> = {
  policy: { tr: 'İklim politikası ve müzakereler', en: 'Climate policy and negotiations' },
  finance: { tr: 'İklim finansmanı', en: 'Climate finance' },
  energy: { tr: 'Enerji ve adil dönüşüm', en: 'Energy and just transition' },
  adaptation: { tr: 'Adaptasyon ve dayanıklılık', en: 'Adaptation and resilience' },
  loss_damage: { tr: 'Kayıp ve zarar', en: 'Loss and damage' },
  nature: { tr: 'Doğa ve biyoçeşitlilik', en: 'Nature and biodiversity' },
  food: { tr: 'Gıda ve tarım', en: 'Food and agriculture' },
  cities: { tr: 'Şehirler ve yerel yönetimler', en: 'Cities and local government' },
  youth: { tr: 'Gençlik, eğitim ve katılım', en: 'Youth, education and participation' },
  justice: { tr: 'İklim adaleti', en: 'Climate justice' },
  innovation: { tr: 'Teknoloji, veri ve inovasyon', en: 'Technology, data and innovation' },
};

export const connectionLabels: Record<string, Record<Cop31Locale, string>> = {
  preparation: { tr: 'COP31’e hazırlık', en: 'COP31 preparation' },
  agenda: { tr: 'COP31 gündemi üzerine', en: 'Exploring the COP31 agenda' },
  advocacy: { tr: 'Savunuculuk ve kampanya', en: 'Advocacy and campaigning' },
  learning: { tr: 'Eğitim ve kapasite geliştirme', en: 'Learning and capacity building' },
  networking: { tr: 'Ağ kurma ve ortaklık', en: 'Networking and partnership' },
  research: { tr: 'Araştırma, yayın veya lansman', en: 'Research, publication or launch' },
  local: { tr: 'Yerel veya bölgesel buluşma', en: 'Local or regional gathering' },
};

export const formatLabel = (format: Cop31Format, locale: Cop31Locale) => {
  const words = copy[locale];
  return format === 'ONLINE' ? words.online : format === 'IN_PERSON' ? words.inPerson : words.hybrid;
};

export const eventContent = (event: Cop31Event, locale: Cop31Locale): Cop31LocalizedContent => locale === 'tr' ? event.contentTr : event.contentEn;
export const localized = (event: Cop31Event, key: 'title' | 'summary' | 'description', locale: Cop31Locale) => eventContent(event, locale)[key] ?? '';

export const eventHref = (event: Pick<Cop31Event, 'slug'>, locale: Cop31Locale) => `${locale === 'en' ? '/en' : ''}/cop31/${event.slug}`;
export const directoryHref = (locale: Cop31Locale) => locale === 'en' ? '/en/cop31' : '/cop31';

export const formatEventDate = (event: Cop31Event, locale: Cop31Locale, withTime = true) => {
  const language = locale === 'tr' ? 'tr-TR' : 'en-GB';
  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', timeZone: event.timezone };
  const date = new Intl.DateTimeFormat(language, dateOptions).format(new Date(event.startsAt));
  if (!withTime) return date;
  const time = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit', timeZone: event.timezone, hourCycle: 'h23' }).format(new Date(event.startsAt));
  const end = event.endsAt ? new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit', timeZone: event.timezone, hourCycle: 'h23' }).format(new Date(event.endsAt)) : null;
  return `${date} · ${time}${end ? `–${end}` : ''}`;
};

export const dayNumber = (event: Cop31Event, locale: Cop31Locale) => new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { day: '2-digit', timeZone: event.timezone }).format(new Date(event.startsAt));
export const monthName = (event: Cop31Event, locale: Cop31Locale) => new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { month: 'short', timeZone: event.timezone }).format(new Date(event.startsAt)).replace('.', '').toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-GB');

export const isPast = (event: Cop31Event) => new Date(event.endsAt ?? event.startsAt).getTime() < Date.now();

export const getCop31Events = cache(async (): Promise<Cop31Event[]> => {
  if (!API) return useDemoData ? trackerExampleEvents : [];
  try {
    const response = await fetch(`${API}/api/public/cop31/events`, { cache: 'no-store' });
    if (!response.ok) return useDemoData ? trackerExampleEvents : [];
    const events = await response.json() as Cop31Event[];
    return events;
  } catch { return useDemoData ? trackerExampleEvents : []; }
});

export const getCop31Event = cache(async (slug: string): Promise<Cop31Event | null> => {
  const sample = useDemoData ? trackerExampleEvents.find(event => event.slug === slug) ?? null : null;
  if (!API) return sample;
  try {
    const response = await fetch(`${API}/api/public/cop31/events/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    return response.ok ? await response.json() : sample;
  } catch { return sample; }
});
