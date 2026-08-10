import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';

const eventConsentInclude = {
  definition: { include: { versions: { orderBy: { version: 'desc' as const }, take: 1 } } },
};

@Injectable()
export class ConsentsService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(OrganizationAccessService) private access: OrganizationAccessService,
    @Inject(AuditService) private audit: AuditService,
  ) {}

  async create(userId: string, organizationId: string, key: string, title: string, text: string) {
    await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const definition = await this.prisma.consentDefinition.create({
      data: { organizationId, key, title, versions: { create: { version: 1, text } } },
      include: { versions: true },
    });
    await this.audit.record({ actorId: userId, organizationId, action: 'consent.created', resourceType: 'consent', resourceId: definition.id });
    return definition;
  }

  async addVersion(userId: string, organizationId: string, definitionId: string, text: string) {
    await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const definition = await this.prisma.consentDefinition.findFirst({
      where: { id: definitionId, organizationId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!definition) throw new NotFoundException('Onam tanımı bulunamadı.');
    return this.prisma.consentVersion.create({
      data: { definitionId, version: (definition.versions[0]?.version ?? 0) + 1, text },
    });
  }

  async saveForEvent(userId: string, organizationId: string, eventId: string, rawText: string) {
    await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const text = rawText.trim();
    if (text.length < 20) throw new BadRequestException('Onam metni en az 20 karakter olmalıdır.');

    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizationId }, select: { id: true } });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı.');

    const existing = await this.prisma.eventConsentRequirement.findUnique({
      where: { eventId },
      include: eventConsentInclude,
    });

    if (existing) {
      const current = existing.definition.versions[0];
      if (current?.text !== text) {
        await this.prisma.$transaction([
          this.prisma.consentDefinition.update({ where: { id: existing.definitionId }, data: { title: 'Etkinlik onamı' } }),
          this.prisma.consentVersion.create({
            data: { definitionId: existing.definitionId, version: (current?.version ?? 0) + 1, text },
          }),
          this.prisma.eventConsentRequirement.update({ where: { eventId }, data: { required: true } }),
        ]);
        await this.audit.record({ actorId: userId, organizationId, action: 'consent.updated', resourceType: 'consent', resourceId: existing.definitionId, metadata: { eventId } });
      } else if (!existing.required) {
        await this.prisma.eventConsentRequirement.update({ where: { eventId }, data: { required: true } });
      }
      return this.prisma.eventConsentRequirement.findUniqueOrThrow({ where: { eventId }, include: eventConsentInclude });
    }

    const definition = await this.prisma.consentDefinition.create({
      data: {
        organizationId,
        key: `event-${eventId}`,
        title: 'Etkinlik onamı',
        versions: { create: { version: 1, text } },
      },
    });
    await this.prisma.eventConsentRequirement.create({ data: { eventId, definitionId: definition.id, required: true } });
    await this.audit.record({ actorId: userId, organizationId, action: 'consent.created', resourceType: 'consent', resourceId: definition.id, metadata: { eventId } });
    return this.prisma.eventConsentRequirement.findUniqueOrThrow({ where: { eventId }, include: eventConsentInclude });
  }

  async requireForEvent(userId: string, organizationId: string, eventId: string, definitionId: string, required: boolean) {
    await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const [event, definition] = await Promise.all([
      this.prisma.event.findFirst({ where: { id: eventId, organizationId } }),
      this.prisma.consentDefinition.findFirst({ where: { id: definitionId, organizationId } }),
    ]);
    if (!event || !definition) throw new NotFoundException('Etkinlik veya onam bulunamadı.');
    return this.prisma.eventConsentRequirement.upsert({
      where: { eventId },
      create: { eventId, definitionId, required },
      update: { definitionId, required },
    });
  }

  async publicRequirements(eventId: string) {
    const consent = await this.prisma.eventConsentRequirement.findUnique({ where: { eventId }, include: eventConsentInclude });
    return consent ? [consent] : [];
  }

  async validateSelection(eventId: string, versionIds: string[]) {
    const requirements = await this.publicRequirements(eventId);
    const selected = new Set(versionIds);
    for (const requirement of requirements) {
      const current = requirement.definition.versions[0];
      if (requirement.required && (!current || !selected.has(current.id))) {
        throw new BadRequestException('Etkinlik onamını kabul etmelisiniz.');
      }
    }
    const valid = requirements.flatMap(requirement => requirement.definition.versions).filter(version => selected.has(version.id));
    if (valid.length !== selected.size) throw new BadRequestException('Geçersiz veya eski onam sürümü.');
    return valid.map(version => version.id);
  }

  async record(registrationId: string, versionIds: string[]) {
    if (versionIds.length) {
      await this.prisma.consentRecord.createMany({ data: versionIds.map(consentVersionId => ({ registrationId, consentVersionId })) });
    }
  }
}
