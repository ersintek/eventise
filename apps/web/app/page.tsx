import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import './landing.css';
import './landing-icons.css';
import './landing-polish.css';

export const metadata: Metadata = {
  title: 'STK etkinlikleri için ortak çalışma alanı',
  description: 'Etkinlik sayfasından katılım gününe, etkinlik işlerinizi tek yerden yönetin.',
};

const Arrow = () => <span aria-hidden="true">→</span>;

type IconName = 'clipboard-pen' | 'clipboard-check' | 'scan-line' | 'chart' | 'square-pen' | 'message-heart' | 'messages' | 'users' | 'folder' | 'megaphone' | 'link' | 'search' | 'file-down' | 'badge-check' | 'images';
function FeatureIcon({ name }: { name: IconName }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, React.ReactNode> = {
    'clipboard-pen': <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/><path d="m14 18 6.3-6.3a2.1 2.1 0 0 0-3-3L11 15l-1 4z"/></>,
    'clipboard-check': <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="m9 14 2 2 4-4"/></>,
    'scan-line': <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3 12h18"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 16v-5M12 16V7M17 16v-9"/></>,
    'square-pen': <><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M16 3.5a2.1 2.1 0 0 1 3 3L12 14l-4 1 1-4z"/></>,
    'message-heart': <><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4.8-1.3L3 20l1.3-4A8.4 8.4 0 0 1 3 11.5a8.5 8.5 0 0 1 18 0"/><path d="M12 14s-3-1.8-3-3.6a1.6 1.6 0 0 1 3-1 1.6 1.6 0 0 1 3 1C15 12.2 12 14 12 14Z"/></>,
    messages: <><path d="M7 18a5 5 0 0 1-4-4.9V7a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2"/><path d="M7 18h7a5 5 0 0 0 5-5v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1a5 5 0 0 0 3 4.6Z"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
    folder: <><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
    megaphone: <><path d="m3 11 18-5v12L3 13z"/><path d="M11.6 16.8a3 3 0 0 1-5.2-2.1V13"/><path d="M19 9.5h.01"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    'file-down': <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 12v6m-3-3 3 3 3-3"/></>,
    'badge-check': <><path d="M12 2a5 5 0 0 0 4.5 2.8A5 5 0 0 0 19.2 9 5 5 0 0 0 22 13.5 5 5 0 0 0 19.2 18a5 5 0 0 0-4.7 3A5 5 0 0 0 10 21a5 5 0 0 0-4.5-2.8A5 5 0 0 0 2.8 15 5 5 0 0 0 2 10.5 5 5 0 0 0 4.8 6a5 5 0 0 0 4.7-3A5 5 0 0 0 12 2Z"/><path d="m9 12 2 2 4-4"/></>,
    images: <><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  };
  return <span className="feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" {...common}>{paths[name]}</svg></span>;
}

function ProductShot({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return <div className={`product-shot ${className}`}><Image src={src} alt={alt} width={1270} height={718} sizes="(max-width: 760px) 92vw, 720px" /></div>;
}

export default function Home() {
  return <main className="landing-page">
    <header className="landing-header">
      <Link className="landing-brand" href="/" aria-label="Eventise ana sayfa"><span>e</span><b>eventise</b></Link>
      <nav aria-label="Ana menü"><a href="#stk">STK&apos;lar için</a><a href="#katilimci">Katılımcılar için</a><Link className="landing-login" href="/login">Giriş <Arrow /></Link></nav>
    </header>

    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero-copy">
        <p className="landing-kicker">SİVİL TOPLUM İÇİN ETKİNLİK YÖNETİMİ</p>
        <h1 id="landing-title">Etkinliğinizi, tek yerden yönetin.</h1>
        <p>Etkinlik sayfanızı hazırlayın; başvuruları, katılımcı iletişimini, katılım gününü ve etkinlik sonrasını aynı çalışma alanından takip edin.</p>
        <div className="landing-actions"><a className="primary landing-action" href="#stk">STK&apos;lar için nasıl çalışır? <Arrow /></a></div>
      </div>
      <div className="landing-hero-visual" aria-label="Eventise STK çalışma alanı örneği">
        <ProductShot src="/landing/dashboard.png" alt="Eventise STK panelinde başvuru ve etkinlik özeti" />
        <div className="hero-visual-note"><span aria-hidden="true">●</span><div><b>Etkinlik durumu</b><small>Başvurular, duyurular ve sonraki işler aynı ekranda.</small></div></div>
      </div>
    </section>

    <section className="landing-stk" id="stk" aria-labelledby="stk-title">
      <header className="landing-section-heading"><p className="landing-kicker">STK&apos;LAR İÇİN</p><h2 id="stk-title">Bir etkinlik için farklı araçlar arasında gidip gelmeyin.</h2><p>Başvuru formu, katılımcı listesi, duyurular ve etkinlik günü notları ayrı yerlerde kaldığında takip zorlaşır. Eventise, bunları etkinliğinizin kendi çalışma alanında toplar.</p></header>
      <div className="landing-stk-intro">
        <div className="single-place-copy"><span className="single-place-mark" aria-hidden="true">e</span><h3>Etkinliğinizin işleri aynı yerde.</h3><p>Hazırlıkta sayfayı ve formu düzenleyin. Süreçte başvurular hakkında karar verin, katılımcılara bilgi verin. Etkinlik günü ve sonrasında gerekli kayıtları aynı etkinlik alanından yönetin.</p><Link className="landing-text-link" href="/login/organization">STK olarak devam edin <Arrow /></Link></div>
        <ProductShot src="/landing/event-builder.png" alt="Eventise yeni etkinlik oluşturma ve canlı önizleme ekranı" className="builder-shot" />
      </div>

      <div className="landing-feature-story">
        <article className="feature-story-copy"><div className="feature-story-mark"><FeatureIcon name="clipboard-pen"/><span>01</span></div><p className="landing-kicker">HAZIRLIK VE BAŞVURU</p><h3>Etkinlik sayfasını ve başvuru akışını kendi sürecinize göre kurun.</h3><p>Tarih, yer, katılım biçimi, başvuru soruları, katılım koşulları ve sık sorulan sorular için tek bir düzenleme alanınız olur. Etkinliği taslakta tutabilir; yayın ve başvuru formunu ayrı ayrı yönetebilirsiniz.</p><ul><li><FeatureIcon name="link"/><span>Herkese açık, bağlantılı veya yalnız davetli görünürlük</span></li><li><FeatureIcon name="clipboard-check"/><span>Otomatik kabul ya da başvuruyu değerlendirme seçeneği</span></li><li><FeatureIcon name="users"/><span>Kontenjan, kabul, ret ve yedek liste takibi</span></li></ul></article>
        <ProductShot src="/landing/dashboard.png" alt="Başvuru değerlendirmeleri ve etkinlik durumu için Eventise paneli" />
      </div>

      <div className="landing-feature-story reverse">
        <ProductShot src="/landing/check-in.png" alt="Eventise QR ile katılım teyidi ekranı" />
        <article className="feature-story-copy"><div className="feature-story-mark"><FeatureIcon name="scan-line"/><span>02</span></div><p className="landing-kicker">ETKİNLİK GÜNÜ</p><h3>Kapıdaki katılımı, etkinliğinizin kendi listesinde yönetin.</h3><p>Katılımcıları QR kodla teyit edin; QR kullanamayan kişileri isim veya e-posta ile bulun. Gerekirse kapıda katılımcı ekleyin. Etkinlikten önce indirip yazdırabileceğiniz imza formu da aynı alanda bulunur.</p><ul><li><FeatureIcon name="scan-line"/><span>QR kodla katılım teyidi</span></li><li><FeatureIcon name="search"/><span>İsim veya e-posta ile manuel teyit</span></li><li><FeatureIcon name="square-pen"/><span>Kapıda katılımcı ekleme ve imza formu</span></li></ul></article>
      </div>

      <div className="landing-feature-story">
        <article className="feature-story-copy"><div className="feature-story-mark"><FeatureIcon name="chart"/><span>03</span></div><p className="landing-kicker">ETKİNLİK SONRASI</p><h3>Etkinlik bittiğinde, süreçle ilgili kayıtlar kaybolmasın.</h3><p>Katılım, başvuru ve geri bildirim sonuçlarını aynı etkinlikten inceleyin. Katılımcı listesini CSV veya Excel olarak, etkinlik özetini PDF olarak dışa aktarın. Katılımı teyit edilen kişiler için sertifika hazırlayabilir ve doğrulama bağlantısını kullanabilirsiniz.</p><ul><li><FeatureIcon name="chart"/><span>Katılım, başvuru ve geri bildirim sonuçları</span></li><li><FeatureIcon name="file-down"/><span>CSV, Excel ve PDF dışa aktarma</span></li><li><FeatureIcon name="badge-check"/><span>Doğrulanabilir katılım sertifikaları</span></li><li><FeatureIcon name="images"/><span>Katılımcıların yüklediği fotoğrafları inceleyip onaylayın; etkinlik galerisinde paylaşın</span></li></ul></article>
        <ProductShot src="/landing/results.png" alt="Eventise etkinlik sonrası sonuçlar ekranı" />
      </div>

      <section className="landing-tools" aria-labelledby="tools-title">
        <div className="landing-tools-copy"><div className="feature-story-mark"><FeatureIcon name="users"/><span>04</span></div><p className="landing-kicker">KATILIMCI DENEYİMİ ARAÇLARI</p><h3 id="tools-title">Etkinliğinize yalnız kayıt değil, katılım ve öğrenme için de alan açın.</h3><p>Bu araçlar her etkinlikte zorunlu değildir. İhtiyacınız olduğunda katılımcıların kullanması için etkinlik özelinde açabilir, hazır olduğunuzda kapatabilirsiniz.</p></div>
        <ProductShot src="/landing/tests.png" alt="Eventise ön ve son test araçları ekranı" className="tools-shot" />
        <div className="landing-tool-grid">
          <article><FeatureIcon name="square-pen"/><div><b>Ön ve son test</b><p>Etkinlik öncesi ve sonrasında kısa değerlendirmeler hazırlayın; sonuçları karşılaştırın.</p></div></article>
          <article><FeatureIcon name="message-heart"/><div><b>Geri bildirim</b><p>Puanlama, kısa yanıt veya açık uçlu sorularla katılımcı deneyimini dinleyin.</p></div></article>
          <article><FeatureIcon name="messages"/><div><b>Tanışma oyunu</b><p>Katılımcıların birbirini tanımasına yardımcı olacak kısa bir etkileşim hazırlayın.</p></div></article>
          <article><FeatureIcon name="users"/><div><b>Çalışma grupları</b><p>Katılımcıları rastgele, dengeli veya kendi seçiminizle gruplara ayırın.</p></div></article>
          <article><FeatureIcon name="folder"/><div><b>Kaynak paylaşımı</b><p>Sunum, bağlantı veya dokümanları katılımcıların erişebileceği yere ekleyin.</p></div></article>
          <article><FeatureIcon name="megaphone"/><div><b>Duyuru ve hatırlatma</b><p>Seçtiğiniz katılımcı grubuna bilgi verin; e-posta hatırlatmalarını ileri bir tarih için planlayın.</p></div></article>
        </div>
      </section>
      <div className="landing-stk-footer"><div><b>Her araç etkinlik sahibinin seçimine bağlıdır.</b><span>Katılımcılar yalnız sizin açtığınız araçları kendi etkinlik alanlarında görür.</span></div><Link className="secondary landing-secondary" href="/yardim">Kullanım rehberini aç <Arrow /></Link></div>
    </section>

    <section className="landing-participant" id="katilimci" aria-labelledby="participant-title">
      <div className="participant-copy"><p className="landing-kicker">KATILIMCILAR İÇİN</p><h2 id="participant-title">Açık etkinlikleri inceleyin, uygunsa başvurun.</h2><p>Etkinlik sayfasından tarih, yer, açıklama ve başvuru koşullarını görün. Başvurunuzdan sonra kabul, yedek liste veya diğer durumları hesabınızdan takip edin.</p><div className="participant-points"><span>Başvurunuzu takip edin</span><span>Duyuru ve paylaşılanlara erişin</span><span>Hazırlandıysa sertifikanızı indirin</span></div><Link className="primary landing-action" href="/login/participant">Katılımcı olarak devam edin <Arrow /></Link></div>
      <ProductShot src="/landing/participant-focus.png" alt="Eventise katılımcı alanında yaklaşan etkinlikler" className="participant-shot" />
    </section>

    <section className="landing-closing"><div><p className="landing-kicker">SİCİ TARAFINDAN GELİŞTİRİLDİ</p><h2>Sivil toplumun etkinlik işini biraz kolaylaştırmak için.</h2><p>Eventise, sivil toplum kuruluşları ve aktivistler için geliştirilen ücretsiz bir etkinlik yönetim platformudur. Henüz beta aşamasındayız; deneyiminizi ve önerilerinizi bizimle paylaşın.</p><Link className="landing-text-link" href="/yardim">Yardım ve destek <Arrow /></Link></div><Image src="/brand/sici-logo.png" alt="SİCİ" width={176} height={80} className="landing-sici-logo" /></section>
    <footer className="landing-footer"><span>© {new Date().getFullYear()} Eventise</span><div><Link href="/yardim">Kullanım rehberi</Link><Link href="/legal/kullanici-sozlesmesi">Kullanım koşulları</Link><Link href="/legal/kvkk-aydinlatma">KVKK</Link><Link href="/login">Giriş</Link></div></footer>
  </main>;
}
