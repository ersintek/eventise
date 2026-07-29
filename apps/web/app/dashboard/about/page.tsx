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
        <p className="eyebrow">BİZ KİMİZ?</p>
        <h2>Değişim için tasarlanan etkinlik teknolojisi</h2>
        <p>Eventise, <strong>Social Institute of Change and Impact — SICI</strong> tarafından geliştirilmiştir.</p>
        <p>Sivil toplum kuruluşlarının ve aktivistlerin etkinliklerini daha kolay, düzenli ve etkili biçimde yönetebilmesi için ücretsiz olarak sunulur.</p>
        <div className="about-links">
          <a href="https://www.sici.uk" target="_blank" rel="noopener noreferrer">sici.uk <span>↗</span></a>
          <a href="https://www.sici.dev" target="_blank" rel="noopener noreferrer">sici.dev <span>↗</span></a>
        </div>
      </article>
      <aside className="about-principle">
        <span aria-hidden="true">✦</span>
        <h3>Sivil toplum için ücretsiz</h3>
        <p>Eventise, sivil toplum kuruluşları ve aktivistler için ücretsizdir.</p>
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
