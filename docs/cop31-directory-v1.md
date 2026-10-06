# COP31 Etkinlik Rehberi — V1

Bu modül Eventise'in görsel dili ve teknik platformu üzerinde çalışır; ancak ana `Event`, kurum, hesap, başvuru ve biletleme akışlarından bağımsızdır.

## Rotalar

- `/cop31` — Türkçe genel liste
- `/en/cop31` — İngilizce genel liste
- `/cop31/[slug]` ve `/en/cop31/[slug]` — paylaşılabilir etkinlik detayları
- `/cop31/editor` — parola korumalı manuel içerik girişi

## Editör erişimi

Dağıtım ortamında iki uzun ve birbirinden farklı gizli değer tanımlanmalıdır:

```text
COP31_EDITOR_PASSWORD=
COP31_EDITOR_KEY=
```

İlki yalnız web uygulamasının, ikincisi API ile web arasındaki sunucu tarafı çağrının erişimidir. İkisi de ziyaretçiye ya da tarayıcı tarafındaki JavaScript'e gönderilmez. Örnek değişkenler kök `.env.example`, `apps/web/.env.example` ve `apps/api/.env.example` dosyalarındadır.

## Yayına alma

`apps/api/prisma/migrations/20260921090000_add_cop31_directory` migrasyonu dağıtımda uygulanmalıdır. Docker tanımı bunu API başlarken otomatik uygular; diğer dağıtım biçimlerinde standart Prisma migration akışı kullanılmalıdır.

## Editoryal kurallar

- Bir kayıt, COP31 ile somut bağını açıklayan bir bağlantı türü taşımalıdır.
- Kaynak bağlantısı zorunludur; kayıt ve bilgi bağlantıları isteğe bağlıdır.
- En fazla üç konu seçilir.
- Her etkinliğin Türkçe ve İngilizce içeriği iki bağımsız JSON belgesidir. Başlık, özet, açıklama, kurum, mekan, konular, COP31 bağlantısı ve tüm yönlendirme URL’leri dahil kamusal olarak görünen her alan dil belgesinin içinde yer alır.
- Editörde `Türkçe içerik` ve `English content` ayrı ekranlardır; her ekranda JSON içe aktarma, biçimlendirme/doğrulama ve dışa aktarma bulunur. Bir dildeki değer diğerine otomatik düşmez ya da yedek olarak gösterilmez.
- Tarih/saat, saat dilimi, katılım biçimi, yayın durumu ve öne çıkarma seçimi ortak teknik kayıttır.
- Taslaklar yalnız editörde görünür. Yayındaki, ertelenmiş ve iptal edilmiş kayıtlar kamuya açıktır; arşiv kayıtları değildir.
- Öne çıkan seçilmezse ana sayfada ilgili bölüm hiç gösterilmez.
