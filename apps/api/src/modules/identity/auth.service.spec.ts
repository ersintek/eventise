import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

function setup(user: unknown = null) {
  const prisma = { user: { findUnique: vi.fn().mockResolvedValue(user), create: vi.fn(), update: vi.fn() } };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };
  const audit = { record: vi.fn().mockResolvedValue({}) };
  const googleIdentity = { verify: vi.fn() };
  return { service: new AuthService(prisma as never, jwt as never, audit as never, googleIdentity as never), prisma, jwt, audit, googleIdentity };
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
  it('does not create an account during a Google sign-in attempt', async () => {
    const { service, prisma, googleIdentity } = setup();
    googleIdentity.verify.mockResolvedValue({ subject: 'google-new', email: 'new@example.org', firstName: 'Yeni', lastName: 'Kullanıcı' });
    await expect(service.google('valid-google-id-token')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
  it('creates an account for a verified Google identity after an explicit registration choice', async () => {
    const { service, prisma, googleIdentity, audit } = setup();
    googleIdentity.verify.mockResolvedValue({ subject: 'google-1', email: 'ada@example.org', firstName: 'Ada', lastName: 'Lovelace' });
    const created = { id: 'u2', email: 'ada@example.org', firstName: 'Ada', lastName: 'Lovelace', status: 'ACTIVE', systemRole: 'USER' };
    prisma.user.create.mockResolvedValue(created);
    await expect(service.google('valid-google-id-token', true)).resolves.toMatchObject({ accessToken: 'signed-token', user: { id: 'u2' } });
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ googleSubject: 'google-1', emailVerifiedAt: expect.any(Date) }) }));
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'identity.user_logged_in_google' }));
  });
});
