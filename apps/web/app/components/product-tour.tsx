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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (!welcome && event.key === 'ArrowRight') setIndex(value => Math.min(value + 1, EVENTISE_TOUR_STEPS.length - 1));
      if (!welcome && event.key === 'ArrowLeft') setIndex(value => Math.max(value - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, open, welcome]);

  useLayoutEffect(() => {
    if (!open || welcome) return;
    const update = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${EVENTISE_TOUR_STEPS[index].target}"]`);
      if (!target) { setBox(null); return; }
      const rect = target.getBoundingClientRect();
      setBox({ top: Math.max(8, rect.top - 7), left: Math.max(8, rect.left - 7), width: Math.min(window.innerWidth - 16, rect.width + 14), height: rect.height + 14 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [index, open, welcome]);

  if (!open) return null;
  if (welcome) return <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-welcome-title">
    <div className="tour-welcome">
      <span className="tour-spark">✦</span><p className="eyebrow">EVENTISE'A HOŞ GELDİNİZ</p>
      <h2 id="tour-welcome-title">İyi bir etkinlik, iyi bir akışla başlar.</h2>
      <p>Başvurudan kapı girişine, iletişimden sertifikaya kadar bütün süreci tek merkezden yönetin.</p>
      <div className="tour-value-row"><span>Başvuruları yönetin</span><span>Katılımı hızlandırın</span><span>Etkiyi görünür kılın</span></div>
      <div className="tour-actions"><button type="button" className="tour-text-button" onClick={() => close(true)}>Kendim keşfedeceğim</button><button type="button" className="primary" onClick={() => setWelcome(false)}>2 dakikada tanıyın <span>→</span></button></div>
    </div>
  </div>;

  const step = EVENTISE_TOUR_STEPS[index];
  const finish = index === EVENTISE_TOUR_STEPS.length - 1;
  return <div className="tour-layer tour-spotlight-layer" role="dialog" aria-modal="true" aria-labelledby="tour-step-title">
    {box && <div className="tour-focus" style={box} />}
    <section className="tour-popover" aria-live="polite">
      <div className="tour-popover-top"><span>{index + 1} / {EVENTISE_TOUR_STEPS.length}</span><button type="button" onClick={() => close()} aria-label="Turu kapat">×</button></div>
      <h2 id="tour-step-title">{step.title}</h2><p>{step.description}</p>
      <div className="tour-dots" aria-hidden="true">{EVENTISE_TOUR_STEPS.map((item, dot) => <i className={dot === index ? 'active' : ''} key={item.id}/>)}</div>
      <div className="tour-actions">{index > 0 ? <button type="button" className="tour-text-button" onClick={() => setIndex(index - 1)}>Geri</button> : <button type="button" className="tour-text-button" onClick={() => close()}>Turu kapat</button>}<button type="button" className="primary" onClick={() => finish ? close(true) : setIndex(index + 1)}>{finish ? 'Keşfetmeye başla' : 'Devam'} <span>→</span></button></div>
    </section>
  </div>;
}

export function TourRedirector() {
  useEffect(() => {
    const listener = () => {
      if (document.querySelector('[data-tour-id="event-overview"]')) return;
      const path = localStorage.getItem('eventise-last-event-path');
      if (path) { sessionStorage.setItem('eventise-start-tour', 'true'); window.location.assign(path); }
      else window.location.assign('/dashboard#events');
    };
    window.addEventListener('eventise:start-product-tour', listener);
    return () => window.removeEventListener('eventise:start-product-tour', listener);
  }, []);
  return null;
}

