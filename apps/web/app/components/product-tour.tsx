'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { EVENTISE_TOUR_STEPS, EVENTISE_TOUR_VERSION } from './product-tour-config';

type Box = { top: number; left: number; width: number; height: number };
const completedKey = `eventise-tour-completed:${EVENTISE_TOUR_VERSION}`;

export function ProductTour({ eventPath }: { eventPath: string }) {
  const [open, setOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);

  const start = useCallback((showWelcome = false) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setIndex(0);
    setWelcome(showWelcome);
    setOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('eventise-last-event-path', eventPath);
    const requested = sessionStorage.getItem('eventise-start-tour') === 'true';
    if (requested) sessionStorage.removeItem('eventise-start-tour');
    const unseen = localStorage.getItem(completedKey) !== 'true';
    if (requested || unseen) start(unseen && !requested);
    const listener = () => start(false);
    window.addEventListener('eventise:start-product-tour', listener);
    return () => window.removeEventListener('eventise:start-product-tour', listener);
  }, [eventPath, start]);

  const close = useCallback((completed = false) => {
    if (completed) localStorage.setItem(completedKey, 'true');
    setOpen(false);
    setWelcome(false);
    setBox(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    if (!welcome) document.documentElement.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (!welcome && event.key === 'ArrowRight') setIndex(value => Math.min(value + 1, EVENTISE_TOUR_STEPS.length - 1));
      if (!welcome && event.key === 'ArrowLeft') setIndex(value => Math.max(value - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [close, open, welcome]);

  useLayoutEffect(() => {
    if (!open || welcome) return;
    let frame = 0;
    const update = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${EVENTISE_TOUR_STEPS[index].target}"]`);
      if (!target) { setBox(null); return; }
      const rect = target.getBoundingClientRect();
      setBox({ top: Math.max(8, rect.top - 7), left: Math.max(8, rect.left - 7), width: Math.min(window.innerWidth - 16, rect.width + 14), height: Math.min(window.innerHeight - Math.max(8, rect.top - 7) - 8, rect.height + 14) });
    };
    const target = document.querySelector<HTMLElement>(`[data-tour-id="${EVENTISE_TOUR_STEPS[index].target}"]`);
    target?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    frame = window.requestAnimationFrame(() => window.requestAnimationFrame(update));
    window.addEventListener('resize', update);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('resize', update); };
  }, [index, open, welcome]);

  if (!open) return null;
  if (welcome) return <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-welcome-title">
    <div className="tour-welcome">
      <span className="tour-spark">e</span><p className="eyebrow">ETKİNLİK ÇALIŞMA ALANI</p>
      <h2 id="tour-welcome-title">Hazırlıktan sonuca kadar tek, sakin bir akış.</h2>
      <p>Yeni çalışma alanını kısa bir turla tanıyın; her bölümde ne yapacağınızı ve sırada ne olduğunu görün.</p>
      <div className="tour-value-row"><span>Hazırlığı tamamlayın</span><span>Katılımı yönetin</span><span>Sonuçları paylaşın</span></div>
      <div className="tour-actions"><button type="button" className="tour-text-button" onClick={() => close(true)}>Şimdi değil</button><button type="button" className="primary" onClick={() => { window.scrollTo({ top: 0, behavior: 'auto' }); setWelcome(false); }}>Kısa turu başlat <span>→</span></button></div>
    </div>
  </div>;

  const step = EVENTISE_TOUR_STEPS[index];
  const finish = index === EVENTISE_TOUR_STEPS.length - 1;
  return <div className="tour-layer tour-spotlight-layer" role="dialog" aria-modal="true" aria-labelledby="tour-step-title">
    {box && <div className="tour-focus" style={box} />}
    <section className="tour-popover" aria-live="polite">
      <div className="tour-popover-top"><span>{index + 1} / {EVENTISE_TOUR_STEPS.length}</span><button type="button" onClick={() => close()} aria-label="Turu kapat">×</button></div>
      <p className="tour-step-eyebrow">{step.eyebrow}</p><h2 id="tour-step-title">{step.title}</h2><p>{step.description}</p>
      <div className="tour-dots" aria-hidden="true">{EVENTISE_TOUR_STEPS.map((item, dot) => <i className={dot === index ? 'active' : ''} key={item.id}/>)}</div>
      <div className="tour-actions">{index > 0 ? <button type="button" className="tour-text-button" onClick={() => setIndex(index - 1)}>Geri</button> : <button type="button" className="tour-text-button" onClick={() => close()}>Turu kapat</button>}<button type="button" className="primary" onClick={() => finish ? close(true) : setIndex(index + 1)}>{finish ? 'Keşfetmeye başla' : 'Devam'} <span>→</span></button></div>
    </section>
  </div>;
}

export function TourRedirector() {
  useEffect(() => {
    const listener = () => {
      if (document.querySelector('[data-tour-id="event-command-center"]')) return;
      const eventLink = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/dashboard/events/"]'))
        .find(link => link.getAttribute('href') !== '/dashboard/events/new');
      const path = localStorage.getItem('eventise-last-event-path') || eventLink?.getAttribute('href');
      if (path) { sessionStorage.setItem('eventise-start-tour', 'true'); window.location.assign(path); }
      else window.location.assign('/dashboard#events');
    };
    window.addEventListener('eventise:start-product-tour', listener);
    return () => window.removeEventListener('eventise:start-product-tour', listener);
  }, []);
  return null;
}
