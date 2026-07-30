import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StorageProvider } from '../../infrastructure/storage/storage-provider.port';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { TiersService } from '../tiers/tiers.service';

const mimeExtensions: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
};

@Injectable()
export class ResourcesService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(StorageProvider) private storage: StorageProvider,
    @Inject(TiersService) private tiers: TiersService,
    @Inject(OrganizationAccessService) private access: OrganizationAccessService,
  ) {}

  async requestUpload(userId: string, organizationId: string, eventId: string, name: string, contentType: string, sizeBytes: number) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const limits = await this.tiers.limitsFor(userId, organizationId);
    const type = mimeExtensions[contentType];
    if (!type || !limits.allowedFileTypes.includes(type)) throw new BadRequestException('Bu dosya türüne tier kapsamında izin verilmiyor.');
    if (sizeBytes < 1 || sizeBytes > 50_000_000) throw new BadRequestException('Dosya en fazla 50 MB olabilir.');
    const reservation = await this.tiers.reserveStorage(organizationId, 'file_storage', sizeBytes);
    const key = `organizations/${organizationId}/events/${eventId}/resources/${randomUUID()}.${type.toLowerCase()}`;
    const asset = await this.prisma.mediaAsset.create({
      data: { organizationId, quotaReservationId: reservation.id, storageKey: key, originalName: name.trim().slice(0, 200), contentType, sizeBytes },
    });
    return { assetId: asset.id, reservationId: reservation.id, ...(await this.storage.createUploadGrant(key, contentType, 900)) };
  }

  async confirm(userId: string, organizationId: string, eventId: string, title: string, assetId: string, reservationId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: assetId, organizationId, status: 'PENDING' } });
    if (!asset || asset.quotaReservationId !== reservationId || !asset.storageKey.startsWith(`organizations/${organizationId}/events/${eventId}/resources/`)) throw new BadRequestException('Yükleme kaydı bu etkinlik kaynağına veya rezervasyona ait değil.');
    const reservation = await this.prisma.quotaReservation.findFirst({
      where: { id: reservationId, organizationId, key: 'file_storage', bytes: asset.sizeBytes, consumedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!reservation) throw new BadRequestException('Yükleme veya kota rezervasyonu geçersiz.');
    const bytes = await this.storage.get(asset.storageKey);
    if (!bytes || BigInt(bytes.length) !== asset.sizeBytes) throw new BadRequestException('Dosya yüklenmemiş veya bildirilen boyutla eşleşmiyor.');
    return this.prisma.$transaction(async tx => {
      const [activated, consumed] = await Promise.all([
        tx.mediaAsset.updateMany({ where: { id: assetId, status: 'PENDING' }, data: { status: 'ACTIVE' } }),
        tx.quotaReservation.updateMany({ where: { id: reservationId, consumedAt: null }, data: { consumedAt: new Date() } }),
      ]);
      if (activated.count !== 1 || consumed.count !== 1) throw new BadRequestException('Yükleme daha önce onaylanmış veya rezervasyon kullanılmış.');
      return tx.eventResource.create({ data: { eventId, kind: 'FILE', title: title.trim().slice(0, 200), assetId } });
    });
  }

  async addLink(userId: string, organizationId: string, eventId: string, title: string, url: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new BadRequestException('Geçerli bir bağlantı girin.'); }
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new BadRequestException('Yalnız HTTP(S) bağlantıları desteklenir.');
    return this.prisma.eventResource.create({ data: { eventId, kind: 'LINK', title: title.trim().slice(0, 200), externalUrl: parsed.toString() } });
  }

  async list(userId: string, eventId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const registration = user ? await this.prisma.eventRegistration.findUnique({ where: { eventId_email: { eventId, email: user.email } } }) : null;
    if (!registration || registration.applicationStatus !== 'ACCEPTED') throw new NotFoundException('Kabul edilmiş katılımcı kaydı bulunamadı.');
    const rows = await this.prisma.eventResource.findMany({
      where: { eventId, visible: true, OR: [{ kind: 'LINK' }, { asset: { status: 'ACTIVE' } }] },
      include: { asset: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map(async resource => ({
      ...resource,
      asset: undefined,
      url: resource.kind === 'LINK' ? resource.externalUrl : resource.asset ? await this.storage.createDownloadUrl(resource.asset.storageKey, 900) : null,
    })));
  }
}
