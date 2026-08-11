# Eventise görsel dönüşüm kontrol listesi

Bu belge, 2026 görsel dönüşümünün yarıda kalmaması ve hiçbir ürün yüzeyinin atlanmaması için yaşayan kontrol listesidir. Görsel referans; yenilenen ana sayfa, etkinlik kontrol merkezi, sayfa tasarım editörü ve yeni etkinlik oluşturma akışıdır.

## Tasarım ilkeleri

- Sıcak kırık beyaz zemin, kömür renkli metin, ölçülü mor ve mercan vurgu.
- Her görünümde bir baskın görev; ikincil ayarlar aşamalı açılır.
- Gereksiz iç içe kart, degrade, emoji ve dekoratif ikon kullanılmaz.
- Yönetim, katılımcı ve saha operasyonu aynı sistemin amaca göre uyarlanmış üç modudur.
- Her yüzey masaüstü, tablet, mobil; boş, yükleniyor, hata ve başarı durumlarıyla tamamlanır.

## Faz 1 — Ortak UI temeli

- [x] Renk, tipografi, boşluk, radius, gölge ve odak tokenları
- [x] Yönetim sayfası kabuğu ve sayfa başlıkları
- [x] Kart, sekme, durum rozeti, metrik, tablo ve liste kalıpları
- [x] Form, seçim kartı, segmented control, disclosure ve dosya yükleme
- [x] Notice, toast, modal, boş durum, hata ve skeleton kalıpları
- [x] Mobil navigasyon ve 44 px dokunma hedefleri

## Faz 2 — Etkinlik çalışma alanı

- [x] `/dashboard/events/[eventId]` genel bakış
- [x] Ayarlar: sayfa tasarımı, bilgiler, SSS, başvurular, formlar ve onam
- [x] İletişim: davet, hatırlatma, duyuru, e-posta şablonları, kaynak, fotoğraflar
- [x] Araçlar: testler, tanışma oyunu, geri bildirim, gruplar
- [x] `/day` kapı ve katılım
- [x] `/post-event` sonuçlar ve çıktılar
- [x] `/certificates` sertifika stüdyosu

## Faz 3 — Yönetim ve hesap yüzeyleri

- [x] `/dashboard`
- [x] `/dashboard/events/new`
- [x] `/dashboard/settings`
- [x] `/dashboard/quota`
- [x] `/login` ve `/register` rol seçimi
- [x] Katılımcı/STK giriş ve kayıt sayfaları
- [x] Şifre sıfırlama ve hesap tamamlama
- [x] Kurum erişimi ve kurum oluşturma
- [x] Kullanıcı ve kurum koşulları kabul akışları

## Faz 4 — Katılımcı ve herkese açık yüzeyler

- [x] `/participant` keşif, etkinlikler, geçmiş, takipler, profil
- [x] `/participant/event/[eventId]` görev ve içerik merkezi
- [x] `/events/[orgSlug]/[eventSlug]` genel etkinlik ve kayıt
- [x] `/check-in/[eventToken]`
- [x] `/certificates/[code]`

## Faz 5 — Destek, ürün ve sistem yüzeyleri

- [x] `/admin` içindeki yedi yönetim görünümü
- [x] `/dashboard/contact`
- [x] `/dashboard/about`
- [x] `/dashboard/about/updates`
- [x] `/yardim`
- [x] Hukuki metin okuma sayfaları
- [x] 404, hata, yükleniyor ve genel boş durumlar

## Faz 6 — Yardım içeriği ve ürün tanıtımı

Bu faz görsel dönüşümün zorunlu parçasıdır; ertelenmiş veya isteğe bağlı değildir.

- [x] Ürün tanıtım turundaki hedefleri yeni navigasyon ve ekranlarla eşleştir
- [x] Tur metinlerini yeni görev akışlarına göre yeniden yaz
- [x] Kullanım kılavuzundaki tüm menü yollarını güncelle
- [x] Yeni etkinlik, görsel editör, iletişim, etkinlik günü ve sertifika bölümlerini yeniden anlat
- [x] Yardım hızlı yollarını ve arama terimlerini yeni adlarla güncelle
- [x] Ürün günlüğüne görsel dönüşüm kaydı ekle

## Tamamlanma ölçütleri

- [x] Tüm sayfa ve alt görünümler ortak görsel sistemde
- [x] Tüm önemli durumlar yalnız renkle değil metin ve biçimle de anlaşılır
- [x] Klavye odağı, kontrast ve dokunma hedefleri doğrulandı
- [ ] Üretim derlemesi başarılı
- [ ] Canlı dağıtım sonrası temel rotalar erişilebilir
