import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { JobQueue } from '../../infrastructure/jobs/job-queue.port';
import { JobRunnerService } from '../../infrastructure/jobs/job-runner.service';
import { StorageProvider } from '../../infrastructure/storage/storage-provider.port';
import { PdfProvider, CertificateField } from '../../infrastructure/pdf/pdf-provider.port';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { AuditService } from '../audit/audit.service';

interface CertificateDesign {
  backgroundAssetId?: string | null;
  primaryColor?: string | null;
  signatureLabel?: string | null;
  includeQr?: boolean;
  orientation?: string;
}

@Injectable()
export class CertificatesService implements OnModuleInit {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(JobQueue) private jobs: JobQueue, @Inject(JobRunnerService) private runner: JobRunnerService, @Inject(StorageProvider) private storage: StorageProvider, @Inject(PdfProvider) private pdf: PdfProvider, @Inject(OrganizationAccessService) private access: OrganizationAccessService, @Inject(AuditService) private audit: AuditService) {}
  onModuleInit() { this.runner.register('certificate.generate', p => this.generate(String(p.certificateId))); }

  async createTemplate(userId: string, organizationId: string, eventId: string, name: string, bodyTemplate: string, design?: CertificateDesign) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    return this.prisma.certificateTemplate.create({ data: { eventId, name, bodyTemplate, backgroundAssetId: design?.backgroundAssetId ?? null, primaryColor: design?.primaryColor ?? null, signatureLabel: design?.signatureLabel ?? null, includeQr: design?.includeQr ?? true, orientation: design?.orientation ?? 'LANDSCAPE' } });
  }

  async updateTemplate(userId: string, organizationId: string, eventId: string, templateId: string, data: { name?: string; bodyTemplate?: string; primaryColor?: string | null; signatureLabel?: string | null; includeQr?: boolean; orientation?: string; backgroundAssetId?: string | null }) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const found = await this.prisma.certificateTemplate.findFirst({ where: { id: templateId, eventId } });
    if (!found) throw new NotFoundException('Sertifika şablonu bulunamadı.');
    return this.prisma.certificateTemplate.update({ where: { id: templateId }, data: { name: data.name, bodyTemplate: data.bodyTemplate, primaryColor: data.primaryColor, signatureLabel: data.signatureLabel, includeQr: data.includeQr, orientation: data.orientation, backgroundAssetId: data.backgroundAssetId } });
  }

  async requestBackgroundUpload(userId: string, organizationId: string, eventId: string, name: string, contentType: string, sizeBytes: number) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    if (!['image/jpeg', 'image/png'].includes(contentType) || sizeBytes < 1 || sizeBytes > 10_000_000) throw new BadRequestException('Sertifika arka planı yalnız JPEG veya PNG, en fazla 10 MB olabilir.');
    const key = `organizations/${organizationId}/events/${eventId}/certificate-backgrounds/${randomUUID()}.${contentType === 'image/png' ? 'png' : 'jpg'}`;
    const asset = await this.prisma.mediaAsset.create({ data: { organizationId, storageKey: key, originalName: name.slice(0, 200), contentType, sizeBytes } });
    return { assetId: asset.id, ...(await this.storage.createUploadGrant(key, contentType, 900)) };
  }

  async confirmBackgroundUpload(userId: string, organizationId: string, assetId: string) {
    await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: assetId, organizationId } });
    if (!asset || asset.status !== 'PENDING') throw new BadRequestException('Geçersiz yükleme kaydı.');
    await this.prisma.mediaAsset.update({ where: { id: assetId }, data: { status: 'ACTIVE' } });
    return { assetId };
  }

  async issue(userId: string, organizationId: string, eventId: string, templateId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    if (!await this.prisma.certificateTemplate.findFirst({ where: { id: templateId, eventId } })) throw new NotFoundException('Sertifika şablonu bulunamadı.');
    const eligible = await this.prisma.eventRegistration.findMany({ where: { eventId, applicationStatus: 'ACCEPTED', attendance: { status: { in: ['CHECKED_IN', 'MANUALLY_CONFIRMED'] } } }, select: { id: true } });
    for (const registration of eligible) {
      const certificate = await this.prisma.certificate.upsert({ where: { registrationId_templateId: { registrationId: registration.id, templateId } }, create: { eventId, registrationId: registration.id, templateId, verificationCode: randomBytes(12).toString('hex') }, update: {} });
      await this.jobs.enqueue({ type: 'certificate.generate', payload: { certificateId: certificate.id }, idempotencyKey: `certificate:${certificate.id}` });
    }
    await this.audit.record({ actorId: userId, organizationId, action: 'certificates.queued', resourceType: 'event', resourceId: eventId, metadata: { count: eligible.length } });
    return { queued: eligible.length };
  }

  async mine(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    const rows = await this.prisma.certificate.findMany({ where: { registration: { email: user.email }, status: 'READY' }, include: { event: { select: { title: true, startsAt: true, organization: { select: { name: true } } } } }, orderBy: { issuedAt: 'desc' } });
    return Promise.all(rows.map(async c => ({ ...c, downloadUrl: c.storageKey ? await this.storage.createDownloadUrl(c.storageKey, 900) : null })));
  }

  async verify(code: string) {
    const c = await this.prisma.certificate.findUnique({ where: { verificationCode: code }, include: { event: { select: { title: true, startsAt: true, organization: { select: { name: true } } } }, registration: { select: { firstName: true, lastName: true } } } });
    if (!c || c.status !== 'READY') throw new NotFoundException('Sertifika doğrulanamadı.');
    return { verificationCode: code, participant: `${c.registration.firstName} ${c.registration.lastName}`, event: c.event.title, organization: c.event.organization.name, eventDate: c.event.startsAt, issuedAt: c.issuedAt };
  }

  private async generate(id: string) {
    const c = await this.prisma.certificate.findUnique({ where: { id }, include: { event: { include: { organization: true } }, registration: true, template: { include: { backgroundAsset: true } } } });
    if (!c || c.status === 'READY') return;
    try {
      if (!c.registration) throw new BadRequestException('Katılımcı bulunamadı.');
      const participantName = `${c.registration.firstName} ${c.registration.lastName}`;
      const eventDate = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(c.event.startsAt);
      const verifyUrl = `${process.env.PUBLIC_BASE_URL ?? ''}/certificates/${c.verificationCode}`;

      const body = c.template.bodyTemplate
        .replaceAll('{{participant.full_name}}', participantName)
        .replaceAll('{{event.name}}', c.event.title)
        .replaceAll('{{organization.name}}', c.event.organization.name)
        .replaceAll('{{event.start_date}}', eventDate)
        .replaceAll('{{certificate.verification_code}}', c.verificationCode)
        .replaceAll('{{certificate.url}}', verifyUrl);

      // Arka plan görselini yükle (varsa)
      let backgroundBytes: Buffer | null = null;
      if (c.template.backgroundAsset && c.template.backgroundAsset.status === 'ACTIVE') {
        backgroundBytes = await this.storage.get(c.template.backgroundAsset.storageKey);
      }

      // QR kodu üret
      let qrBytes: Buffer | null = null;
      if (c.template.includeQr) {
        const dataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 300, color: { dark: c.template.primaryColor ?? '#1a1626', light: '#ffffff' } });
        qrBytes = Buffer.from(dataUrl.split(',')[1], 'base64');
      }

      const orientation = c.template.orientation === 'PORTRAIT' ? 'PORTRAIT' : 'LANDSCAPE';
      const isLandscape = orientation === 'LANDSCAPE';
      const pageWidth = isLandscape ? 842 : 595;
      const pageHeight = isLandscape ? 595 : 842;
      const centerX = pageWidth / 2;

      // Tasarım yoksa varsayılan yerleşim — arka plan varsa sadece gövde + imza + QR overlay.
      const hasBackground = !!backgroundBytes;
      const fields: CertificateField[] = [];

      if (!hasBackground) {
        // Arka plansız: başlık + isim + gövde + org + tarih + doğrulama kodu
        fields.push({ text: 'KATILIM SERTİFİKASI', x: centerX, y: pageHeight - 120, size: 24, bold: true, color: c.template.primaryColor ?? undefined, align: 'center' });
        fields.push({ text: participantName, x: centerX, y: pageHeight - 200, size: 36, bold: true, align: 'center' });
        fields.push({ text: body, x: centerX, y: pageHeight - 270, size: 13, align: 'center', maxWidth: pageWidth - 200 });
        fields.push({ text: c.event.organization.name, x: centerX, y: 130, size: 14, bold: true, align: 'center' });
        if (c.template.signatureLabel) fields.push({ text: c.template.signatureLabel, x: centerX, y: 110, size: 10, align: 'center' });
      } else {
        // Arka planlı: sadece dinamik içerik overlay (tasarım statik görselde)
        fields.push({ text: participantName, x: centerX, y: pageHeight / 2, size: 32, bold: true, color: c.template.primaryColor ?? undefined, align: 'center' });
        fields.push({ text: body, x: centerX, y: pageHeight / 2 - 60, size: 12, align: 'center', maxWidth: pageWidth - 240 });
        if (c.template.signatureLabel) fields.push({ text: c.template.signatureLabel, x: 120, y: 90, size: 11 });
      }

      const qrPosition = qrBytes ? { x: pageWidth - 110, y: 50, size: 60 } : undefined;

      const pdf = await this.pdf.certificateDocument({ orientation, backgroundBytes, fields, qrBytes, qrPosition });
      const key = `organizations/${c.event.organizationId}/events/${c.eventId}/certificates/${c.id}.pdf`;
      await this.storage.put(key, pdf, 'application/pdf');
      await this.prisma.certificate.update({ where: { id }, data: { status: 'READY', storageKey: key, issuedAt: new Date() } });
    } catch (e) {
      await this.prisma.certificate.update({ where: { id }, data: { status: 'FAILED', lastError: e instanceof Error ? e.message.slice(0, 500) : 'Üretim hatası' } });
      throw e;
    }
  }
}
