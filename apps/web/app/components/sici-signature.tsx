type SiciSignatureProps = {
  className?: string;
};

export function SiciSignature({ className = '' }: SiciSignatureProps) {
  return <a
    className={`sici-signature${className ? ` ${className}` : ''}`}
    href="https://www.sici.uk"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Social institute of change and impact — SICI"
  >
    <img src="/brand/sici-logo.png" alt="SICI" />
    <span><small>GELİŞTİREN</small>Social institute of change and impact</span>
  </a>;
}
