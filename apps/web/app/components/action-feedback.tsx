'use client';

import { useEffect } from 'react';

export type FeedbackKind = 'success' | 'error' | 'info';
export type FeedbackState = { kind: FeedbackKind; message: string } | null;

export function ActionFeedback({ feedback, onDismiss }: { feedback: FeedbackState; onDismiss?: () => void }) {
  useEffect(() => {
    if (!feedback || !onDismiss || feedback.kind === 'error') return;
    const timeout = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timeout);
  }, [feedback, onDismiss]);

  if (!feedback) return null;
  return <div className={`action-feedback ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
    <span aria-hidden="true">{feedback.kind === 'success' ? '✓' : feedback.kind === 'error' ? '!' : 'i'}</span>
    <p>{feedback.message}</p>
    {onDismiss && <button type="button" onClick={onDismiss} aria-label="Bildirimi kapat">×</button>}
  </div>;
}

export function SaveState({ dirty, savedAt }: { dirty: boolean; savedAt?: Date | null }) {
  return <span className={`save-state ${dirty ? 'dirty' : 'saved'}`} aria-live="polite">
    <i aria-hidden="true" />
    {dirty ? 'Kaydedilmemiş değişiklikler' : savedAt ? `Son güncelleme ${savedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Tüm değişiklikler kaydedildi'}
  </span>;
}
