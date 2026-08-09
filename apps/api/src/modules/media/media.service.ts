import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PhotoModerationStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { StorageProvider } from '../../infrastructure/storage/storage-provider.port';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { TiersService } from '../tiers/tiers.service';

export type PageAssetKind = 'LOGO' | 'COVER';

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

  async pageAppearance(userId: string, organizationId: string, eventId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: {
        accentColor: true,
        coverAsset: { select: { storageKey: true, status: true } },
        organization: { select: { name: true, logoAsset: { select: { storageKey: true, status: true } } } },
      },
    });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı.');
    const [logoUrl, coverImageUrl] = await Promise.all([
      event.organization.logoAsset?.status === 'ACTIVE' ? this.storage.createDownloadUrl(event.organization.logoAsset.storageKey, 900) : null,
      event.coverAsset?.status === 'ACTIVE' ? this.storage.createDownloadUrl(event.coverAsset.storageKey, 900) : null,
    ]);
    return { accentColor: event.accentColor, organizationName: event.organization.name, logoUrl, coverImageUrl };
  }

  async updatePageAppearance(userId: string, organizationId: string, eventId: string, accentColor: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    if (!/^#[0-9a-f]{6}$/i.test(accentColor)) throw new BadRequestException('Geçerli bir vurgu rengi seçin.');
    const updated = await this.prisma.event.updateMany({ where: { id: eventId, organizationId }, data: { accentColor: accentColor.toUpperCase() } });
    if (!updated.count) throw new NotFoundException('Etkinlik bulunamadı.');
    await this.audit.record({ actorId: userId, organizationId, action: 'event.appearance_updated', resourceType: 'event', resourceId: eventId, metadata: { accentColor: accentColor.toUpperCase() } });
    return this.pageAppearance(userId, organizationId, eventId);
  }

  async requestPageAssetUpload(userId: string, organizationId: string, eventId: string, kind: PageAssetKind, name: string, contentType: string, sizeBytes: number) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const maxBytes = kind === 'LOGO' ? 5_000_000 : 15_000_000;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType) || sizeBytes < 1 || sizeBytes > maxBytes) {
      throw new BadRequestException(kind === 'LOGO' ? 'Logo JPEG, PNG veya WebP ve en fazla 5 MB olabilir.' : 'Kapak görseli JPEG, PNG veya WebP ve en fazla 15 MB olabilir.');
    }
    if (!await this.prisma.event.findFirst({ where: { id: eventId, organizationId }, select: { id: true } })) throw new NotFoundException('Etkinlik bulunamadı.');
    const reservation = await this.tiers.reserveStorage(organizationId, 'photo_storage', sizeBytes);
    const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
    const key = `organizations/${organizationId}/${kind === 'LOGO' ? 'branding' : `events/${eventId}/covers`}/${randomUUID()}.${extension}`;
    const asset = await this.prisma.mediaAsset.create({ data: { organizationId, quotaReservationId: reservation.id, storageKey: key, originalName: name.trim().slice(0, 200), contentType, sizeBytes } });
    return { assetId: asset.id, reservationId: reservation.id, ...(await this.storage.createUploadGrant(key, contentType, 900)) };
  }

  async confirmPageAsset(userId: string, organizationId: string, eventId: string, kind: PageAssetKind, assetId: string, reservationId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const [asset, event, reservation] = await Promise.all([
      this.prisma.mediaAsset.findFirst({ where: { id: assetId, organizationId, quotaReservationId: reservationId, status: 'PENDING' } }),
      this.prisma.event.findFirst({ where: { id: eventId, organizationId }, select: { coverAssetId: true, organization: { select: { logoAssetId: true } } } }),
      this.prisma.quotaReservation.findFirst({ where: { id: reservationId, organizationId, key: 'photo_storage', consumedAt: null, expiresAt: { gt: new Date() } } }),
    ]);
    if (!asset || !event || !reservation || reservation.bytes !== asset.sizeBytes) throw new BadRequestException('Yükleme geçersiz veya süresi dolmuş.');
    const bytes = await this.storage.get(asset.storageKey);
    if (!bytes || BigInt(bytes.length) !== asset.sizeBytes) throw new BadRequestException('Dosya yüklenmemiş veya bildirilen boyutla eşleşmiyor.');
    const previousAssetId = kind === 'LOGO' ? event.organization.logoAssetId : event.coverAssetId;
    await this.prisma.$transaction(async tx => {
      const [activated, consumed] = await Promise.all([
        tx.mediaAsset.updateMany({ where: { id: assetId, status: 'PENDING' }, data: { status: 'ACTIVE' } }),
        tx.quotaReservation.updateMany({ where: { id: reservationId, consumedAt: null }, data: { consumedAt: new Date() } }),
      ]);
      if (activated.count !== 1 || consumed.count !== 1) throw new BadRequestException('Yükleme daha önce onaylanmış.');
      if (kind === 'LOGO') await tx.organization.update({ where: { id: organizationId }, data: { logoAssetId: assetId } });
      else await tx.event.update({ where: { id: eventId }, data: { coverAssetId: assetId } });
      if (previousAssetId && previousAssetId !== assetId) await tx.mediaAsset.updateMany({ where: { id: previousAssetId, organizationId }, data: { status: 'DELETED' } });
    });
    if (previousAssetId && previousAssetId !== assetId) {
      const previous = await this.prisma.mediaAsset.findUnique({ where: { id: previousAssetId }, select: { storageKey: true } });
      if (previous) await this.storage.delete(previous.storageKey).catch(() => undefined);
    }
    await this.audit.record({ actorId: userId, organizationId, action: 'event.page_asset_updated', resourceType: 'event', resourceId: eventId, metadata: { kind } });
    return this.pageAppearance(userId, organizationId, eventId);
  }

  async removePageAsset(userId: string, organizationId: string, eventId: string, kind: PageAssetKind) {
    if (!['LOGO', 'COVER'].includes(kind)) throw new BadRequestException('Geçersiz görsel türü.');
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizationId }, select: { coverAssetId: true, organization: { select: { logoAssetId: true } } } });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı.');
    const assetId = kind === 'LOGO' ? event.organization.logoAssetId : event.coverAssetId;
    if (!assetId) return this.pageAppearance(userId, organizationId, eventId);
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: assetId, organizationId }, select: { storageKey: true } });
    await this.prisma.$transaction(async tx => {
      if (kind === 'LOGO') await tx.organization.update({ where: { id: organizationId }, data: { logoAssetId: null } });
      else await tx.event.update({ where: { id: eventId }, data: { coverAssetId: null } });
      await tx.mediaAsset.updateMany({ where: { id: assetId, organizationId }, data: { status: 'DELETED' } });
    });
    if (asset) await this.storage.delete(asset.storageKey).catch(() => undefined);
    await this.audit.record({ actorId: userId, organizationId, action: 'event.page_asset_removed', resourceType: 'event', resourceId: eventId, metadata: { kind } });
    return this.pageAppearance(userId, organizationId, eventId);
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
