import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { EmailProvider } from '../../infrastructure/email/email-provider.port';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';

const DEFAULT_SUPPORT_REPORT_EMAIL = 'ersintek@gmail.com';
const CONTACT_EMAIL = 'ersintek@gmail.com';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character] as string));

@Injectable()
export class SupportReportsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(OrganizationAccessService) private readonly access: OrganizationAccessService,
    @Inject(EmailProvider) private readonly email: EmailProvider,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async create(userId: string, organizationId: string | undefined, description: string, page: string, type: 'SUPPORT' | 'CONTACT' = 'SUPPORT') {
    if (type === 'SUPPORT' && !organizationId) throw new BadRequestException('Kurum bilgisi gerekli.');
    if (organizationId) await this.access.requireMembership(userId, organizationId);
    const [user, organization] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } }),
      organizationId
        ? this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { name: true } })
        : Promise.resolve({ name: 'Sistem yöneticisi' }),
    ]);
    const reportedAt = new Date();
    const destination = type === 'CONTACT'
      ? CONTACT_EMAIL
      : this.config.get<string>('SUPPORT_REPORT_EMAIL')?.trim() || DEFAULT_SUPPORT_REPORT_EMAIL;
    const reportId = randomUUID();
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'İsimsiz kullanıcı';
    const isContact = type === 'CONTACT';

    await this.email.send({
      to: destination,
      replyTo: user.email,
      subject: `[Eventise ${isContact ? 'İletişim Formu' : 'Sorun Bildirimi'}] ${organization.name}`,
      idempotencyKey: `${isContact ? 'contact-message' : 'support-report'}:${reportId}`,
      html: `<h2>${isContact ? 'Yeni iletişim mesajı' : 'Yeni sorun bildirimi'}</h2>
        <p><strong>Kullanıcı:</strong> ${escapeHtml(name)} (${escapeHtml(user.email)})</p>
        <p><strong>Kurum:</strong> ${escapeHtml(organization.name)}</p>
        <p><strong>Tarih / saat:</strong> ${escapeHtml(reportedAt.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }))}</p>
        <p><strong>Ekran:</strong> ${escapeHtml(page)}</p>
        <hr><p style="white-space:pre-wrap">${escapeHtml(description.trim())}</p>`,
    });
    await this.audit.record({
      actorId: userId,
      organizationId,
      action: isContact ? 'contact_message.sent' : 'support_report.sent',
      resourceType: isContact ? 'contact_message' : 'support_report',
      resourceId: reportId,
      metadata: { page },
    });
    return { sent: true };
  }
}
