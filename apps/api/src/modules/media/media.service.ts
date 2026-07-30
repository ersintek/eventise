import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PhotoModerationStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { StorageProvider } from '../../infrastructure/storage/storage-provider.port';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { TiersService } from '../tiers/tiers.service';

@Injectable()
export class MediaService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(StorageProvider) private readonly storage: StorageProvider, @Inject(TiersService) private readonly tiers: TiersService, @Inject(OrganizationAccessService) private readonly access: OrganizationAccessService, @Inject(AuditService) private readonly audit: AuditService) {}

  async requestPhotoUpload(userId: string, eventId: string, name: string, contentType: string, sizeBytes: number) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType) || sizeBytes < 1 || sizeBytes > 15_000_000) throw new BadRequestException('Yalnız JPEG, PNG veya WebP ve en fazla 15 MB yüklenebilir.');
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı.');
    const registration = await this.registrationFor(userId, eventId);
    const limits = await this.tiers.photoLimits(event.organizationId);
    const [eventCount, userCount] = await Promise.all([this.prisma.eventPhoto.count({ where: { eventId, status: { not: 'REJECTED' } } }), this.prisma.eventPhoto.count({ where: { eventId, uploaderRegistrationId: registration.id, status: { not: 'REJECTED' } } })]);
    if (eventCount >= limits.maxPhotosPerEvent) throw new BadRequestException('Etkinlik fotoğraf limiti doldu.');
    if (userCount >= limits.maxPhotosPerParticipant) throw new BadRequestException('Katılımcı fotoğraf limitiniz doldu.');
    const reservation = await this.tiers.reserveStorage(event.organizationId, 'photo_storage', sizeBytes);
    const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
    const key = `organizations/${event.organizationId}/events/${eventId}/photos/${randomUUID()}.${extension}`;
    const asset = await this.prisma.mediaAsset.create({ data: { organizationId: event.organizationId, quotaReservationId: reservation.id, storageKey: key, originalName: name.slice(0, 200), contentType, sizeBytes } });
    return { assetId: asset.id, reservationId: reservation.id, ...(await this.storage.createUploadGrant(key, contentType, 900)) };
  }

  async confirmPhoto(userId: string, eventId: string, assetId: string, reservationId: string, caption?: string) {
    const registration = await this.registrationFor(userId, eventId);
    const [asset, event] = await Promise.all([this.prisma.mediaAsset.findUnique({ where: { id: assetId } }), this.prisma.event.findUnique({ where: { id: eventId } })]);
    if (!asset || !event || asset.organizationId !== event.organizationId || asset.quotaReservationId !== reservationId || asset.status !== 'PENDING') throw new BadRequestException('Geçersiz yükleme veya rezervasyon kaydı.');
    const reservation = await this.prisma.quotaReservation.findFirst({ where: { id: reservationId, organizationId: event.organizationId, key: 'photo_storage', bytes: asset.sizeBytes, consumedAt: null, expiresAt: { gt: new Date() } } });
    if (!reservation) throw new BadRequestException('Yükleme rezervasyonu geçersiz veya süresi dolmuş.');
    const bytes = await this.storage.get(asset.storageKey);
    if (!bytes || BigInt(bytes.length) !== asset.sizeBytes) throw new BadRequestException('Dosya yüklenmemiş veya bildirilen boyutla eşleşmiyor.');
    return this.prisma.$transaction(async tx => {
      const [activated, consumed] = await Promise.all([
        tx.mediaAsset.updateMany({ where: { id: assetId, status: 'PENDING' }, data: { status: 'ACTIVE' } }),
        tx.quotaReservation.updateMany({ where: { id: reservationId, consumedAt: null }, data: { consumedAt: new Date() } }),
      ]);
      if (activated.count !== 1 || consumed.count !== 1) throw new BadRequestException('Yükleme daha önce onaylanmış veya rezervasyon kullanılmış.');
      return tx.eventPhoto.create({ data: { eventId, assetId, uploaderRegistrationId: registration.id, caption: caption?.trim().slice(0, 500) } });
    });
  }

  async manage(userId: string, organizationId: string, eventId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const photos = await this.prisma.eventPhoto.findMany({ where: { eventId, event: { organizationId } }, include: { asset: true, uploaderRegistration: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } });
    return Promise.all(photos.map(async (photo) => ({ ...photo, url: await this.storage.createDownloadUrl(photo.asset.storageKey, 900) })));
  }

  async moderate(userId: string, organizationId: string, eventId: string, photoId: string, status: PhotoModerationStatus) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    if (status === 'PENDING') throw new BadRequestException('Moderasyon sonucu pending olamaz.');
    const photo = await this.prisma.eventPhoto.findFirst({ where: { id: photoId, eventId, event: { organizationId } } });
    if (!photo) throw new NotFoundException('Fotoğraf bulunamadı.');
    const updated = await this.prisma.eventPhoto.update({ where: { id: photoId }, data: { status, moderatedById: userId, moderatedAt: new Date() } });
    await this.audit.record({ actorId: userId, organizationId, action: 'photo.moderated', resourceType: 'photo', resourceId: photoId, metadata: { status } });
    return updated;
  }

  async gallery(eventId: string) { const photos = await this.prisma.eventPhoto.findMany({ where: { eventId, status: 'APPROVED', event: { publicationStatus: 'PUBLISHED', visibility: { not: 'INVITE_ONLY' } }, asset: { status: 'ACTIVE' } }, include: { asset: true }, orderBy: { createdAt: 'desc' } }); return Promise.all(photos.map(async (photo) => ({ id: photo.id, caption: photo.caption, url: await this.storage.createDownloadUrl(photo.asset.storageKey, 900) }))); }
  private async registrationFor(userId: string, eventId: string) { const user = await this.prisma.user.findUnique({ where: { id: userId } }); const registration = user ? await this.prisma.eventRegistration.findUnique({ where: { eventId_email: { eventId, email: user.email } } }) : null; if (!registration || registration.applicationStatus !== 'ACCEPTED') throw new NotFoundException('Kabul edilmiş katılımcı kaydı bulunamadı.'); return registration; }
}
