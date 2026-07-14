import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { resolveTierLimits, TierLimitOverrides, TierLimits } from './domain/tier-limits';

@Injectable()
export class TiersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(OrganizationAccessService) private readonly access: OrganizationAccessService) {}
  async limitsFor(userId: string, organizationId: string): Promise<TierLimits> {
    await this.access.requireMembership(userId, organizationId);
    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, include: { tier: true, tierOverride: true } });
    const tier: TierLimits = { maxActiveEvents: organization.tier.maxActiveEvents, maxParticipantsPerEvent: organization.tier.maxParticipantsPerEvent, photoStorageLimitBytes: organization.tier.photoStorageLimitBytes, fileStorageLimitBytes: organization.tier.fileStorageLimitBytes, maxPhotosPerEvent: organization.tier.maxPhotosPerEvent, defaultMaxPhotosPerParticipant: organization.tier.defaultMaxPhotosPerParticipant, emailMultiplier: organization.tier.emailMultiplier, allowedFileTypes: organization.tier.allowedFileTypes, featureFlags: organization.tier.featureFlags as Record<string, boolean> };
    const validOverride = organization.tierOverride && (!organization.tierOverride.expiresAt || organization.tierOverride.expiresAt > new Date()) ? organization.tierOverride.limits as TierLimitOverrides : null;
    return resolveTierLimits(tier, validOverride);
  }
}
