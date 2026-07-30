import type { Metadata } from 'next';
import { AboutShell, getOrganizationId } from './about-shell';
import { ContactForm } from './contact-form';

export const metadata: Metadata = { title: 'Hakkında — Eventise' };

export default async function AboutPage() {
  const organizationId = await getOrganizationId();
  return <AboutShell activeTab="about">
    <div className="about-grid">
      <article className="about-story">
        <span className="about-mark" aria-hidden="true">e</span>
        <p className="eyebrow">MERHABA</p>
        <h2>İyi bir etkinlik düzenlemek zaten yeterince zor.</h2>
        <p>Bir de formlar, katılımcı listeleri, e-postalar ve sertifikalar arasında kaybolmayın diye Eventise’ı geliştiriyoruz.</p>
        <p>Eventise, <strong>Social Institute of Change and Impact — SICI</strong> tarafından; sivil toplum kuruluşlarının işini biraz olsun kolaylaştırmak için geliştirilen ücretsiz bir etkinlik yönetim platformu.</p>
        <p>Henüz yolun başındayız. Kullandıkça neyin iyi çalıştığını, nerede zorlandığınızı bize söyleyin; birlikte daha iyi hâle getirelim.</p>
        <div className="about-links">
          <a href="https://www.sici.uk" target="_blank" rel="noopener noreferrer">sici.uk <span>↗</span></a>
          <a href="https://www.sici.dev" target="_blank" rel="noopener noreferrer">sici.dev <span>↗</span></a>
        </div>
      </article>
      <aside className="about-principle">
        <span aria-hidden="true">✦</span>
        <h3>Sivil toplum için ücretsiz</h3>
        <p>Çünkü iyi işler yapan ekiplerin iyi araçlara erişebilmesi gerektiğine inanıyoruz.</p>
      </aside>
    </div>
    <section className="about-contact">
      <div>
        <p className="eyebrow">İLETİŞİM</p>
        <h2>Birlikte konuşalım</h2>
        <p>Bir sorunuz, öneriniz veya iş birliği fikriniz varsa bize yazın. Yanıtımız hesabınızdaki e-posta adresine gelecek.</p>
      </div>
      <ContactForm organizationId={organizationId}/>
    </section>
  </AboutShell>;
}
