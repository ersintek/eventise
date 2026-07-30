import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AppNav } from '../components/navigation';
import { ProblemReporter } from '../components/problem-reporter';
import { GuideBrowser, type GuideSection } from './guide-browser';

export const metadata: Metadata = {
  title: 'Kullanım Rehberi — Eventise',
  description: 'STK’lar için güncel Eventise kullanım rehberi: kurum, etkinlik, başvuru, iletişim, etkinlik günü ve sertifikalar.',
};

const sections: GuideSection[] = [
  {
    id: 'baslangic',
    title: '1. Başlangıç ve kurum hesabı',
    intro: 'Önce doğru hesap türünü seçin, ardından kurumunuzun çalışma alanına geçin.',
    items: [
      {
        q: 'STK hesabı nasıl açılır?',
        a: 'Kayıt ekranında “STK olarak katıl” seçeneğini seçin. Google hesabınızla devam edebilir veya ad, soyad, e-posta ve şifrenizle kayıt olabilirsiniz. Yalnızca etkinliklere katılacaksanız “Etkinliklere katıl” seçeneğini kullanın.',
      },
      {
        q: 'Kurumum Eventise’ta zaten varsa ne yapmalıyım?',
        a: 'Kurum adını yazdığınızda mevcut bir kayıt bulunursa yeni ve yinelenen bir kurum oluşturmak yerine katılma isteği gönderebilirsiniz. Kurum yöneticisi isteğinizi “Kurum ve ekip” ekranından kabul ettiğinde çalışma alanına erişirsiniz.',
      },
      {
        q: 'Kurum çalışma alanı ne işe yarar?',
        a: 'Etkinlikleriniz, ekip üyeleriniz, kullanım bilgileriniz ve kurumsal ayarlarınız bu alanda birlikte tutulur. Birden fazla kişi aynı kurum altında çalışabilir; herkes yalnızca rolünün izin verdiği işlemleri görür.',
      },
    ],
  },
  {
    id: 'ilk-etkinlik',
    title: '2. İlk etkinliğinizi oluşturun',
    intro: '“Yeni etkinlik” akışı temel bilgileri toplar; ayrıntıları daha sonra tamamlayabilirsiniz.',
    items: [
      {
        q: 'Yeni etkinlik oluştururken hangi bilgiler istenir?',
        a: 'Etkinliğin adı, kısa tanıtımı, açıklaması, başlangıç ve bitiş zamanı, etkinlik türü, yer veya çevrim içi bağlantı, görünürlük, kayıt yöntemi ve kapasite belirlenir. Etkinlik yüz yüze, çevrim içi veya hibrit olabilir.',
        path: 'Ana menü → Yeni etkinlik',
        check: 'Yayımlamadan önce tarih, saat ve katılımcıyla paylaşılacak bağlantıları yeniden gözden geçirin.',
      },
      {
        q: 'Bağlantı kısa adı nedir?',
        a: 'Etkinliğin paylaşılabilir web adresinde görünen bölümdür. Etkinlik adından otomatik üretilir, gerekirse değiştirebilirsiniz. Kısa, anlaşılır ve Türkçe karakter içermeyen bir ifade seçmeniz iyi olur.',
      },
      {
        q: 'Bir etkinliği kopyalayabilir miyim?',
        a: 'Evet. Daha önce hazırladığınız bir etkinliği kopyalayarak yeni etkinliğinizi hızlandırabilirsiniz. Temel ayarlar ve kayıt formu yeni etkinliğe uyarlanır; tarihleri ve güncel bilgileri yayımlamadan önce mutlaka kontrol edin.',
      },
    ],
  },
  {
    id: 'yayin-kayit',
    title: '3. Yayın, görünürlük ve kayıtlar',
    intro: 'Etkinliğin kimler tarafından görüleceğini ve başvuruların nasıl sonuçlanacağını siz belirlersiniz.',
    items: [
      {
        q: 'Taslak, yayın ve kayıt durumu arasındaki fark nedir?',
        a: 'Taslak etkinlik katılımcılara gösterilmez. Etkinliği yayımladığınızda tanıtım sayfası erişilebilir olur. Kayıtları ayrıca açıp kapatabilirsiniz; böylece sayfa yayında kalırken yeni başvuruları durdurabilirsiniz.',
      },
      {
        q: 'Görünürlük seçenekleri ne anlama gelir?',
        a: '“Herkese açık” etkinlikler katılımcıların Yaklaşan Etkinlikler alanında keşfedilebilir. “Bağlantıya sahip olanlar” yalnızca paylaştığınız adres üzerinden ulaşır. “Yalnız davetliler” seçeneğinde ise yalnızca davet edilen kişiler kayıt olabilir.',
      },
      {
        q: 'Doğrudan kayıt ve onaylı başvuru arasındaki fark nedir?',
        a: 'Doğrudan kayıtta uygun başvuru otomatik kabul edilir. Onaylı başvuruda her başvuruyu inceleyip kabul veya reddedersiniz. Kontrollü ya da seçimli etkinliklerde onaylı başvuru daha uygundur.',
      },
      {
        q: 'Kayıt formunu ve onamları değiştirebilir miyim?',
        a: 'Etkinlik Bilgileri bölümünde standart ad, soyad ve e-posta alanlarına ek sorular ekleyebilir; alanları zorunlu yapabilirsiniz. Etkinliğe özel katılım ve iletişim onamlarını da burada tanımlayabilirsiniz. Katılımcıya yalnızca gerçekten ihtiyaç duyduğunuz bilgileri sorun.',
        path: 'Etkinliği yönet → Etkinlik Bilgileri → Formlar ve Onam',
        check: 'Formu katılımcı bağlantısından bir kez deneyin ve yalnızca gerekli bilgileri istediğinizden emin olun.',
      },
    ],
  },
  {
    id: 'basvurular',
    title: '4. Başvurular ve katılımcılar',
    items: [
      {
        q: 'Başvuruları nereden yönetirim?',
        a: 'Etkinlik çalışma alanındaki başvuru listesinden katılımcı bilgilerini ve başvuru yanıtlarını görebilirsiniz. Onaylı başvuru kullanıyorsanız başvuruları buradan kabul veya reddedersiniz.',
        path: 'Etkinliği yönet → Etkinlik Bilgileri → Başvurular',
        check: 'İşlem yapmadan önce doğru etkinliği ve katılımcıyı seçtiğinizi kontrol edin.',
      },
      {
        q: 'Kontenjan dolarsa ne olur?',
        a: 'Sistem kapasiteyi eş zamanlı olarak kontrol eder ve kapasitenin üzerinde kesin kayıt oluşmasını engeller. Etkinliğinizde yedek liste kullanıyorsanız sonraki başvurular yedek listeye alınabilir.',
      },
      {
        q: 'Etkinlik sayfasındaki SSS alanı ne işe yarar?',
        a: 'Ulaşım, erişilebilirlik, katılım ücreti veya gerekli malzemeler gibi tekrar sorulan konuları etkinlik ayarlarından ekleyebilirsiniz. Bu yanıtlar tanıtım sayfasında görünür ve ekibinizin mesaj yükünü azaltır.',
      },
    ],
  },
  {
    id: 'iletisim',
    title: '5. Katılımcılarla iletişim',
    intro: 'Başvuru öncesinden etkinlik sonrasına kadar mesajları aynı çalışma alanından yönetin.',
    items: [
      {
        q: 'Kimlere mesaj gönderebilirim?',
        a: 'Tüm kayıtlılar, kabul edilenler veya check-in yapanlar gibi hedef gruplar seçebilirsiniz. Mesajı göndermeden önce doğru etkinliği ve hedef grubu kontrol edin.',
      },
      {
        q: 'Hatırlatma planlanabilir mi?',
        a: 'Evet. Davet ve İletişim bölümünde mesaj şablonlarını kullanabilir, hatırlatmaları ileri bir tarih ve saate planlayabilir, gönderilmiş ve planlanmış iletileri takip edebilirsiniz.',
      },
      {
        q: 'Duyurular nerede görünür?',
        a: 'Gönderdiğiniz duyurular seçtiğiniz katılımcı grubunun kişisel etkinlik alanında görünür. Önemli güncellemeler için kısa bir başlık ve tek bir açık eylem kullanmanız iyi olur.',
      },
    ],
  },
  {
    id: 'moduller',
    title: '6. Etkinlik Araçları',
    intro: 'Ön test, son test, tanışma oyunu, geri bildirim ve grup araçlarını ihtiyacınıza göre kullanın.',
    items: [
      {
        q: 'Ön test ve son test nasıl kullanılır?',
        a: 'Hazır bir şablonla başlayabilir veya kendi sorularınızı oluşturabilirsiniz. Ön test ve son test sonuçları karşılaştırılabilir. Araçlar etkinlik tarihinden bağımsız olarak açık kalır; etkinlikten önce prova yapabilirsiniz.',
      },
      {
        q: 'Oyunlar ve gruplar ne işe yarar?',
        a: 'Oyunlarla katılımcıların etkileşimini artırabilir, sonuçları hazır olduğunuzda açıklayabilirsiniz. Katılımcıları rastgele, dengeli veya elle çalışma gruplarına ayırabilirsiniz.',
      },
      {
        q: 'Kaynak veya dosya paylaşabilir miyim?',
        a: 'Evet. Davet ve İletişim bölümündeki Kaynak Paylaşımı alanından bir web bağlantısı ekleyebilir veya doğrudan dosya yükleyebilirsiniz. Yüklenen dosyalar kurumunuzun kullanım kotasına dâhildir.',
      },
      {
        q: 'Geri bildirim formunda hangi sorular kullanılabilir?',
        a: 'Puan, kısa yanıt ve uzun yanıt soruları oluşturabilirsiniz. Yanıtlar etkinliğin çalışma alanında toplanır ve etkinlik sonrası değerlendirmede kullanılabilir.',
      },
    ],
  },
  {
    id: 'etkinlik-gunu',
    title: '7. Kapı ve Katılım',
    intro: 'Kapı girişi ve katılım teyidi araçları her zaman erişilebilir; önceden deneyebilir ve ekibinizi hazırlayabilirsiniz.',
    items: [
      {
        q: 'Etkinliği ayrıca “canlıya almam” gerekir mi?',
        a: 'Hayır. Etkinliğin “Yaklaşan”, “Devam ediyor” ve “Tamamlandı” dönemleri tarihlerden otomatik hesaplanır ve hiçbir aracı kilitlemez. Kapı ve Katılım ekranını önceden açıp prova yapabilirsiniz.',
      },
      {
        q: 'Katılım teyidi nasıl yapılır?',
        a: 'Kapı ve Katılım ekranındaki QR kodu veya bağlantıyı kullanabilir, katılımcıyı listeden bulup girişini kaydedebilirsiniz. Önceden kaydı olmayan kişiler için kapıda kayıt akışı da kullanılabilir.',
        path: 'Etkinliği yönet → Kapı ve Katılım',
        check: 'Etkinlikten önce QR bağlantısını farklı bir telefonda açarak kısa bir prova yapın.',
      },
      {
        q: 'Saha ekibi nasıl çalışır?',
        a: 'Saha görevlileri kendilerine verilen yetkiyle giriş ve etkinlik operasyonlarını yürütebilir. Görevleri önceden paylaştırın ve gerçek katılımcı kayıtlarını etkilememek için prova sonuçlarını kontrol edin.',
      },
    ],
  },
  {
    id: 'sonrasi',
    title: '8. Etkinlik sonrası ve sertifikalar',
    items: [
      {
        q: 'Etkinlik sonrasında neleri görebilirim?',
        a: 'Katılım kayıtlarını, test ve geri bildirim sonuçlarını inceleyebilir; etkinlik raporu hazırlayabilir ve kaynakları paylaşmaya devam edebilirsiniz. Etkinlik tarihi geçmiş olsa da bu araçlar kapanmaz.',
      },
      {
        q: 'Sertifika nasıl hazırlanır?',
        a: 'Sertifikalar bölümünde metni, vurgu rengini, yatay veya dikey düzeni ve isteğe bağlı imza bilgisini ayarlayın. Kendi PNG veya JPG arka planınızı yükleyebilir ve sonucu canlı önizlemede kontrol edebilirsiniz.',
        path: 'Etkinliği yönet → Sertifikalar',
        check: 'Üretmeden önce örnek katılımcı adıyla canlı önizlemeyi kontrol edin.',
      },
      {
        q: 'Sertifika kimlere verilir ve nasıl doğrulanır?',
        a: 'Uygun katılımcılar için sertifikaları ürettikten sonra katılımcılar PDF dosyasına kendi alanlarından erişebilir. Doğrulama QR kodu veya benzersiz kod, sertifikanın Eventise üzerinden teyit edilmesini sağlar.',
      },
    ],
  },
  {
    id: 'kurum-ekip',
    title: '9. Kurum, ekip ve kullanım',
    items: [
      {
        q: 'Ekip üyelerini ve katılma isteklerini nereden yönetirim?',
        a: '“Kurum ve ekip” ekranında e-posta ile ekip üyesi davet edebilir, bekleyen davetleri görebilir ve kuruma katılma isteklerini kabul veya reddedebilirsiniz. Yetkileri kişinin görevine göre sınırlı tutun.',
      },
      {
        q: 'Eventise ücretli mi?',
        a: 'Eventise sivil toplum kuruluşları ve aktivistler için ücretsizdir. Mevcut planda kurum başına 20 aktif etkinlik ve etkinlik başına 500 katılımcı sınırı bulunur. Geçici olarak daha yüksek bir limite ihtiyacınız varsa Eventise ekibine ulaşabilirsiniz.',
      },
      {
        q: 'Fotoğraf ve dosya kullanımımı nereden görürüm?',
        a: 'Ana menüdeki “Kullanım” sayfası fotoğraf ve dosyalar için kullanılan alanı ve kotayı ayrı ayrı gösterir.',
      },
    ],
  },
  {
    id: 'katilimci',
    title: '10. Katılımcı deneyimi',
    items: [
      {
        q: 'Katılımcılar etkinlikleri nasıl bulur?',
        a: 'Herkese açık yaklaşan etkinlikler katılımcı alanındaki keşif ekranında gösterilir. Katılımcılar ilgilendikleri STK’ları takip edebilir ve yalnızca takip ettikleri kurumların etkinliklerini filtreleyebilir.',
      },
      {
        q: 'Katılımcı kendi alanında neleri görür?',
        a: 'Yaklaşan, devam eden ve geçmiş etkinliklerini; başvuru durumunu, duyuruları, testleri, geri bildirimleri, paylaşılan kaynakları ve hazır olduğunda sertifikalarını tek yerde görür.',
      },
      {
        q: 'Katılımcı verileri ve onamlar nasıl yönetilir?',
        a: 'Katılımcı kendi profil ve bildirim tercihlerini düzenleyebilir, verdiği onamları görebilir ve uygun olduğunda geri çekebilir. Kurumlar yalnızca etkinlik için gerekli verileri toplamalı ve kendi KVKK yükümlülüklerini gözetmelidir.',
      },
    ],
  },
  {
    id: 'destek',
    title: 'Sorun çözme ve destek',
    items: [
      {
        q: 'Bir işlem başarısız olursa ne yapmalıyım?',
        a: 'Önce ekrandaki hata mesajını okuyun ve bağlantınızı kontrol edin. Formdaki bilgilerin çoğu hata durumunda korunur. Aynı işlemi art arda göndermek yerine sonucu kontrol edip yeniden deneyin.',
      },
      {
        q: 'Sorunu nasıl bildirebilirim?',
        a: 'Ana menüde “Yardım ve Destek” altındaki “Sorun Bildir” seçeneğini kullanın. Ne yaptığınızı, ne olmasını beklediğinizi ve ne olduğunu kısaca yazın; bulunduğunuz ekran ve hesap bilgileri bildirime otomatik eklenir.',
      },
      {
        q: 'Yeni özellikleri nereden takip edebilirim?',
        a: 'Ana menüde Eventise altındaki “Yenilikler” sayfasını açın. En yeni sürüm en üstte yer alır; sürüm numaraları ve kullanıcıya yansıyan değişiklikler birlikte gösterilir.',
      },
    ],
  },
];

export default async function YardimPage() {
  const token = (await cookies()).get('eventise_session')?.value;
  let organization: { id: string; name: string; memberships?: Array<{ role?: string }> } | undefined;
  let systemAdmin = false;
  if (token) {
    const headers = { authorization: `Bearer ${token}` };
    const [organizationsResponse, meResponse] = await Promise.all([
      fetch(`${process.env.API_INTERNAL_URL}/api/organizations`, { headers, cache: 'no-store' }).catch(() => null),
      fetch(`${process.env.API_INTERNAL_URL}/api/auth/me`, { headers, cache: 'no-store' }).catch(() => null),
    ]);
    if (organizationsResponse?.ok) organization = (await organizationsResponse.json())[0];
    if (meResponse?.ok) systemAdmin = (await meResponse.json()).systemRole === 'SYSTEM_ADMIN';
  }
  const backHref = token ? '/dashboard' : '/login';
  const backLabel = token ? 'Panele dön' : 'Giriş yap';
  return (
    <div className={organization ? 'app-shell' : undefined}>
      {organization && <AppNav organization={organization} active="help" systemAdmin={systemAdmin}/>}
      <main className="help-page">
        <header className="help-header">
          <Link href="/" className="logo dark"><b>e</b>eventise</Link>
          <Link href={backHref} className="help-back">← {backLabel}</Link>
        </header>

        <section className="help-hero">
          <p className="eyebrow">STK’LAR İÇİN KULLANIM REHBERİ</p>
          <h1>Eventise’ı adım adım kullanın</h1>
          <p className="help-lead">
            Kurum hesabınızı oluşturmaktan etkinlik sonrası rapor ve sertifikalara kadar ihtiyaç duyacağınız temel bilgileri burada bulabilirsiniz. Baştan sona okuyabilir veya aradığınız başlığa doğrudan geçebilirsiniz.
          </p>
        </section>

        <GuideBrowser sections={sections}/>

        <section className="help-cta">
          <div>
            <h2>{token ? 'Hazırsanız yeni etkinliğinizi oluşturalım' : 'Hazırsanız başlayalım'}</h2>
            <p>{token ? 'Temel bilgileri girin; kalan hazırlıkları kendi hızınızda tamamlayın.' : 'Ücretsiz bir STK hesabı oluşturun ve ilk etkinliğinizi hazırlayın.'}</p>
          </div>
          <Link className="primary" href={token ? '/dashboard/events/new' : '/register'}>{token ? 'Yeni etkinlik →' : 'Ücretsiz başla →'}</Link>
        </section>
      </main>
      {organization && <ProblemReporter organizationId={organization.id}/>}
    </div>
  );
}
