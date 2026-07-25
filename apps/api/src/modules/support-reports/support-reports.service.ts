import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { EmailProvider } from '../../infrastructure/email/email-provider.port';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';

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

  async create(userId: string, organizationId: string, description: string, page: string) {
    await this.access.requireMembership(userId, organizationId);
    const [user, organization] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } }),
      this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { name: true } }),
    ]);
    const reportedAt = new Date();
    const destination = this.config.get<string>('SUPPORT_REPORT_EMAIL') ?? this.config.getOrThrow<string>('SMTP_USER');
    const reportId = randomUUID();
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'İsimsiz kullanıcı';

    await this.email.send({
      to: destination,
      replyTo: user.email,
      subject: `[Eventise Sorun Bildirimi] ${organization.name}`,
      idempotencyKey: `support-report:${reportId}`,
      html: `<h2>Yeni sorun bildirimi</h2>
        <p><strong>Kullanıcı:</strong> ${escapeHtml(name)} (${escapeHtml(user.email)})</p>
        <p><strong>Kurum:</strong> ${escapeHtml(organization.name)}</p>
        <p><strong>Tarih / saat:</strong> ${escapeHtml(reportedAt.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }))}</p>
        <p><strong>Ekran:</strong> ${escapeHtml(page)}</p>
        <hr><p style="white-space:pre-wrap">${escapeHtml(description.trim())}</p>`,
    });
    await this.audit.record({
      actorId: userId,
      organizationId,
      action: 'support_report.sent',
      resourceType: 'support_report',
      resourceId: reportId,
      metadata: { page },
    });
    return { sent: true };
  }
}
