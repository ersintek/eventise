# Eventise Güvenlik ve Veri İhlali Kontrol Listesi

## Yayın öncesi

- Production alan adı HTTPS kullanıyor.
- JWT, veritabanı, SMTP ve depolama parolaları benzersiz ve güçlü.
- Production Swagger kapalı.
- PostgreSQL ve S3 yedekleri etkin; en az bir geri yükleme testi yapılmış.
- Yedek saklama süresi en fazla 90 gün.
- S3 kovası herkese açık değil; dosyalar süreli bağlantıyla sunuluyor.
- Sistem yöneticisi hesapları sınırlı ve güçlü parolalı.
- Sunucu, veritabanı, S3 ve SMTP sağlayıcısının ülkesi veri envanterinde kayıtlı.

## Şüpheli veri ihlalinde

1. Olayın başlangıç ve tespit zamanını kaydet.
2. Etkilenen hesabı, anahtarı veya erişimi kapat; delil niteliğindeki logları koru.
3. Etkilenen veri türlerini, kişi sayısını ve kurumları belirle.
4. İlgili STK'lara gecikmeden haber ver.
5. Eventise veri sorumlusuysa KVKK bildirim gerekliliğini derhal değerlendir; gereken bildirim için 72 saatlik süreyi esas al.
6. Etkilenen kişilere açık ve sade bildirim hazırla.
7. Kök nedeni gider, parolaları/anahtarları yenile ve yapılan işlemleri kayıt altına al.
