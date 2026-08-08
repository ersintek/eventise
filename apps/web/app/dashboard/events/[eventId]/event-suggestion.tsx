'use client';

import Link from 'next/link';
import { useState } from 'react';

export function EventSuggestion({ base, publicationStatus, registrationCount, period }: { base: string; publicationStatus: string; registrationCount: number; period: 'UPCOMING' | 'CURRENT' | 'PAST' }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  const suggestion = publicationStatus === 'DRAFT'
    ? { eyebrow: 'EVENTISE ÖNERİYOR', title: 'Katılımcı sayfanız şekilleniyor', copy: 'Nasıl göründüğünü kontrol edebilir, hazır olduğunuzda paylaşabilirsiniz.', href: `${base}/settings?subtab=info`, action: 'Bilgileri gözden geçir' }
    : period === 'CURRENT'
      ? { eyebrow: 'EVENTISE ÖNERİYOR', title: 'Kapı akışınız hazır', copy: 'QR katılım teyidini açabilir veya listeden hızlıca giriş yapabilirsiniz.', href: `${base}/day`, action: 'Katılım ekranını aç' }
      : period === 'PAST'
        ? { eyebrow: 'EVENTISE ÖNERİYOR', title: 'Etkinizin çıktıları hazır', copy: 'Katılım sonuçlarını inceleyip rapor veya doğrulanabilir sertifika oluşturabilirsiniz.', href: `${base}/post-event`, action: 'Sonuçları görüntüle' }
        : registrationCount > 0
          ? { eyebrow: 'EVENTISE ÖNERİYOR', title: `Yeni başvurularınız var`, copy: 'Şimdi inceleyebilir veya biraz daha başvuru bekleyebilirsiniz.', href: `${base}/settings?subtab=applications`, action: 'Başvuruları aç' }
          : { eyebrow: 'EVENTISE ÖNERİYOR', title: 'Katılımcı sayfanız paylaşılmaya hazır', copy: 'Sayfanızı önizleyin; hazır olduğunuzda bağlantıyı topluluğunuzla paylaşın.', href: `${base}/communication?subtab=invite`, action: 'Paylaşım seçenekleri' };
  return <article className="event-suggestion">
    <button type="button" className="suggestion-dismiss" onClick={() => setVisible(false)} aria-label="Öneriyi kapat">×</button>
    <div className="suggestion-mark">✦</div><div><p className="eyebrow">{suggestion.eyebrow}</p><h2>{suggestion.title}</h2><p>{suggestion.copy}</p><div className="suggestion-actions"><Link href={suggestion.href}>{suggestion.action} <span>→</span></Link><button type="button" onClick={() => setVisible(false)}>Daha sonra</button></div></div>
  </article>;
}
