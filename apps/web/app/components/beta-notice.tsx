'use client';

import { useEffect, useRef, useState } from 'react';

export function BetaNotice() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return <>
    <button className="beta-badge" type="button" onClick={() => setOpen(true)} aria-label="Beta sürümü hakkında bilgi">
      <span aria-hidden="true">✦</span> beta
    </button>
    <dialog ref={dialog} className="compact-dialog beta-dialog" onClose={() => setOpen(false)} onClick={event => {
      if (event.target === dialog.current) setOpen(false);
    }}>
      <button className="dialog-close" type="button" onClick={() => setOpen(false)} aria-label="Kapat">×</button>
      <div className="dialog-icon" aria-hidden="true">✦</div>
      <p className="eyebrow">BETA SÜRÜMÜ</p>
      <h2>Eventise gelişmeye devam ediyor</h2>
      <p>Beta sürümünde görünüm ve kullanımda değişiklikler olabilir. Karşılaştığın sorunları ve daha da önemlisi önerilerini bize iletirsen, elimizden geldiğince hızlı biçimde uygulama planımıza alacağımızdan emin olabilirsin.</p>
    </dialog>
  </>;
}
