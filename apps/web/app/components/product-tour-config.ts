export const EVENTISE_TOUR_VERSION = 'event-workspace-v1';

export type TourStep = {
  id: string;
  target: string;
  title: string;
  description: string;
};

export const EVENTISE_TOUR_STEPS: TourStep[] = [
  {
    id: 'overview',
    target: 'event-overview',
    title: 'Kontrol merkezi sizinle birlikte düşünür',
    description: 'Etkinliğin bugünkü durumunu, başvuruları ve en anlamlı sonraki seçeneği burada görürsünüz.',
  },
  {
    id: 'publication',
    target: 'publication-controls',
    title: 'Ne zaman hazırsa, o zaman yayında',
    description: 'Etkinlik sayfasını ve kayıt formunu birbirinden bağımsız olarak açıp kapatabilirsiniz.',
  },
  {
    id: 'registration',
    target: 'registration-area',
    title: 'Kayıt deneyimi sizin kontrolünüzde',
    description: 'Formu düzenleyin, başvuruları değerlendirin ve katılımcı listenizi tek yerde yönetin.',
  },
  {
    id: 'communication',
    target: 'communication-area',
    title: 'Doğru mesaj, doğru anda',
    description: 'Davetleri, duyuruları ve hatırlatmaları etkinliğin akışından kopmadan yönetin.',
  },
  {
    id: 'event-day',
    target: 'event-day-area',
    title: 'Kapıdan sertifikaya tek akış',
    description: 'QR katılım teyidi, sonuçlar ve doğrulanabilir sertifikalar etkinliğin devamında hazırdır.',
  },
];

