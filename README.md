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
# Google ile giriş

Eventise, mevcut e-posta/şifre girişine ek olarak Google OAuth 2.0 ile girişi destekler.

1. Google Cloud Console'da **Web application** türünde bir OAuth istemcisi oluşturun.
2. Yetkili yönlendirme URI'si olarak yerel ortamda `http://localhost:8080/api/session/google/callback`, canlı ortamda ise `https://ALAN-ADINIZ/api/session/google/callback` ekleyin.
3. İstemci değerlerini `.env` dosyasına `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` olarak yazın.
4. `PUBLIC_APP_URL` değerinin tarayıcıdan açılan tam Eventise adresiyle aynı olduğundan emin olun.
5. Uygulamayı yeniden başlatın. Veritabanı migration'ı Docker açılışında otomatik uygulanır.

Google yalnızca doğrulanmış e-posta adreslerini kabul eder. Aynı e-posta ile önceden açılmış bir Eventise hesabı varsa Google hesabı güvenli biçimde mevcut hesaba bağlanır.
