# Eventise mimarisi

Eventise, sınırları açık bir modüler monolittir. HTTP API ve worker aynı domain/application modüllerini kullanır; ayrı süreçler olarak çalışır ve aynı PostgreSQL veritabanına bağlanır.

## Modül kuralları

- Modüller başka bir modülün tablosunu doğrudan okumaz; uygulama servisleri veya domain olayları kullanılır.
- Kurum kapsamlı her giriş noktası `OrganizationAccessService` ile üyelik ve rol kontrolü yapar.
- Tier değerleri ve kurum istisnaları veritabanından çözülür; özellik modüllerinde sabit limit bulunmaz.
- E-posta, depolama ve kuyruk `port` sınıfları üzerinden kullanılır.
- Kişisel veri, token, form cevabı ve yüklenen içerik loglanmaz.
- Uzun işler `BackgroundJob` üzerinden worker'a aktarılır ve idempotency key ile tekrar çalışmaya dayanıklıdır.

## Aşama geçiş kapısı

Her aşama için TypeScript derlemesi, birim testleri, tenant izolasyonu testleri, ilgili entegrasyon testleri ve Docker health check geçmeden sonraki aşama tamamlanmış sayılmaz.
