-- Yalnız hiç düzenlenmemiş kurum şablonlarını yeni, daha açık metinlerle günceller.
-- Kullanıcının özelleştirdiği şablonlar (updatedAt > createdAt) korunur.
UPDATE "EmailTemplate" AS template
SET
  "subject" = defaults.subject,
  "body" = defaults.body,
  "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('application_received',
      'Başvurunuz alındı — {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği için başvurunuzu aldık.\n\nEtkinlik ekibi başvurunuzu değerlendirecek. Sonuç belli olduğunda size yine e-posta ile bilgi vereceğiz.\n\nİlginiz için teşekkür ederiz.\n{{organization.name}}'),
    ('registration_confirmed',
      'Kaydınız tamamlandı — {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği için kaydınız başarıyla tamamlandı.\n\nTarih ve saat: {{event.start_datetime}}\nYer: {{event.location}}\n\nEtkinlik ayrıntıları: {{event.public_url}}\n\nSizi aramızda görmekten mutluluk duyacağız.\n{{organization.name}}'),
    ('application_accepted',
      'Başvurunuz kabul edildi — {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\nGüzel haber: {{event.name}} etkinliği için başvurunuz kabul edildi.\n\nTarih ve saat: {{event.start_datetime}}\nYer: {{event.location}}\n\nEtkinlik ayrıntıları: {{event.public_url}}\n\nSizi aramızda görmekten mutluluk duyacağız.\n{{organization.name}}'),
    ('application_rejected',
      '{{event.name}} başvuru sonucu',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği için yaptığınız başvuruyu bu kez olumlu sonuçlandıramadığımızı üzülerek paylaşmak isteriz.\n\nBaşvurunuza ayırdığınız zaman ve gösterdiğiniz ilgi için teşekkür ederiz. Sizi gelecekteki etkinliklerimizde aramızda görmeyi dileriz.\n\n{{organization.name}}'),
    ('waitlisted',
      'Yedek liste bilgilendirmesi — {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği için başvurunuz yedek listeye alındı.\n\nKontenjan açılması halinde başvurunuzu yeniden değerlendirerek size e-posta ile bilgi vereceğiz. Şimdilik ayrıca bir işlem yapmanız gerekmiyor.\n\nİlginiz için teşekkür ederiz.\n{{organization.name}}'),
    ('reminder_1',
      'Yaklaşıyor: {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği yaklaşıyor. Katılımınız için gerekli bilgileri aşağıda bulabilirsiniz:\n\nTarih ve saat: {{event.start_datetime}}\nYer: {{event.location}}\n\nEtkinlik ayrıntıları: {{event.public_url}}\n\nGörüşmek üzere.\n{{organization.name}}'),
    ('reminder_2',
      'Son hatırlatma: {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği çok yakında başlıyor.\n\nTarih ve saat: {{event.start_datetime}}\nYer: {{event.location}}\n\nKatılımcı alanı: {{event.participant_url}}\n\nSizi bekliyoruz.\n{{organization.name}}'),
    ('event_changed',
      '{{event.name}} bilgileri güncellendi',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğinin bilgilerinde bir güncelleme yapıldı.\n\nGüncel tarih ve saat: {{event.start_datetime}}\nGüncel yer: {{event.location}}\n\nLütfen etkinlik öncesinde ayrıntıları kontrol edin: {{event.public_url}}\n\n{{organization.name}}'),
    ('event_cancelled',
      '{{event.name}} etkinliği hakkında önemli bilgilendirme',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğinin iptal edildiğini üzülerek bildiriyoruz.\n\nYaşanabilecek aksaklık için özür diler, anlayışınız için teşekkür ederiz.\n\n{{organization.name}}'),
    ('post_test',
      'Etkinlik sonrası kısa değerlendirme — {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliği sonrası kısa testi tamamlamanızı rica ediyoruz.\n\nTeste ulaşın: {{event.participant_url}}\n\nKatkınız için teşekkür ederiz.\n{{organization.name}}'),
    ('feedback',
      'Görüşlerinizi paylaşır mısınız? — {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğindeki deneyiminizi bizimle paylaşmanızı rica ediyoruz.\n\nGeri bildiriminiz gelecekteki etkinlikleri geliştirmemize yardımcı olacak: {{event.participant_url}}\n\nKatkınız için teşekkür ederiz.\n{{organization.name}}'),
    ('certificate_ready',
      'Katılım sertifikanız hazır — {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğine ait katılım sertifikanız hazır.\n\nSertifikanızı görüntüleyin: {{certificate.url}}\n\nKatılımınız için teşekkür ederiz.\n{{organization.name}}'),
    ('thank_you',
      'Katılımınız için teşekkür ederiz — {{event.name}}',
      E'Merhaba {{participant.first_name}},\n\n{{event.name}} etkinliğine katıldığınız için teşekkür ederiz.\n\nSizi aramızda görmekten mutluluk duyduk. Gelecek etkinliklerimizde yeniden görüşmek dileğiyle.\n\n{{organization.name}}')
) AS defaults(key, subject, body)
WHERE template.key = defaults.key
  AND template."updatedAt" = template."createdAt";
