export const publicationLabel = (status?: string) => status === 'PUBLISHED' ? 'Yayında' : status === 'ARCHIVED' ? 'Arşivlendi' : 'Taslak';

export const registrationLabel = (status?: string) => status === 'OPEN' ? 'Açık' : 'Kapalı';

/** Uygulamanın her yerinde aynı anlamla kullanılan ürün sözlüğü. */
export const productTerms = {
  application: 'Başvuru',
  applicationForm: 'Başvuru Formu',
  participant: 'Katılımcı',
  attendanceConfirmation: 'Katılım teyidi',
  entryAndAttendance: 'Giriş ve Katılım',
  applicationPage: 'Başvuru Sayfası',
  visualIdentity: 'Görsel Kimlik',
  announcement: 'Duyuru',
  reminder: 'Hatırlatma',
  automaticEmail: 'Otomatik e-posta',
  eventTools: 'Etkinlik Araçları',
  postEvent: 'Etkinlik Sonrası',
  certificates: 'Sertifikalar',
} as const;

export const applicationStatusLabel: Record<string, string> = {
  SUBMITTED: 'Beklemede',
  PENDING: 'Beklemede',
  ACCEPTED: 'Kabul edildi',
  WAITLISTED: 'Yedek listede',
  REJECTED: 'Reddedildi',
};

export const eventFormatLabel: Record<string, string> = {
  OFFLINE: 'Yüz yüze',
  ONLINE: 'Çevrim içi',
  HYBRID: 'Hibrit',
};

export const eventVisibilityLabel: Record<string, string> = {
  PUBLIC: 'Herkese açık',
  LINK_ONLY: 'Bağlantıya sahip olanlar',
  INVITE_ONLY: 'Yalnız davetliler',
};

export const registrationModeLabel: Record<string, string> = {
  DIRECT: 'Otomatik kabul',
  APPROVAL: 'Başvuru onayı',
  WAITLIST: 'Yedek liste',
};

export function productLabel(value?: string) {
  if (!value) return '—';
  return eventFormatLabel[value]
    ?? eventVisibilityLabel[value]
    ?? registrationModeLabel[value]
    ?? applicationStatusLabel[value]
    ?? value;
}
