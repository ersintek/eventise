import { notFound } from 'next/navigation';
import Link from 'next/link';

const documents: Record<string, { title: string; sections: Array<[string,string]> }> = {
  'kullanici-sozlesmesi': { title: 'Eventise Kullanıcı Sözleşmesi', sections: [
    ['Hizmet','Eventise geliştirme/beta aşamasındaki etkinlik yönetim platformudur. Hata, kesinti veya özellik değişikliği yaşanabilir. Emredici mevzuattan doğan sorumluluklar saklıdır.'],
    ['Hesap','Kullanıcı doğru bilgi verir, hesabını korur ve hukuka aykırı kullanımda bulunmaz. Bir kurum adına işlem yapan kişi gerekli yetkiye sahip olduğunu beyan eder.'],
    ['Etkinlikler','Etkinliğin içeriği, gerçekleştirilmesi ve katılımcı verilerinin etkinlik amacıyla kullanımı ilgili organizatör STK’nın sorumluluğundadır. Eventise aksi belirtilmedikçe organizatör değildir.'],
    ['Kişisel veriler','Veriler KVKK Aydınlatma Metni doğrultusunda işlenir. Pazarlama veya özel nitelikli veri gibi ayrı şart gerektiren işlemler bu sözleşmeye dayanmaz.'],
    ['Silme','Hesap 30 günlük geri alma sürecinden sonra silinir. STK sorumluluğundaki etkinlik kayıtları ve hukuken tutulması gereken kayıtlar ilgili süre boyunca kalabilir.'],
    ['Sürüm','Sürüm 1.0 — 25.07.2026. Türkiye Cumhuriyeti hukuku uygulanır.'],
  ]},
  'kvkk-aydinlatma': { title: 'Eventise KVKK Aydınlatma Metni', sections: [
    ['Veri sorumlusu','[YAYIN ÖNCESİ AD SOYAD] — iletişim ve başvuru: [YAYIN ÖNCESİ E-POSTA].'],
    ['Veriler ve amaç','Ad, soyad, e-posta, parola özeti, Google kimliği, oturum ve güvenlik kayıtları; hesabın kurulması, hizmetin sunulması, güvenlik ve hukuki yükümlülükler için işlenir.'],
    ['Etkinlik verileri','STK etkinliğine verilen form, katılım ve değerlendirme verilerinde ilgili STK veri sorumlusu; Eventise teknik hizmet kapsamında veri işleyen olabilir.'],
    ['Aktarım ve saklama','Veriler gerekli teknik sağlayıcılara sınırlı aktarılabilir. Hesap verileri hesap süresince; etkinlik ve güvenlik kayıtları kural olarak 1 yıl saklanır.'],
    ['Haklar','KVKK kapsamındaki bilgi, düzeltme ve silme talepleri hesabınızda kayıtlı e-posta üzerinden [YAYIN ÖNCESİ E-POSTA] adresine gönderilebilir.'],
    ['Sürüm','Sürüm 1.0 — 25.07.2026. Sağlayıcı ve kimlik alanları yayın öncesinde doldurulacaktır.'],
  ]},
  'kurumsal-kullanim': { title: 'STK Yetkilisi ve Kurumsal Kullanım Sözleşmesi', sections: [
    ['Yetki','Kabul eden kişi, belirttiği kurum adına çalışma alanı oluşturmaya ve sözleşmeyi kabul etmeye yetkili olduğunu beyan eder.'],
    ['Veri rolleri','STK etkinlik formunun amacı ve içeriğini belirlediği ölçüde veri sorumlusudur. Eventise katılımcı verilerini teknik hizmet kapsamında STK’nın talimatlarıyla işler.'],
    ['STK yükümlülükleri','STK gerekli verileri toplar, katılımcıları aydınlatır, gereken ayrı rızaları alır, verileri amaç dışında kullanmaz ve ekip erişimlerini güncel tutar.'],
    ['Özel veriler','Sağlık, engellilik ve benzeri verileri isteyen STK hukuki şartları sağlar. Eventise makul erişim ve güvenlik tedbirleri uygular.'],
    ['Saklama','Etkinlik kayıtları kural olarak etkinlikten sonra 1 yıl, rapor dosyaları 30 gün saklanır.'],
    ['Sürüm','Sürüm 1.0 — 25.07.2026. Taraflar kendi belirledikleri işlemlerden ve kusurlarından sorumludur.'],
  ]},
};

export default async function LegalDocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const document = documents[(await params).slug]; if (!document) notFound();
  return <main className="legal-page"><article className="legal-document"><header className="legal-document-header"><Link href="/login" className="legal-back">‹ Eventise&apos;a dön</Link><div className="logo dark"><b>e</b>eventise</div><p className="eyebrow">HUKUKİ METİN · SÜRÜM 1.0</p><h1>{document.title}</h1><p>Metni daha kolay inceleyebilmeniz için konu başlıklarına ayırdık.</p></header><div className="legal-document-sections">{document.sections.map(([title,body],index)=><section key={title}><span>{String(index+1).padStart(2,'0')}</span><div><h2>{title}</h2><p>{body}</p></div></section>)}</div><footer>Son güncelleme · 25 Temmuz 2026</footer></article></main>;
}
