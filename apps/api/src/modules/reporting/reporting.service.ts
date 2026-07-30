import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { JobQueue } from '../../infrastructure/jobs/job-queue.port';
import { JobRunnerService } from '../../infrastructure/jobs/job-runner.service';
import { PdfProvider } from '../../infrastructure/pdf/pdf-provider.port';
import { StorageProvider } from '../../infrastructure/storage/storage-provider.port';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';

@Injectable()
export class ReportingService implements OnModuleInit {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JobQueue) private jobs: JobQueue,
    @Inject(JobRunnerService) private runner: JobRunnerService,
    @Inject(StorageProvider) private storage: StorageProvider,
    @Inject(PdfProvider) private pdf: PdfProvider,
    @Inject(OrganizationAccessService) private access: OrganizationAccessService,
    @Inject(AuditService) private audit: AuditService,
  ) {}

  onModuleInit() {
    this.runner.register('report.generate', p => this.generate(String(p.exportId)));
  }

  async summary(userId: string, organizationId: string, eventId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const [registrations, accepted, checkedIn, photos, feedback] = await Promise.all([
      this.prisma.eventRegistration.count({ where: { eventId } }),
      this.prisma.eventRegistration.count({ where: { eventId, applicationStatus: 'ACCEPTED' } }),
      this.prisma.attendanceRecord.count({ where: { eventId, status: { in: ['CHECKED_IN', 'MANUALLY_CONFIRMED'] } } }),
      this.prisma.eventPhoto.count({ where: { eventId, status: 'APPROVED' } }),
      this.prisma.feedbackSubmission.count({ where: { form: { eventId } } }),
    ]);
    return {
      registrations,
      accepted,
      checkedIn,
      attendanceRate: accepted ? Math.round(checkedIn / accepted * 10000) / 100 : 0,
      approvedPhotos: photos,
      feedbackSubmissions: feedback,
    };
  }

  async request(userId: string, organizationId: string, eventId: string, format: 'csv' | 'xlsx' | 'pdf') {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    if (!['csv', 'xlsx', 'pdf'].includes(format)) throw new BadRequestException('Rapor formatı CSV, XLSX veya PDF olmalıdır.');

    const pending = await this.prisma.reportExport.findFirst({
      where: { eventId, format, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (pending) return { ...pending, reused: true };

    const report = await this.prisma.reportExport.create({
      data: { eventId, format, status: 'PENDING', requestedById: userId },
    });
    await this.jobs.enqueue({
      type: 'report.generate',
      payload: { exportId: report.id },
      idempotencyKey: `report:${report.id}`,
    });
    await this.audit.record({
      actorId: userId,
      organizationId,
      action: 'report.queued',
      resourceType: 'report',
      resourceId: report.id,
      metadata: { format },
    });
    return { ...report, reused: false };
  }

  async status(userId: string, organizationId: string, id: string) {
    const report = await this.prisma.reportExport.findUnique({ where: { id }, include: { event: true } });
    if (!report || report.event.organizationId !== organizationId) throw new NotFoundException('Rapor bulunamadı.');
    await this.access.requireEventAccess(userId, organizationId, report.eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    return {
      ...report,
      downloadUrl: report.storageKey ? await this.storage.createDownloadUrl(report.storageKey, 900) : null,
    };
  }

  private async generate(id: string) {
    const report = await this.prisma.reportExport.findUnique({
      where: { id },
      include: { event: { include: { organization: true, registrations: { include: { attendance: true } } } } },
    });
    if (!report || report.status === 'READY') return;
    try {
      const rows = report.event.registrations.map(r => ({
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        applicationStatus: r.applicationStatus,
        attendanceStatus: r.attendance?.status ?? 'NOT_CONFIRMED',
      }));
      let data: Buffer;
      let contentType: string;
      if (report.format === 'csv') {
        const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
        data = Buffer.from([
          'Ad,Soyad,E-posta,Başvuru,Katılım',
          ...rows.map(r => [r.firstName, r.lastName, r.email, r.applicationStatus, r.attendanceStatus].map(escape).join(',')),
        ].join('\n'));
        contentType = 'text/csv';
      } else if (report.format === 'xlsx') {
        const workbook = new Workbook();
        const sheet = workbook.addWorksheet('Katılımcılar');
        sheet.columns = [
          { header: 'Ad', key: 'firstName' },
          { header: 'Soyad', key: 'lastName' },
          { header: 'E-posta', key: 'email' },
          { header: 'Başvuru', key: 'applicationStatus' },
          { header: 'Katılım', key: 'attendanceStatus' },
        ];
        sheet.addRows(rows);
        data = Buffer.from(await workbook.xlsx.writeBuffer());
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        data = await this.pdf.textDocument(`${report.event.title} Etkinlik Özeti`, [
          `Kurum: ${report.event.organization.name}`,
          `Toplam kayıt: ${rows.length}`,
          `Katılım: ${rows.filter(r => r.attendanceStatus !== 'NOT_CONFIRMED').length}`,
        ]);
        contentType = 'application/pdf';
      }
      const key = `organizations/${report.event.organizationId}/events/${report.eventId}/reports/${report.id}.${report.format}`;
      await this.storage.put(key, data, contentType);
      await this.prisma.reportExport.update({
        where: { id },
        data: { status: 'READY', storageKey: key, completedAt: new Date(), lastError: null },
      });
    } catch (error) {
      await this.prisma.reportExport.update({
        where: { id },
        data: { status: 'FAILED', lastError: error instanceof Error ? error.message.slice(0, 500) : 'Rapor hatası' },
      });
      throw error;
    }
  }
}
