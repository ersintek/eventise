export const EVENTISE_TOUR_VERSION = 'event-workspace-v5';

export type TourStep = {
  id: string;
  target: string;
  eyebrow: string;
  title: string;
  description: string;
};

export const EVENTISE_TOUR_STEPS: TourStep[] = [
  {
    id: 'control-center', target: 'event-command-center', eyebrow: 'ETKİNLİK ÇALIŞMA ALANI',
    title: 'Etkinliğinizi tek yerden yönetin.',
    description: 'Etkinliğin adı, tarihi, durumları ve bütün yönetim bölümleri bu çalışma alanında bir arada kalır.',
  },
  {
    id: 'publication', target: 'publication-controls', eyebrow: 'YAYIN VE KAYIT',
    title: 'Yayın ve kayıt durumlarını ayrı yönetin.',
    description: 'Etkinlik Taslak veya Yayında; kayıt formu Açık veya Kapalı olabilir. Taslaktaki bir etkinliğin kayıt formunu açarsanız iki durum birlikte güncellenir.',
  },
  {
    id: 'before-event', target: 'pre-event-area', eyebrow: 'ETKİNLİK ÖNCESİ',
    title: 'Hazırlıkları dört bölümde tamamlayın.',
    description: 'Etkinlik Bilgileri, Başvurular, İletişim ve Araçlar; yayından katılımcı iletişimine kadar bütün hazırlıkları kapsar.',
  },
  {
    id: 'during-event', target: 'during-event-area', eyebrow: 'ETKİNLİK SIRASINDA',
    title: 'Katılımı buradan takip edin.',
    description: 'QR kodu, katılımcı listesi veya kapıda kayıt ile girişleri doğrulayın; etkinlikten önce kısa bir prova yapın.',
  },
  {
    id: 'after-event', target: 'post-event-area', eyebrow: 'ETKİNLİK SONRASI',
    title: 'Sonuçları alın ve sertifikaları hazırlayın.',
    description: 'Katılım ve geri bildirim sonuçlarını inceleyin, raporları indirin ve uygun katılımcılar için sertifika oluşturun.',
  },
];
