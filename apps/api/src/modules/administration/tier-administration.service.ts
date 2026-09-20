import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../shared/persistence/prisma.service';

export type TierInput = {
  key: string; name: string; maxActiveEvents: number; maxParticipantsPerEvent: number;
  photoStorageLimitBytes: string; fileStorageLimitBytes: string; maxPhotosPerEvent: number;
  defaultMaxPhotosPerParticipant: number; emailMultiplier: number; allowedFileTypes: string[];
  featureFlags: Record<string, boolean>;
};

@Injectable()
export class TierAdministrationService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(AuditService) private audit: AuditService) {}
  async create(adminId: string, input: TierInput) {
    const tier = await this.prisma.tier.create({ data: this.data(input) });
    await this.audit.record({ actorId: adminId, action: 'admin.tier_created', resourceType: 'tier', resourceId: tier.id, metadata: { key: tier.key } });
    return tier;
  }
  async update(adminId: string, tierId: string, input: TierInput) {
    const existing = await this.prisma.tier.findUnique({ where: { id: tierId } });
    if (!existing) throw new NotFoundException('Tier bulunamadı.');
    const tier = await this.prisma.tier.update({ where: { id: tierId }, data: this.data(input) });
    await this.audit.record({ actorId: adminId, action: 'admin.tier_updated', resourceType: 'tier', resourceId: tier.id, metadata: { previousKey: existing.key, key: tier.key } });
    return tier;
  }
  async remove(adminId: string, tierId: string) {
    const tier = await this.prisma.tier.findUnique({ where: { id: tierId }, select: { id: true, key: true, _count: { select: { organizations: true } } } });
    if (!tier) throw new NotFoundException('Tier bulunamadı.');
    if (tier._count.organizations) throw new ConflictException('Bu tier kurumlara atanmış. Önce kurumları başka bir tier’a taşıyın.');
    await this.prisma.tier.delete({ where: { id: tierId } });
    await this.audit.record({ actorId: adminId, action: 'admin.tier_deleted', resourceType: 'tier', resourceId: tierId, metadata: { key: tier.key } });
    return { deleted: true };
  }
  async override(adminId: string, organizationId: string, d: { limits: object; reason: string; expiresAt?: string }) {
    const value = await this.prisma.organizationTierOverride.upsert({ where: { organizationId }, create: { organizationId, limits: d.limits as Prisma.InputJsonValue, reason: d.reason, expiresAt: d.expiresAt ? new Date(d.expiresAt) : null }, update: { limits: d.limits as Prisma.InputJsonValue, reason: d.reason, expiresAt: d.expiresAt ? new Date(d.expiresAt) : null } });
    await this.audit.record({ actorId: adminId, organizationId, action: 'admin.tier_override_changed', resourceType: 'tier_override', resourceId: value.id, metadata: { reason: d.reason } });
    return value;
  }
  private data(input: TierInput) {
    return { ...input, key: input.key.trim().toLowerCase(), name: input.name.trim(), photoStorageLimitBytes: BigInt(input.photoStorageLimitBytes), fileStorageLimitBytes: BigInt(input.fileStorageLimitBytes), allowedFileTypes: [...new Set(input.allowedFileTypes.map(type => type.trim().toUpperCase()).filter(Boolean))], featureFlags: input.featureFlags as Prisma.InputJsonValue };
  }
}
