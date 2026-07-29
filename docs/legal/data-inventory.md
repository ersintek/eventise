# Eventise Veri Envanteri

Sürüm: 1.0 — 25.07.2026

| Süreç | Veriler | Amaç | Muhtemel rol | Saklama |
|---|---|---|---|---|
| Kullanıcı hesabı | Ad, soyad, e-posta, parola özeti, Google hesap kimliği | Hesap ve oturum yönetimi | Eventise veri sorumlusu | Hesap süresi + 30 günlük silme süreci |
| Güvenlik | IP, oturum, işlem ve denetim kayıtları | Güvenlik, kötüye kullanım önleme | Eventise veri sorumlusu | 1 yıl |
| Kurum hesabı | Kurum adı/türü, görev, iletişim e-postası, site | Kurumsal çalışma alanı | Eventise veri sorumlusu | Kurum hesabı süresi + 30 gün |
| Etkinlik kaydı | Ad, soyad, e-posta, form cevapları, onamlar | Başvuru ve etkinlik yönetimi | STK veri sorumlusu; Eventise veri işleyen | Etkinlikten sonra 1 yıl |
| Katılım | Giriş zamanı/yöntemi, katılım durumu | Etkinlik operasyonu ve sertifika | STK veri sorumlusu; Eventise veri işleyen | Etkinlikten sonra 1 yıl |
| Fotoğraf/dosya | Yüklenen içerik, dosya adı ve yükleyen kaydı | Galeri ve etkinlik kaynakları | STK veri sorumlusu; Eventise veri işleyen | Etkinlik kaydıyla birlikte |
| Geri bildirim/test | Yanıtlar, puanlar, katılımcı bağlantısı | Değerlendirme ve raporlama | STK veri sorumlusu; Eventise veri işleyen | Etkinlikten sonra 1 yıl |
| İletişim | E-posta tercihleri, gönderim ve hata kayıtları | Operasyonel bildirimler; izin varsa duyuru | Amaca göre Eventise veya STK | 1 yıl |
| Destek | Sorun açıklaması, iletişim ve erişim kayıtları | Destek sağlama | Eventise veri sorumlusu | 1 yıl |

## Dış hizmetler

Üretim öncesinde gerçek sağlayıcı ve sunucu bölgeleri doldurulmalıdır:

- PostgreSQL/veritabanı: [SAĞLAYICI VE ÜLKE]
- S3 uyumlu dosya depolama: [SAĞLAYICI VE ÜLKE]
- SMTP/e-posta: [SAĞLAYICI VE ÜLKE]
- Google OAuth: Google

## Yayın öncesi engeller

- Veri sorumlusu ad-soyad ve iletişim e-postası kesinleştirilmeli.
- Üretim sunucularının ülkeleri ve yurt dışı aktarım durumu doğrulanmalı.
- Özel nitelikli veri alınan formlarda STK'nın uygun aydınlatma/onam metni sağlaması gerekir.
