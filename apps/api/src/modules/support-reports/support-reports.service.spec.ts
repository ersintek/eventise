import { describe, expect, it, vi } from 'vitest';
import { SupportReportsService } from './support-reports.service';

function createService(supportReportEmail?: string) {
  const prisma = {
    user: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        firstName: 'Ersin',
        lastName: 'Tek',
        email: 'reporter@example.org',
      }),
    },
    organization: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ name: 'Eventise' }),
    },
  };
  const access = { requireMembership: vi.fn().mockResolvedValue(undefined) };
  const email = { send: vi.fn().mockResolvedValue({ accepted: true, providerMessageId: 'message-1' }) };
  const config = { get: vi.fn((key: string) => key === 'SUPPORT_REPORT_EMAIL' ? supportReportEmail : undefined) };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new SupportReportsService(prisma as never, access as never, email as never, config as never, audit as never);
  return { service, email };
}

describe('SupportReportsService', () => {
  it('sends reports to ersintek@gmail.com by default', async () => {
    const { service, email } = createService();

    await service.create('user-1', 'organization-1', 'Gönderim çalışmıyor.', '/dashboard');

    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ersintek@gmail.com',
      replyTo: 'reporter@example.org',
    }));
  });

  it('uses an explicitly configured support address', async () => {
    const { service, email } = createService(' support@example.org ');

    await service.create('user-1', 'organization-1', 'Gönderim çalışmıyor.', '/dashboard');

    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'support@example.org' }));
  });

  it('always sends contact messages to the public contact address', async () => {
    const { service, email } = createService('support@example.org');

    await service.create('user-1', 'organization-1', 'Merhaba Eventise.', '/dashboard/about', 'CONTACT');

    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ersintek@gmail.com',
      replyTo: 'reporter@example.org',
      subject: '[Eventise İletişim Formu] Eventise',
    }));
  });

  it('lets a signed-in system administrator send a contact message without an organization', async () => {
    const { service, email } = createService();

    await service.create('admin-1', undefined, 'Bir önerim var.', '/dashboard/about', 'CONTACT');

    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ersintek@gmail.com',
      subject: '[Eventise İletişim Formu] Sistem yöneticisi',
    }));
  });
});
