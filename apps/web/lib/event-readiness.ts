export type ReadinessEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  publicationStatus: string;
  registrationStatus: string;
  registrationSummary?: { total: number; pending: number; accepted: number; waitlisted: number; rejected: number };
  _count?: { registrations?: number };
};

export type EventTask = {
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  href: string;
  priority: number;
};

export function nextEventTask(event: ReadinessEvent, now = Date.now()): EventTask {
  const base = `/dashboard/events/${event.id}`;
  const startsAt = new Date(event.startsAt).getTime();
  const endsAt = new Date(event.endsAt).getTime();
  const pending = event.registrationSummary?.pending ?? 0;

  if (event.publicationStatus !== 'PUBLISHED') return {
    eyebrow: 'YAYINA HAZIRLIK',
    title: `${event.title} etkinliğini gözden geçirin.`,
    body: 'Etkinlik bilgilerini ve kayıt formunu kontrol ettikten sonra etkinliği yayınlayabilirsiniz.',
    action: 'Etkinlik bilgilerini aç',
    href: `${base}/settings?subtab=info`,
    priority: 100,
  };
  if (pending > 0) return {
    eyebrow: 'BEKLEYEN BAŞVURULAR',
    title: `${pending} başvuru kararınızı bekliyor.`,
    body: 'Başvuruları kabul edebilir, reddedebilir veya yedek listeye alabilirsiniz.',
    action: 'Başvuruları değerlendir',
    href: `${base}/applications`,
    priority: 90,
  };
  if (now >= startsAt && now <= endsAt) return {
    eyebrow: 'ETKİNLİK SÜRÜYOR',
    title: `${event.title} için katılım ekranını açın.`,
    body: 'QR kodunu gösterin veya katılımcıları listeden teyit edin.',
    action: 'Katılım ekranını aç',
    href: `${base}/day`,
    priority: 80,
  };
  if (now > endsAt) return {
    eyebrow: 'ETKİNLİK SONRASI',
    title: `${event.title} sonuçlarını tamamlayın.`,
    body: 'Katılım sonuçlarını, geri bildirimleri ve paylaşılacak çıktıları inceleyin.',
    action: 'Sonuçları aç',
    href: `${base}/post-event`,
    priority: 50,
  };
  if (event.registrationStatus !== 'OPEN') return {
    eyebrow: 'KAYIT FORMU KAPALI',
    title: `${event.title} için kayıt formunu kontrol edin.`,
    body: 'Etkinlik sayfası yayında. Yeni başvuru almak istiyorsanız kayıt formunu açabilirsiniz.',
    action: 'Kayıt formunu aç',
    href: `${base}/settings?subtab=forms`,
    priority: 70,
  };
  return {
    eyebrow: 'SIRADAKİ ETKİNLİK',
    title: `${event.title} başvurulara açık.`,
    body: 'Başvuruları ve katılımcı iletişimini aynı çalışma alanından takip edebilirsiniz.',
    action: 'Başvuruları aç',
    href: `${base}/applications`,
    priority: 40,
  };
}
