export const EVENTISE_TOUR_VERSION = 'event-workspace-v3';

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
    title: 'Bütün hazırlıklar tek bir merkezde.',
    description: 'Etkinliğin kimliğini, tarihini ve güncel durumunu burada görür; hazırlık alanları arasında üst menüden geçersiniz.',
  },
  {
    id: 'publication', target: 'publication-controls', eyebrow: 'YAYIN KONTROLLERİ',
    title: 'Sayfayı ve kayıtları ayrı ayrı yönetin.',
    description: 'Etkinlik sayfasını görünür yapabilir, yeni başvuruları ise ihtiyacınıza göre ayrıca açıp kapatabilirsiniz.',
  },
  {
    id: 'overview', target: 'event-overview', eyebrow: 'GENEL BAKIŞ',
    title: 'Önceliğiniz tek bakışta belli olsun.',
    description: 'Başvuru, kontenjan ve hazırlık durumunu burada izler; mevcut aşamaya göre önerilen sıradaki adıma geçersiniz.',
  },
  {
    id: 'registration', target: 'registration-area', eyebrow: 'ETKİNLİK BİLGİLERİ',
    title: 'Katılımcının göreceği deneyimi hazırlayın.',
    description: 'Tanıtım metinlerini, sayfa tasarımını, kayıt formunu, başvuruları, SSS alanını ve onamları birlikte yönetin.',
  },
  {
    id: 'tools', target: 'tools-area', eyebrow: 'ETKİNLİK ARAÇLARI',
    title: 'İhtiyacınız olan araçları seçin.',
    description: 'Test, tanışma oyunu, geri bildirim ve grup araçlarını etkinlikten önce hazırlayıp aynı alandan yönetin.',
  },
  {
    id: 'communication', target: 'communication-area', eyebrow: 'DAVET & İLETİŞİM',
    title: 'Doğru mesajı doğru anda ulaştırın.',
    description: 'Davet gönderin, hatırlatma planlayın, duyuru hazırlayın; e-posta şablonlarını ve kaynakları tek yerde düzenleyin.',
  },
  {
    id: 'event-day', target: 'event-day-area', eyebrow: 'KAPI & KATILIM',
    title: 'Etkinlik günü akışını hızlandırın.',
    description: 'QR ile giriş alın, katılımcıyı listeden teyit edin ve gerektiğinde kapıda yeni kayıt oluşturun.',
  },
  {
    id: 'results', target: 'results-area', eyebrow: 'SONUÇLAR',
    title: 'Etkinliğin etkisini görünür kılın.',
    description: 'Katılımı ve geri bildirimleri inceleyin, raporları indirin ve etkinlik sonrası paylaşılacak içerikleri tamamlayın.',
  },
  {
    id: 'certificates', target: 'certificate-area', eyebrow: 'SERTİFİKALAR',
    title: 'Katılımı kalıcı bir çıktıya dönüştürün.',
    description: 'Sertifikanızı canlı önizlemeyle tasarlayın; katılımı teyit edilen kişiler için QR ile doğrulanabilir belgeler üretin.',
  },
];
