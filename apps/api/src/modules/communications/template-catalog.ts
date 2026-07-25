// Varsayılan e-posta şablonları. Her kuruma bu katalogdan kopyalanır,
// sonra kurum içeriği serbestçe düzenleyebilir.
// Format: [key, category, subject, body]
// category: 'REMINDER' (etkinlik öncesi hatırlatma — tarih içerebilir)
//           'NOTIFICATION' (durum bildirimi — kabul/red/yedek vb., tarih içermez)
export const emailTemplateCatalog: ReadonlyArray<readonly [string, string, string, string]> = [
  // === DURUM BİLDİRİMLERİ (kayıt sürecinde otomatik gider) ===
  ['application_received', 'NOTIFICATION',
    'Başvurunuzu aldık, {{participant.first_name}} 👋',
    'Merhaba {{participant.first_name}},\n{{event.name}} etkinliğine başvurunuzu aldık. Etkinlik ekibi inceleyip en kısa sürede dönüş yapacak.'],
  ['registration_confirmed', 'NOTIFICATION',
    'Kaydınız onaylandı — {{event.name}}',
    'Merhaba {{participant.first_name}},\nHarika haber: {{event.name}} etkinliğine kaydınız onaylandı. Sizi aramızda görmek için sabırsızlanıyoruz.'],
  ['application_accepted', 'NOTIFICATION',
    'Hoş geldiniz, {{participant.first_name}}!',
    'Merhaba {{participant.first_name}},\n{{event.name}} başvurunuz kabul edildi, tebrikler!\nEtkinlik {{event.location}} adresinde gerçekleşecek. Detaylar için: {{event.public_url}}'],
  ['application_rejected', 'NOTIFICATION',
    '{{event.name}} başvuru sonucu',
    'Merhaba {{participant.first_name}},\nBu kez sizi aramıza dahil edemediğimiz için üzgünüz. Kontenjan ve uygunluk kısıtları nedeniyle böyle bir karar vermek zorunda kaldık.\nGelecek etkinliklerde görüşmek dileğiyle.'],
  ['waitlisted', 'NOTIFICATION',
    'Yedek listedesiniz, {{participant.first_name}}',
    'Merhaba {{participant.first_name}},\n{{event.name}} için yedek listeye alındınız. Kontenjan açılırsa sizi haberdar edeceğiz.'],

  // === HATIRLATMALAR (etkinlik öncesi, tarih içerir) ===
  ['reminder_1', 'REMINDER',
    'Hatırlatma: {{event.name}}',
    'Merhaba {{participant.first_name}},\nKısa bir hatırlatma: {{event.name}} etkinliği yakında.\nTarih: {{event.start_datetime}}\nYer: {{event.location}}\nEtkinlik sayfası: {{event.public_url}}'],
  ['reminder_2', 'REMINDER',
    'Son hatırlatma — {{event.name}}',
    'Merhaba {{participant.first_name}},\nEtkinlik çok yakında başlıyor, hazır olun.\n{{event.start_datetime}} tarihinde, {{event.location}} adresinde sizi bekliyoruz.\nEtkinlik alanı: {{event.participant_url}}'],

  // === DURUM BİLDİRİMLERİ (etkinlik değişiklikleri) ===
  ['event_changed', 'NOTIFICATION',
    '{{event.name}} bilgileri güncellendi',
    'Merhaba {{participant.first_name}},\nKatılacağınız etkinlikte bazı bilgiler değişti. Lütfen yeni detayları kontrol edin.\nEtkinlik sayfası: {{event.public_url}}'],
  ['event_cancelled', 'NOTIFICATION',
    'Üzgünüz: {{event.name}} iptal edildi',
    'Merhaba {{participant.first_name}},\n{{event.name}} etkinliği iptal edilmek zorunda kaldı. Sizi de üzdüğümüz için özür dileriz.'],

  // === DURUM BİLDİRİMLERİ (etkinlik içi/sonrası modüller) ===
  ['post_test', 'NOTIFICATION',
    'Son testinizi doldurun — {{event.name}}',
    'Merhaba {{participant.first_name}},\nEtkinliğin son testini doldurma vakti geldi. Kısa sürüyor, hemen tamamlayabilirsiniz.\nTeste buradan ulaşın: {{event.participant_url}}'],
  ['feedback', 'NOTIFICATION',
    'Görüşleriniz bizim için önemli, {{participant.first_name}}',
    'Merhaba {{participant.first_name}},\n{{event.name}} etkinliğiyle ilgili deneyiminizi paylaşır mısınız?\nGeri bildiriminiz gelecekteki etkinlikleri şekillendirecek: {{event.participant_url}}'],
  ['certificate_ready', 'NOTIFICATION',
    'Sertifikanız hazır, {{participant.first_name}} 🎉',
    'Merhaba {{participant.first_name}},\n{{event.name}} etkinliğine katılımınız için sertifikanız hazır.\nSertifika: {{certificate.url}}'],
  ['thank_you', 'NOTIFICATION',
    'Teşekkürler, {{participant.first_name}}!',
    'Merhaba {{participant.first_name}},\n{{event.name}} etkinliğimize katıldığınız için içten teşekkür ederiz. Sizinle birlikte olmak güzeldi.'],
];
