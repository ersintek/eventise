export const EVENTISE_TOUR_VERSION = 'event-workspace-v4';

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
    title: 'Etkinliği bu alandan yönetin.',
    description: 'Etkinliğin adı, tarihi ve menüsü burada sabit kalır. Yapacağınız işe göre aşağıdaki bölümlerden birini açın.',
  },
  {
    id: 'publication', target: 'publication-controls', eyebrow: 'DURUMLAR',
    title: 'Etkinlik ve kayıt formu ayrı durumlardır.',
    description: 'Etkinlik Taslak veya Yayında; kayıt formu ise Açık veya Kapalı olabilir. Yaptığınız değişikliğin sonucu ekranda doğrulanır.',
  },
  {
    id: 'info', target: 'info-area', eyebrow: 'ETKİNLİK ÖNCESİ',
    title: 'Etkinlik Bilgileri',
    description: 'Başlık, tarih, mekân, görünüm, kayıt formu ve SSS alanlarını buradan güncelleyin.',
  },
  {
    id: 'applications', target: 'applications-area', eyebrow: 'ETKİNLİK ÖNCESİ',
    title: 'Başvurular',
    description: 'Gelen başvuruları inceleyin; kabul, ret veya yedek liste kararını burada verin.',
  },
  {
    id: 'communication', target: 'communication-area', eyebrow: 'ETKİNLİK ÖNCESİ',
    title: 'İletişim',
    description: 'Davet, hatırlatma, duyuru ve katılımcı kaynaklarını buradan yönetin.',
  },
  {
    id: 'tools', target: 'tools-area', eyebrow: 'ETKİNLİK ÖNCESİ',
    title: 'Araçlar',
    description: 'Test, geri bildirim, tanışma ve grup araçlarını gerektiğinde etkinleştirin.',
  },
  {
    id: 'event-day', target: 'door-area', eyebrow: 'ETKİNLİK SIRASINDA',
    title: 'Katılım',
    description: 'QR koduyla veya listeden katılımcı girişlerini doğrulayın.',
  },
  {
    id: 'results', target: 'results-area', eyebrow: 'ETKİNLİK SONRASI',
    title: 'Sonuçlar',
    description: 'Katılım ve geri bildirim sonuçlarını inceleyin; raporları buradan alın.',
  },
  {
    id: 'certificates', target: 'certificate-area', eyebrow: 'ETKİNLİK SONRASI',
    title: 'Sertifikalar',
    description: 'Katılımı doğrulanan kişiler için sertifika tasarlayın ve oluşturun.',
  },
];
