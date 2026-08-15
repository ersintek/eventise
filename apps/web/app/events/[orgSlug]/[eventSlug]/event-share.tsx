'use client';

import { useEffect, useState } from 'react';

export function EventShare({ title }: { title: string }) {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => setUrl(window.location.href), []);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title} etkinliğine göz at`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage('Bağlantı kopyalandı.');
    } catch { setMessage('Bağlantı kopyalanamadı.'); }
  }

  async function shareToApps() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} etkinliğine göz at`, url: window.location.href });
        setMessage('Paylaşım menüsü açıldı.');
      } catch { /* Kullanıcı paylaşım penceresini kapatabilir. */ }
    } else {
      await copy();
      setMessage('Bağlantı kopyalandı; istediğiniz uygulamada paylaşabilirsiniz.');
    }
  }

  return <section className="event-share" aria-labelledby="share-title">
    <div><p className="eyebrow">PAYLAŞ</p><h2 id="share-title">Etkinliği paylaşın</h2></div>
    <div className="share-actions">
      <a className="share-link linkedin" href={url ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` : '#'} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn'de paylaş"><b>in</b><span>LinkedIn</span></a>
      <a className="share-link whatsapp" href={url ? `https://wa.me/?text=${encodedText}%20${encodedUrl}` : '#'} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp'ta paylaş"><b>WA</b><span>WhatsApp</span></a>
      <a className="share-link facebook" href={url ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` : '#'} target="_blank" rel="noopener noreferrer" aria-label="Facebook'ta paylaş"><b>f</b><span>Facebook</span></a>
      <a className="share-link x-share" href={url ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` : '#'} target="_blank" rel="noopener noreferrer" aria-label="X'te paylaş"><b>𝕏</b><span>X</span></a>
      <button className="share-link instagram" type="button" onClick={shareToApps} aria-label="Instagram veya başka bir uygulamada paylaş"><b>◎</b><span>Instagram</span></button>
      <button className="share-link copy" type="button" onClick={copy}><b>↗</b><span>Linki kopyala</span></button>
    </div>
    {message && <p className="share-message" role="status">{message}</p>}
  </section>;
}
