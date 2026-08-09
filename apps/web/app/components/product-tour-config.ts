export const EVENTISE_TOUR_VERSION = 'event-workspace-v2';

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
    title: 'Etkinliğinizin bütün yolculuğu burada.',
    description: 'Üst bölüm etkinliğinizin kontrol merkezi. Yayın durumundan kayıt akışına, etkinlik gününden sonuçlara kadar her bölüme buradan ulaşırsınız.',
  },
  {
    id: 'publication', target: 'publication-controls', eyebrow: 'YAYIN KONTROLLERİ',
    title: 'Hazır olduğunuz anda görünür olun.',
    description: 'Etkinlik sayfası dışarıdan görünürlüğü, Kayıt Formu ise yeni başvuru almayı yönetir. İkisini ihtiyacınıza göre ayrı ayrı açıp kapatabilirsiniz.',
  },
  {
    id: 'overview', target: 'overview-area', eyebrow: 'GENEL BAKIŞ',
    title: 'Bugün neye bakmanız gerektiğini görün.',
    description: 'Başvuru, kontenjan ve etkinlik durumunun kısa özeti burada. Eventise, mevcut aşamaya göre size tek bir anlamlı sonraki seçenek de sunar.',
  },
  {
    id: 'registration', target: 'registration-area', eyebrow: 'KAYIT & BİLGİLER',
    title: 'Katılımcının göreceği deneyimi hazırlayın.',
    description: 'Etkinlik bilgilerini, kayıt formunu, başvuruları, SSS alanını ve gerekli onamları bu bölümden yönetirsiniz.',
  },
  {
    id: 'tools', target: 'tools-area', eyebrow: 'ETKİNLİK ARAÇLARI',
    title: 'Katılımı daha etkileşimli hale getirin.',
    description: 'Testler, tanışma oyunları ve grup araçlarını önceden hazırlayın. Etkinlik başladığında hepsi aynı çalışma alanından yönetilir.',
  },
  {
    id: 'communication', target: 'communication-area', eyebrow: 'DAVET & İLETİŞİM',
    title: 'Doğru mesajı doğru anda ulaştırın.',
    description: 'Davetleri gönderin, hatırlatmaları planlayın, duyuruları hazırlayın ve otomatik e-posta metinlerini tek yerde düzenleyin.',
  },
  {
    id: 'event-day', target: 'event-day-area', eyebrow: 'KAPI & KATILIM',
    title: 'Etkinlik günü akışını hızlandırın.',
    description: 'QR ile giriş alın, katılımcı listesinden manuel teyit yapın ve kapıda kayıt ihtiyacını aynı ekrandan yönetin.',
  },
  {
    id: 'results', target: 'results-area', eyebrow: 'SONUÇLAR',
    title: 'Etkinliğin etkisini görünür kılın.',
    description: 'Katılım oranlarını inceleyin, raporları indirin ve etkinlik sonrası paylaşılacak kaynakları burada tamamlayın.',
  },
  {
    id: 'certificates', target: 'certificate-area', eyebrow: 'SERTİFİKALAR',
    title: 'Katılımı kalıcı bir çıktıya dönüştürün.',
    description: 'Katılımı teyit edilen kişiler için tasarımlı ve QR ile doğrulanabilir sertifikalar hazırlayıp üretebilirsiniz.',
  },
];
