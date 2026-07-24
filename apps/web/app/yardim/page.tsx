import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'STK Rehberi — Eventise',
  description: 'Sivil toplum kuruluşları için etkinlik yönetimi rehberi: kayıt, etkinlik oluşturma, yönetim ve etkinlik günü.',
};

type QA = { q: string; a: string };
type Section = { id: string; title: string; intro?: string; items: QA[] };

const sections: Section[] = [
  {
    id: 'baslangic',
    title: 'Başlamadan önce',
    intro: 'Eventise, sivil toplum kuruluşlarının etkinliklerini kayıttan sertifikaya kadar tek bir yerden yönetmesi için tasarlandı. Ücretsiz başlayabilirsiniz.',
    items: [
      {
        q: 'Nasıl kayıt olunur?',
        a: 'Kayıt sayfasında iki seçenek göreceksiniz: "STK olarak katıl" ve "Etkinliklere katıl". Etkinlik düzenleyecekseniz "STK olarak katıl"ı seçin. Ardından adınızı, e-postanızı ve en az 12 karakterli bir şifreyi girin. Hesabınız oluşturulduğunda sizi kurum (çalışma alanı) oluşturma adımına götüreceğiz.',
      },
      {
        q: 'STK olarak katılmak ile etkinliklere katılmak arasındaki fark nedir?',
        a: '"STK olarak katıl" seçeneği bir kurum hesabıdır — etkinlik oluşturabilir, katılımcıları yönetebilir, modüller hazırlayabilirsiniz. "Etkinliklere katıl" ise yalnızca bir katılımcı hesabıdır; başka STK\'ların etkinliklerine kayıt olup içeriklere erişirsiniz. Aynı e-postayla iki rolu da sonradan kullanamazsınız, bu yüzden STK görevlileri "STK olarak katıl"ı seçmelidir.',
      },
      {
        q: 'Kurum (çalışma alanı) nedir, neden gerekli?',
        a: 'Kurum, etkinliklerinizi ve ekibinizi bir arada tutan çalışma alanıdır. Örneğin "İklim Derneği" adında bir kurum oluşturduğunuzda, tüm etkinlikleriniz bu kurum altında toplanır ve kurumunuza davet ettiğiniz ekip üyeleri bu etkinliklere erişebilir. Kurum olmadan etkinlik oluşturamazsınız.',
      },
      {
        q: 'Ekibe nasıl kişi eklerim?',
        a: 'Kurumunuzu oluşturduktan sonra, soldaki menüden "Ekip" bölümüne girin. Buradan ekip üyelerini e-postalarıyla davet edebilir ve rollerini belirleyebilirsiniz. "Kurum yöneticisi" her şeyi yapabilir; "Etkinlik yöneticisi" ise yalnızca atandığı etkinlikleri yönetir.',
      },
    ],
  },
  {
    id: 'olusturma',
    title: 'Etkinlik oluşturma',
    intro: 'Yeni bir etkinlik 4 adımlık bir sihirbazla oluşturulur. "Yeni etkinlik" düğmesine tıklayın ve adımları takip edin.',
    items: [
      {
        q: 'Etkinlik nasıl oluşturulur?',
        a: 'Panele girdiğinizde "Yeni etkinlik" düğmesine tıklayın. 4 adım sizi karşılar: 1) Temel bilgiler (ad ve açıklama), 2) Tarih ve yer (başlangıç/bitiş zamanı ve bağlantı kısa adı), 3) Başvuru (onaylı mı, doğrudan mı; kontenjan), 4) Kontrol (özeti gözden geçirip oluşturun). Adımları tamamladığınızda etkinlik taslak olarak kaydedilir.',
      },
      {
        q: '"Bağlantı kısa adı" nedir?',
        a: 'Bu, etkinliğinizin herkese açık bağlantısında görünen kısımdır; örneğin /events/iklim-dernegi/genclik-bulusmasi. Otomatik olarak etkinlik adınızdan üretilir ama dilediğiniz gibi düzenleyebilirsiniz. Katılımcılarla paylaşacağınız adres budur.',
      },
      {
        q: '"Onaylı başvuru" ile "Doğrudan kayıt" arasındaki fark nedir?',
        a: '"Onaylı başvuru"da her katılımcı başvurusunu siz tek tek değerlendirip kabul veya reddedersiniz — davetli/kontrollü etkinlikler için ideal. "Doğrudan kayıt"ta uygun başvurular otomatik olarak kabul edilir; büyük, açık etkinlikler için pratiktir. Dilediğinizi seçebilir, sonra ayarlardan değiştirebilirsiniz.',
      },
      {
        q: 'Görünürlük seçenekleri ne demek?',
        a: 'Üç seçenek var: "Herkese açık" — etkinlik herkes tarafından bulunabilir. "Bağlantıya sahip olanlar" — yalnızca bağlantıyı paylaştığınız kişiler kayıt olabilir. "Yalnız davetliler" — yalnızca davet ettiğiniz e-posta adresleri kayıt olabilir. Gizlilik ihtiyacınıza göre seçin.',
      },
      {
        q: 'Kontenjanı nasıl belirlerim?',
        a: 'Başvuru adımında bir sayı girersiniz; etkinlik başına ücretsiz katılımcı sınırı 500 kişidir. İhtiyacınız daha yüksekse sistem yöneticisiyle iletişime geçip geçici bir istisna tanımlanabilir.',
      },
    ],
  },
  {
    id: 'yayin',
    title: 'Yayınlama ve kayıtlar',
    intro: 'Etkinliğiniz taslak halindeyken kimse göremez. Yayınladığınızda kayıtlar başlayabilir.',
    items: [
      {
        q: 'Taslağı nasıl yayınlarım?',
        a: 'Etkinlik panelinde üstte bir araç çubuğu vardır. "Yayında" durumunu açan bir toggle (anahtar) bulunur. Bunu açtığınızda etkinlik herkese açık bağlantıda görünür hale gelir. Kapatırsanız tekrar gizlenir.',
      },
      {
        q: 'Kayıtları nasıl açarım/kapatırım?',
        a: 'Aynı araç çubuğunda "Kayıt açık" adında ikinci bir toggle vardır. Yayını açtıktan sonra bu toggle ile kayıtları açıp kapatabilirsiniz. Kontenjan dolduğunda kayıtlar otomatik kapanır.',
      },
      {
        q: 'Başvuruları nasıl değerlendiririm?',
        a: 'Eğer "Onaylı başvuru" modunu seçtiyseniz, panelde "İletişim" bölümünde başvurular listelenir. Her başvuruyu tek tek "Kabul et" veya "Reddet" şeklinde değerlendirebilirsiniz. Kabul edilenler etkinlik günü içeriklerine erişebilir.',
      },
    ],
  },
  {
    id: 'yonetim',
    title: 'Etkinlik yönetimi',
    intro: 'Her etkinliğin panelinde 6 bölüm vardır. Bunlar etkinliğin yaşam döngüsünü takip eder.',
    items: [
      {
        q: 'Altı bölüm ne işe yarar?',
        a: 'Dashboard: etkinliğin genel görünümü, katılımcı sayısı ve son etkinlikler. Ayarlar: etkinlik adı, tarih, kontenjan, görünürlük ve formlar. Modüller: testler, oyunlar, geri bildirim, duyurular, dosyalar. İletişim: başvuru değerlendirme ve duyuru gönderme. Etkinlik Günü: canlı check-in ve operasyon. Etkinlik Sonrası: sertifika ve değerlendirme.',
      },
      {
        q: '"Etkinlik Günü" ne zaman aktifleşir?',
        a: 'Etkinlik başlangıç saati geldiğinde, paneldeki "Yayına al" (go-live) düğmesiyle etkinliği canlı moda alırsınız. Bu, check-in ve canlı modülleri (oyunlar, duyurular) aktifleştirir. Etkinlik bittiğinde "Etkinlik Sonrası" bölümüne geçebilirsiniz.',
      },
    ],
  },
  {
    id: 'moduller',
    title: 'Modüller',
    intro: 'Modüller bölümünde katılımcıların etkinlik öncesi, sırasında ve sonrasında etkileşim kuracağı içerikleri hazırlarsınız.',
    items: [
      {
        q: 'Testler (ön test / son test) ne işe yarar?',
        a: 'Ön test, etkinlik öncesinde katılımcıların bilgi düzeyini veya beklentisini ölçer. Son test ise etkinlik sonrasında ne öğrendiklerini değerlendirir. Çoktan seçmeli, açık uçlu veya işaretlemeli sorular ekleyebilirsiniz. İstediğiniz zaman açıp kapatabilirsiniz.',
      },
      {
        q: 'Tanışma oyunu nasıl çalışır?',
        a: 'Katılımcılara eğlenceli bir soru sorulur (örneğin "Bugün enerjini bir emojiyle anlat"). Herkes yanıtlarını girer; siz "Kartı aç" dediğinizde yanıtlar herkese gösterilir. Buz kırıcı warm-up oturumları için ideal.',
      },
      {
        q: 'Geri bildirim formu nasıl oluşturulur?',
        a: 'Modüller → Geri Bildirim bölümünden bir başlık girin ve istediğiniz soruları ekleyin. Her soru puan (1-5 yıldız), kısa yanıt veya uzun yanıt tipinde olabilir. Katılımcılar yanıtladıkça sonuçlar panelde toplanır.',
      },
      {
        q: 'Duyurular katılımcıya nasıl gider?',
        a: 'İletişim bölümünden bir duyuru yazıp gönderdiğinizde, kabul edilmiş tüm katılımcıların katılımcı alanında görünür hale gelir. Katılımcı bir sonraki girişinde duyuruyu okundu olarak işaretler.',
      },
      {
        q: 'Kaynaklar (dosya/bağlantı) nasıl eklenir?',
        a: 'Modüller → Kaynaklar bölümünden harici bir bağlantı (örneğin Google Drive veya YouTube) ekleyebilirsiniz. Katılımcılar bu bağlantıları kendi alanlarından açabilir. Dosya yüklemeyi gelecekte ekleyeceğiz; şimdilik bağlantı kullanın.',
      },
      {
        q: 'Gruplar ne için?',
        a: 'Gruplar bölümünde katılımcıları küçük çalışma gruplarına bölebilirsiniz (örneğin atölye çalışması için 4\'er kişilik gruplar). Sistem katılımcıları otomatik dağıtır; isterseniz elle de düzenleyebilirsiniz.',
      },
    ],
  },
  {
    id: 'gun',
    title: 'Etkinlik günü ve sonrası',
    items: [
      {
        q: 'Katılımcılar nasıl check-in yapar?',
        a: 'Etkinlik günü, her etkinlik için bir check-in bağlantısı üretilir. Bu bağlantıyı kapıdaki karşılamada QR kod veya kısa link olarak katılımcılarla paylaşabilirsiniz. Katılımcı bağlantıya tıklar, e-postasıyla teyit verir ve içeri girer.',
      },
      {
        q: '"Etkinlik Sonrası" bölümünde ne yapılır?',
        a: 'Etkinlik bittikten sonra bu bölüm aktifleşir. Burada son test sonuçlarını, geri bildirim özetlerini ve katılım istatistiklerini görebilir, sertifika üretebilirsiniz. Etkinliği tamamlayıp arşive aldığınızda panel sabitlenir ama veriler korunur.',
      },
      {
        q: 'Sertifikalar nasıl üretilir?',
        a: 'Etkinlik Sonrası bölümünden, kabul edilmiş ve check-in yapmış katılımcılar için sertifikalar üretebilirsiniz. Her sertifikanın bir doğrulama kodu olur; katılımcı PDF\'ini indirebilir, doğrulama sayfasından orijinalliğini teyit edebilir.',
      },
    ],
  },
  {
    id: 'genel',
    title: 'Genel',
    items: [
      {
        q: 'Ücretsiz limitler nedir?',
        a: 'Tier 1 (ücretsiz planda) kurum başına 20 aktif etkinlik ve etkinlik başına 500 katılımcı barındırabilirsiniz. Sivil toplum kuruluşları için kalıcı olarak ücretsizdir. Geçici olarak daha yüksek kontenjana ihtiyacınız varsa sistem yöneticisinden istisna talep edebilirsiniz.',
      },
      {
        q: 'Verilerim güvende mi?',
        a: 'Evet. Katılımcı verileri yalnızca sizin kurumunuzun erişimine açıktır. KVKK kapsamında onam metinleri her etkinlik için ayrı tanımlanabilir (Ayarlar → Formlar ve Onam). Katılımcıların kişisel bilgileri hiçbir üçüncü tarafla paylaşılmaz; hesabını silmek isteyen bir katılımcı 30 gün içinde verilerinin tamamen silinmesini talep edebilir.',
      },
      {
        q: 'Mail gönderimi nasıl çalışır?',
        a: 'Duyuru ve sistem bildirimleri Eventise üzerinden, kurumunuzun adıyla gönderilir. Şu an için yanıt adresi (reply-to) ortak bir adrestir; kuruma özel kişiselleştirilmiş gönderici adresi gelecekte eklenecek. E-posta aboneliğini iptal etmek isteyen katılımcı her mailin altındaki bağlantıyı kullanabilir.',
      },
    ],
  },
];

export default async function YardimPage() {
  const token = (await cookies()).get('eventise_session')?.value;
  const backHref = token ? '/dashboard' : '/login';
  const backLabel = token ? 'Panele dön' : 'Giriş yap';
  return (
    <main className="help-page">
      <header className="help-header">
        <Link href="/" className="logo dark"><b>e</b>eventise</Link>
        <Link href={backHref} className="help-back">← {backLabel}</Link>
      </header>

      <section className="help-hero">
        <p className="eyebrow">STK'LAR İÇİN REHBER</p>
        <h1>Etkinliklerinizi uçtan uca yönetin</h1>
        <p className="help-lead">
          Bu rehber, bir sivil toplum kuruluşu olarak Eventise ile etkinlik açmayı, kayıtları yönetmeyi, modüller hazırlamayı ve etkinlik gününü sorunsuz geçirmeyi anlatır. Aşağıdaki başlıklara göz atın; aradığınızı bulamazsanız ekibimizle iletişime geçebilirsiniz.
        </p>
      </section>

      {sections.map(section => (
        <section className="help-section" key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.intro && <p className="help-section-intro">{section.intro}</p>}
          <div className="help-accordion">
            {section.items.map((item, index) => (
              <details key={item.q} open={section.id === 'baslangic' && index === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="help-cta">
        <div>
          <h2>{token ? 'İlk etkinliğinizi oluşturun' : 'Hazırsanız başlayın'}</h2>
          <p>{token ? 'Panel üzerinden yeni bir etkinlik oluşturup dakikalar içinde yayınlayabilirsiniz.' : 'Ücretsiz bir STK hesabı oluşturun ve ilk etkinliğinizi dakikalar içinde yayınlayın.'}</p>
        </div>
        <Link className="primary" href={token ? '/dashboard/events/new' : '/register'}>{token ? 'Yeni etkinlik →' : 'Ücretsiz başla →'}</Link>
      </section>
    </main>
  );
}
