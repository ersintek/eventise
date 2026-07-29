// Varsayılan e-posta şablonları. Her kuruma bu katalogdan kopyalanır,
// sonra kurum içeriği serbestçe düzenleyebilir.
// Format: [key, category, subject, body]
// category: 'REMINDER' (etkinlik öncesi hatırlatma — tarih içerebilir)
//           'NOTIFICATION' (durum bildirimi — kabul/red/yedek vb., tarih içermez)
export const emailTemplateCatalog: ReadonlyArray<readonly [string, string, string, string]> = [
  // === DURUM BİLDİRİMLERİ (kayıt sürecinde otomatik gider) ===
  ['application_received', 'NOTIFICATION',
    'Başvurunuzu aldık — {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği için başvurunuzu aldık.\n\nEtkinlik ekibi başvurunuzu değerlendirecek. Sonuç belli olduğunda size yine e-posta ile bilgi vereceğiz.\n\nİlginiz için teşekkür ederiz.\n{{organization.name}}'],
  ['registration_confirmed', 'NOTIFICATION',
    'Kaydınız tamamlandı — {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği için kaydınız başarıyla tamamlandı.\n\nTarih ve saat: {{event.start_datetime}}\nYer: {{event.location}}\n\nEtkinlik ayrıntıları: {{event.public_url}}\n\nSizi aramızda görmekten mutluluk duyacağız.\n{{organization.name}}'],
  ['application_accepted', 'NOTIFICATION',
    'Başvurunuz kabul edildi — {{event.name}}',
    'Merhaba {{participant.first_name}},\n\nGüzel haber: {{event.name}} etkinliği için başvurunuz kabul edildi.\n\nTarih ve saat: {{event.start_datetime}}\nYer: {{event.location}}\n\nEtkinlik ayrıntıları: {{event.public_url}}\n\nSizi aramızda görmekten mutluluk duyacağız.\n{{organization.name}}'],
  ['application_rejected', 'NOTIFICATION',
    '{{event.name}} başvuru sonucu',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği için yaptığınız başvuruyu bu kez olumlu sonuçlandıramadığımızı üzülerek paylaşmak isteriz.\n\nBaşvurunuza ayırdığınız zaman ve gösterdiğiniz ilgi için teşekkür ederiz. Sizi gelecekteki etkinliklerimizde aramızda görmeyi dileriz.\n\n{{organization.name}}'],
  ['waitlisted', 'NOTIFICATION',
    'Yedek liste bilgilendirmesi — {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği için başvurunuz yedek listeye alındı.\n\nKontenjan açılması halinde başvurunuzu yeniden değerlendirerek size e-posta ile bilgi vereceğiz. Şimdilik ayrıca bir işlem yapmanız gerekmiyor.\n\nİlginiz için teşekkür ederiz.\n{{organization.name}}'],

  // === HATIRLATMALAR (etkinlik öncesi, tarih içerir) ===
  ['reminder_1', 'REMINDER',
    'Yaklaşıyor: {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği yaklaşıyor. Katılımınız için gerekli bilgileri aşağıda bulabilirsiniz:\n\nTarih ve saat: {{event.start_datetime}}\nYer: {{event.location}}\n\nEtkinlik ayrıntıları: {{event.public_url}}\n\nGörüşmek üzere.\n{{organization.name}}'],
  ['reminder_2', 'REMINDER',
    'Son hatırlatma: {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği çok yakında başlıyor.\n\nTarih ve saat: {{event.start_datetime}}\nYer: {{event.location}}\n\nKatılımcı alanı: {{event.participant_url}}\n\nSizi bekliyoruz.\n{{organization.name}}'],

  // === DURUM BİLDİRİMLERİ (etkinlik değişiklikleri) ===
  ['event_changed', 'NOTIFICATION',
    '{{event.name}} bilgileri güncellendi',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğinin bilgilerinde bir güncelleme yapıldı.\n\nGüncel tarih ve saat: {{event.start_datetime}}\nGüncel yer: {{event.location}}\n\nLütfen etkinlik öncesinde ayrıntıları kontrol edin: {{event.public_url}}\n\n{{organization.name}}'],
  ['event_cancelled', 'NOTIFICATION',
    '{{event.name}} etkinliği hakkında önemli bilgilendirme',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğinin iptal edildiğini üzülerek bildiriyoruz.\n\nYaşanabilecek aksaklık için özür diler, anlayışınız için teşekkür ederiz.\n\n{{organization.name}}'],

  // === DURUM BİLDİRİMLERİ (etkinlik içi/sonrası modüller) ===
  ['post_test', 'NOTIFICATION',
    'Etkinlik sonrası kısa değerlendirme — {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği sonrası kısa testi tamamlamanızı rica ediyoruz.\n\nTeste ulaşın: {{event.participant_url}}\n\nKatkınız için teşekkür ederiz.\n{{organization.name}}'],
  ['feedback', 'NOTIFICATION',
    'Görüşlerinizi paylaşır mısınız? — {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğindeki deneyiminizi bizimle paylaşmanızı rica ediyoruz.\n\nGeri bildiriminiz gelecekteki etkinlikleri geliştirmemize yardımcı olacak: {{event.participant_url}}\n\nKatkınız için teşekkür ederiz.\n{{organization.name}}'],
  ['certificate_ready', 'NOTIFICATION',
    'Katılım sertifikanız hazır — {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğine ait katılım sertifikanız hazır.\n\nSertifikanızı görüntüleyin: {{certificate.url}}\n\nKatılımınız için teşekkür ederiz.\n{{organization.name}}'],
  ['thank_you', 'NOTIFICATION',
    'Katılımınız için teşekkür ederiz — {{event.name}}',
    'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğine katıldığınız için teşekkür ederiz.\n\nSizi aramızda görmekten mutluluk duyduk. Gelecek etkinliklerimizde yeniden görüşmek dileğiyle.\n\n{{organization.name}}'],
];
