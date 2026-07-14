# Eventise — STK Etkinlik Yönetim Sistemi

Etkinlik öncesi, etkinlik günü ve etkinlik sonrası süreçleri kapsayan modüler monolit. Next.js web, NestJS REST API, PostgreSQL, veritabanı tabanlı worker kuyruğu, S3 uyumlu depolama, SMTP ve sağlayıcıdan bağımsız AI/PDF adaptörlerinden oluşur.

## Yerel çalıştırma

```bash
cp .env.example .env
docker compose up --build
```

- Web: `http://localhost:8080`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/swagger`
- Sağlık: `http://localhost:3000/api/health`

## Doğrulama

```bash
npm ci
npm run build
npm test
npm run test:integration -w @eventise/api
```

Entegrasyon paketi temiz geçici PostgreSQL üzerinde migration, seed, altı ürün aşaması, tenant izolasyonu, davetli etkinlik, misafir hesap kurulumu, silme/kurtarma ve 100 eşzamanlı sağlık isteği senaryolarını çalıştırır.

## Dokploy

Dokploy’da repository içindeki `compose.yaml` dosyasını Compose kaynağı olarak kullanın. Aşağıdaki değerleri Environment ekranında tanımlayın; gizli değerleri repoya yazmayın:

- `POSTGRES_PASSWORD`
- `JWT_SECRET` (en az 32 rastgele karakter)
- `SYSTEM_ADMIN_EMAILS` (virgülle ayrılmış ilk sistem yöneticileri)
- `WEB_ORIGIN` ve `PUBLIC_APP_URL` (web alan adınız)
- SMTP değişkenleri
- S3 endpoint, bucket ve erişim anahtarları

API container’ı migration ve idempotent seed işlemini uygular. Ayrı worker container’ı e-posta, hatırlatma, sertifika, rapor, kapanış ve silme job’larını yürütür. PostgreSQL verisi named volume’da kalır. API yalnız `/api/health` başarılı olduğunda web servisi başlatılır.

İlk admin, `SYSTEM_ADMIN_EMAILS` içindeki adresle hesap oluşturduğunda `SYSTEM_ADMIN` rolünü alır. Bootstrap sonrası bu ortam değişkenini yalnız kontrollü adreslerle sınırlandırın.
