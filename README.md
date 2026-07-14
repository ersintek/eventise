# Birlikte — STK Etkinlik Yönetimi

Mobil uyumlu kurum paneli ilk ürün demosu. Docker ile çalışır ve Dokploy'a doğrudan alınabilir.

## Demo özellikleri

- Genel bakış, yaklaşan etkinlikler, görevler ve kota özeti
- Aranabilir ve durum bazında filtrelenebilir etkinlik alanı
- Duyuru metninden tarih, saat ve kontenjan çıkaran üç adımlı oluşturma akışı
- Kayıt modeli, görünürlük ve onam seçimi
- Tarayıcıda kalıcı taslaklar ve taslaktan yayınlama
- Katılımcı arama, etkinlik/durum filtreleri ve başvuru sayaçları
- Tekli veya toplu kabul, ret ve yedek liste işlemleri
- UTF-8 uyumlu CSV katılımcı dışa aktarımı
- Kişisel veri içermeyen ortak etkinlik QR ekranı
- İdempotent katılım teyidi ve canlı saha sayaçları
- Mükerrer e-posta kontrolüyle kapıda kayıt

```bash
docker compose up --build
```

Uygulama `http://localhost:8080`, sağlık kontrolü `/health` adresindedir.

## Dokploy

Repository veya Compose kaynağı olarak ekleyin; `compose.yaml` kök dizindedir. Uygulama anahtarı ve diğer gizli değerleri Dokploy Environment ekranında tanımlayın, repoya eklemeyin.
