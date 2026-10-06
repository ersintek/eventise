import { createHmac, timingSafeEqual } from 'node:crypto';

export const COP31_EDITOR_COOKIE = 'cop31_editor_session';
const lifetimeSeconds = 60 * 60 * 12;

function password() { return process.env.COP31_EDITOR_PASSWORD ?? ''; }
function signature(expiresAt: string) { return createHmac('sha256', password()).update(`cop31-editor:${expiresAt}`).digest('base64url'); }

export function createCop31EditorSession() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + lifetimeSeconds);
  return { value: `${expiresAt}.${signature(expiresAt)}`, maxAge: lifetimeSeconds };
}

export function verifyCop31EditorSession(value?: string) {
  if (!value || !password()) return false;
  const [expiresAt, candidate] = value.split('.');
  if (!expiresAt || !candidate || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
  const expected = signature(expiresAt); const left = Buffer.from(candidate); const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyCop31EditorPassword(candidate: unknown) {
  if (typeof candidate !== 'string' || !password()) return false;
  const left = Buffer.from(candidate); const right = Buffer.from(password());
  return left.length === right.length && timingSafeEqual(left, right);
}
