import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

function setup(user: unknown = null) {
  const prisma = { user: { findUnique: vi.fn().mockResolvedValue(user), create: vi.fn() } };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };
  const audit = { record: vi.fn().mockResolvedValue({}) };
  return { service: new AuthService(prisma as never, jwt as never, audit as never), prisma, jwt, audit };
}
describe('AuthService', () => {
  it('does not reveal whether a login email exists', async () => {
    const { service } = setup();
    await expect(service.login({ email: 'none@example.org', password: 'WrongPassword1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rejects duplicate registration', async () => {
    const { service } = setup({ id: 'existing' });
    await expect(service.register({ email: 'person@example.org', firstName: 'Ada', lastName: 'Lovelace', password: 'SecurePassword1' })).rejects.toBeInstanceOf(ConflictException);
  });
  it('returns a signed token for a valid active user', async () => {
    const passwordHash = await hash('SecurePassword1', 4), user = { id: 'u1', email: 'person@example.org', firstName: 'Ada', lastName: 'Lovelace', passwordHash, status: 'ACTIVE' };
    const { service, audit } = setup(user);
    await expect(service.login({ email: user.email, password: 'SecurePassword1' })).resolves.toMatchObject({ accessToken: 'signed-token', user: { id: 'u1' } });
    expect(audit.record).toHaveBeenCalledOnce();
  });
});
