'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { EVENTISE_TOUR_STEPS, EVENTISE_TOUR_VERSION } from './product-tour-config';

type Box = { top: number; left: number; width: number; height: number };
const completedKey = `eventise-tour-completed:${EVENTISE_TOUR_VERSION}`;

function findAvailableStep(start: number, direction: 1 | -1) {
  for (let candidate = start; candidate >= 0 && candidate < EVENTISE_TOUR_STEPS.length; candidate += direction) {
    if (document.querySelector(`[data-tour-id="${EVENTISE_TOUR_STEPS[candidate].target}"]`)) return candidate;
  }
  return -1;
}

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

  const move = useCallback((direction: 1 | -1) => {
    const next = findAvailableStep(index + direction, direction);
    if (next >= 0) setIndex(next);
    else if (direction === 1) close(true);
  }, [close, index]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    if (!welcome) document.documentElement.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
      if (!welcome && event.key === 'ArrowRight') move(1);
      if (!welcome && event.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [close, move, open, welcome]);

  useLayoutEffect(() => {
    if (!open || welcome) return;
    let frame = 0;
    const update = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${EVENTISE_TOUR_STEPS[index].target}"]`);
      if (!target) {
        setBox(null);
        const next = findAvailableStep(index + 1, 1);
        if (next >= 0) setIndex(next);
        else close(true);
        return;
      }
      const rect = target.getBoundingClientRect();
      const top = Math.max(8, rect.top - 7);
      const left = Math.max(8, rect.left - 7);
      setBox({ top, left, width: Math.max(0, Math.min(window.innerWidth - left - 8, rect.width + 14)), height: Math.max(0, Math.min(window.innerHeight - top - 8, rect.height + 14)) });
    };
    const target = document.querySelector<HTMLElement>(`[data-tour-id="${EVENTISE_TOUR_STEPS[index].target}"]`);
    target?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    frame = window.requestAnimationFrame(() => window.requestAnimationFrame(update));
    window.addEventListener('resize', update);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('resize', update); };
  }, [close, index, open, welcome]);

  if (!open) return null;
  if (welcome) return <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-welcome-title">
    <div className="tour-welcome">
      <span className="tour-spark">e</span><p className="eyebrow">ETKİNLİK ÇALIŞMA ALANI</p>
      <h2 id="tour-welcome-title">Bölümleri ve durumları tanıyın.</h2>
      <p>Bu tur, etkinliği hangi bölümden yöneteceğinizi ve durum kontrollerinin ne yaptığını gösterir.</p>
      <div className="tour-value-row"><span>Etkinlik öncesi</span><span>Etkinlik sırasında</span><span>Etkinlik sonrası</span></div>
      <div className="tour-actions"><button type="button" className="tour-text-button" onClick={() => close(true)}>Şimdi değil</button><button type="button" className="primary" onClick={() => { window.scrollTo({ top: 0, behavior: 'auto' }); setWelcome(false); }}>Kısa turu başlat <span>→</span></button></div>
    </div>
  </div>;

  const step = EVENTISE_TOUR_STEPS[index];
  const finish = index === EVENTISE_TOUR_STEPS.length - 1;
  return <div className="tour-layer tour-spotlight-layer" role="dialog" aria-modal="true" aria-labelledby="tour-step-title">
    {box && <div className="tour-focus" style={box} />}
    <section className="tour-popover" aria-live="polite">
      <div className="tour-popover-top"><span>{index + 1} / {EVENTISE_TOUR_STEPS.length}</span><button type="button" onClick={() => close(true)} aria-label="Turu kapat">×</button></div>
      <p className="tour-step-eyebrow">{step.eyebrow}</p><h2 id="tour-step-title">{step.title}</h2><p>{step.description}</p>
      <div className="tour-dots" aria-hidden="true">{EVENTISE_TOUR_STEPS.map((item, dot) => <i className={dot === index ? 'active' : ''} key={item.id}/>)}</div>
      <div className="tour-actions">{index > 0 ? <button type="button" className="tour-text-button" onClick={() => move(-1)}>Geri</button> : <button type="button" className="tour-text-button" onClick={() => close(true)}>Turu kapat</button>}<button type="button" className="primary" onClick={() => finish ? close(true) : move(1)}>{finish ? 'Turu tamamla' : 'Devam'} <span>→</span></button></div>
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
