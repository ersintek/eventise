import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationAccessService } from './policies/organization-access.service';
import { registrationFormTemplates } from '../forms/template-catalog';
import { emailTemplateCatalog } from '../communications/template-catalog';

@Injectable()
export class OrganizationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(OrganizationAccessService) private readonly access: OrganizationAccessService, @Inject(AuditService) private readonly audit: AuditService) {}
  async create(userId: string, dto: CreateOrganizationDto) {
    const tier = await this.prisma.tier.findUnique({ where: { key: 'tier-1' } });
    if (!tier) throw new ConflictException('Varsayılan tier tanımlı değil. Sistem yöneticisine başvurun.');
    if (await this.prisma.organization.findUnique({ where: { slug: dto.slug } })) throw new ConflictException('Bu kurum kısa adı kullanımda.');
    const organization = await this.prisma.organization.create({ data: { name: dto.name.trim(), slug: dto.slug, description: dto.description?.trim(), contactEmail: dto.contactEmail.toLowerCase(), website: dto.website, tierId: tier.id, memberships: { create: { userId, role: 'ORGANIZATION_ADMIN' } }, formTemplates:{create:registrationFormTemplates}, emailTemplates:{create:emailTemplateCatalog.map(([key,subject,body])=>({key,subject,body}))} }, include: { tier: true, memberships: true } });
    await this.audit.record({ actorId: userId, organizationId: organization.id, action: 'organization.created', resourceType: 'organization', resourceId: organization.id });
    return organization;
  }
  listForUser(userId: string) { return this.prisma.organization.findMany({ where: { memberships: { some: { userId } }, status: 'ACTIVE' }, include: { tier: true, memberships: { where: { userId }, select: { role: true } } } }); }
  async get(userId: string, organizationId: string) { await this.access.requireMembership(userId, organizationId); return this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, include: { tier: true, tierOverride: true } }); }
}
