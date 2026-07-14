# Birlikte — STK Etkinlik Yönetimi

Mobil uyumlu kurum paneli ilk ürün demosu. Docker ile çalışır ve Dokploy'a doğrudan alınabilir.

```bash
docker compose up --build
```

Uygulama `http://localhost:8080`, sağlık kontrolü `/health` adresindedir.

## Dokploy

Repository veya Compose kaynağı olarak ekleyin; `compose.yaml` kök dizindedir. Uygulama anahtarı ve diğer gizli değerleri Dokploy Environment ekranında tanımlayın, repoya eklemeyin.
