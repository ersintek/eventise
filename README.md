# Birlikte — STK Etkinlik Yönetimi

Mobil uyumlu kurum paneli ilk ürün demosu. Docker ile çalışır ve Dokploy'a doğrudan alınabilir.

## Demo özellikleri

- Genel bakış, yaklaşan etkinlikler, görevler ve kota özeti
- Aranabilir ve durum bazında filtrelenebilir etkinlik alanı
- Duyuru metninden tarih, saat ve kontenjan çıkaran üç adımlı oluşturma akışı
- Kayıt modeli, görünürlük ve onam seçimi
- Tarayıcıda kalıcı taslaklar ve taslaktan yayınlama

```bash
docker compose up --build
```

Uygulama `http://localhost:8080`, sağlık kontrolü `/health` adresindedir.

## Dokploy

Repository veya Compose kaynağı olarak ekleyin; `compose.yaml` kök dizindedir. Uygulama anahtarı ve diğer gizli değerleri Dokploy Environment ekranında tanımlayın, repoya eklemeyin.
