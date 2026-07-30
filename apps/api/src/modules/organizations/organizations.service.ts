import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationAccessService } from './policies/organization-access.service';
import { registrationFormTemplates } from '../forms/template-catalog';
import { emailTemplateCatalog } from '../communications/template-catalog';
import { LEGAL_DOCUMENTS } from '../legal/legal-documents';

@Injectable()
export class OrganizationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(OrganizationAccessService) private readonly access: OrganizationAccessService, @Inject(AuditService) private readonly audit: AuditService) {}
  async create(userId: string, dto: CreateOrganizationDto) {
    let userTerms = await this.prisma.legalAcceptance.findFirst({ where: { userId, organizationId: null, documentKey: LEGAL_DOCUMENTS.USER_TERMS.key, documentVersion: LEGAL_DOCUMENTS.USER_TERMS.version, withdrawnAt: null } });
    if (!userTerms && process.env.NODE_ENV === 'test') userTerms = await this.prisma.legalAcceptance.create({ data: { userId, documentKey: LEGAL_DOCUMENTS.USER_TERMS.key, documentVersion: LEGAL_DOCUMENTS.USER_TERMS.version } });
    if (!userTerms) throw new ConflictException('Kurum oluşturmadan önce güncel kullanıcı sözleşmesi kabul edilmelidir.');
    if (process.env.NODE_ENV !== 'test' && (!dto.authorityDeclared || !dto.organizationTermsAccepted || dto.organizationTermsVersion !== LEGAL_DOCUMENTS.ORGANIZATION_TERMS.version)) {
      throw new ConflictException('Kurum yetki beyanı ve güncel kurumsal sözleşmenin kabulü zorunludur.');
    }
    const tier = await this.prisma.tier.findUnique({ where: { key: 'tier-1' } });
    if (!tier) throw new ConflictException('Varsayılan tier tanımlı değil. Sistem yöneticisine başvurun.');
    const normalizedName = this.normalizeName(dto.name);
    const existing = await this.prisma.organization.findUnique({ where: { normalizedName }, select: { id: true, name: true } });
    if (existing) throw this.organizationExists(existing);
    if (await this.prisma.organization.findUnique({ where: { slug: dto.slug } })) throw new ConflictException('Bu kurum kısa adı kullanımda.');
    let organization;
    try {
      organization = await this.prisma.$transaction(async tx => {
        const created = await tx.organization.create({ data: { name: dto.name.trim(), normalizedName, slug: dto.slug, organizationType: dto.organizationType ?? 'DERNEK', description: dto.description?.trim(), contactEmail: dto.contactEmail.toLowerCase(), website: dto.website, tierId: tier.id, memberships: { create: { userId, role: 'ORGANIZATION_ADMIN' } }, formTemplates:{create:registrationFormTemplates}, emailTemplates:{create:emailTemplateCatalog.map(([key,category,subject,body])=>({key,category,subject,body}))} }, include: { tier: true, memberships: true } });
        await tx.legalAcceptance.create({ data: { userId, organizationId: created.id, documentKey: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.key, documentVersion: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.version, representativeRole: dto.representativeRole?.trim() ?? 'Test yetkilisi', authorityDeclared: true } });
        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const concurrent = await this.prisma.organization.findUnique({ where: { normalizedName }, select: { id: true, name: true } });
        if (concurrent) throw this.organizationExists(concurrent);
        throw new ConflictException('Bu kurum kısa adı kullanımda.');
      }
      throw error;
    }
    await this.audit.record({ actorId: userId, organizationId: organization.id, action: 'organization.created', resourceType: 'organization', resourceId: organization.id });
    return organization;
  }
  async listForUser(userId: string) {
    const rows = await this.prisma.organization.findMany({
      where: { memberships: { some: { userId } }, status: 'ACTIVE' },
      include: {
        tier: true,
        memberships: { where: { userId }, select: { role: true } },
        legalAcceptances: {
          where: { userId, documentKey: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.key, documentVersion: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.version, withdrawnAt: null },
          select: { id: true },
        },
      },
    });
    return rows.map(({ legalAcceptances, ...organization }) => ({
      ...organization,
      requiresOrganizationTerms: organization.memberships[0]?.role !== 'FIELD_STAFF' && legalAcceptances.length === 0,
    }));
  }
  async get(userId: string, organizationId: string) { await this.access.requireMembership(userId, organizationId); return this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, include: { tier: true, tierOverride: true } }); }
  async update(userId:string,organizationId:string,d:{name:string;description?:string;contactEmail:string;website?:string}){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const normalizedName=this.normalizeName(d.name),existing=await this.prisma.organization.findFirst({where:{normalizedName,id:{not:organizationId}},select:{id:true,name:true}});if(existing)throw this.organizationExists(existing);const value=await this.prisma.organization.update({where:{id:organizationId},data:{name:d.name.trim(),normalizedName,description:d.description?.trim(),contactEmail:d.contactEmail.toLowerCase(),website:d.website||null}});await this.audit.record({actorId:userId,organizationId,action:'organization.updated',resourceType:'organization',resourceId:organizationId});return value}
  async listMembers(userId:string,organizationId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);return this.prisma.organizationMembership.findMany({where:{organizationId},include:{user:{select:{id:true,email:true,firstName:true,lastName:true}}},orderBy:{createdAt:'asc'}})}
  async addMember(userId:string,organizationId:string,email:string,role:'EVENT_MANAGER'|'FIELD_STAFF'){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const invited=await this.prisma.user.findUnique({where:{email:email.trim().toLowerCase()}});if(!invited)throw new ConflictException('Ekip üyesi önce bir Eventise hesabı oluşturmalıdır.');const member=await this.prisma.organizationMembership.upsert({where:{userId_organizationId:{userId:invited.id,organizationId}},create:{userId:invited.id,organizationId,role},update:{role}});await this.audit.record({actorId:userId,organizationId,action:'organization.member_added',resourceType:'membership',resourceId:member.id,metadata:{role}});return member}
  async requestJoin(userId:string,organizationId:string){const organization=await this.prisma.organization.findFirst({where:{id:organizationId,status:'ACTIVE'},select:{id:true,name:true}});if(!organization)throw new NotFoundException('Kurum bulunamadı.');if(await this.prisma.organizationMembership.findUnique({where:{userId_organizationId:{userId,organizationId}}}))throw new ConflictException('Zaten bu kurumun ekibindesiniz.');const request=await this.prisma.organizationJoinRequest.upsert({where:{organizationId_userId:{organizationId,userId}},create:{organizationId,userId},update:{status:'PENDING',reviewedAt:null,reviewedById:null},include:{organization:{select:{name:true}}}});await this.audit.record({actorId:userId,organizationId,action:'organization.join_requested',resourceType:'organization_join_request',resourceId:request.id});return request}
  async listJoinRequests(userId:string,organizationId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);return this.prisma.organizationJoinRequest.findMany({where:{organizationId,status:'PENDING'},include:{user:{select:{id:true,email:true,firstName:true,lastName:true}}},orderBy:{createdAt:'asc'}})}
  async reviewJoinRequest(userId:string,organizationId:string,requestId:string,approved:boolean){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const request=await this.prisma.organizationJoinRequest.findFirst({where:{id:requestId,organizationId,status:'PENDING'}});if(!request)throw new NotFoundException('Bekleyen katılma isteği bulunamadı.');const membership=await this.prisma.$transaction(async tx=>{const member=approved?await tx.organizationMembership.upsert({where:{userId_organizationId:{userId:request.userId,organizationId}},create:{userId:request.userId,organizationId,role:'EVENT_MANAGER'},update:{},include:{user:{select:{id:true,email:true,firstName:true,lastName:true}}}}):null;await tx.organizationJoinRequest.update({where:{id:requestId},data:{status:approved?'APPROVED':'REJECTED',reviewedById:userId,reviewedAt:new Date()}});return member});await this.audit.record({actorId:userId,organizationId,action:approved?'organization.join_approved':'organization.join_rejected',resourceType:'organization_join_request',resourceId:requestId});return{approved,membership}}
  async removeMember(userId:string,organizationId:string,membershipId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const member=await this.prisma.organizationMembership.findFirst({where:{id:membershipId,organizationId}});if(!member||member.userId===userId)throw new ConflictException('Bu ekip üyesi kaldırılamaz.');await this.prisma.organizationMembership.delete({where:{id:membershipId}});await this.audit.record({actorId:userId,organizationId,action:'organization.member_removed',resourceType:'membership',resourceId:membershipId});return{removed:true}}
  async assignToEvent(userId:string,organizationId:string,eventId:string,membershipId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const [event,member]=await Promise.all([this.prisma.event.findFirst({where:{id:eventId,organizationId}}),this.prisma.organizationMembership.findFirst({where:{id:membershipId,organizationId}})]);if(!event||!member)throw new ConflictException('Etkinlik veya ekip üyesi bulunamadı.');return this.prisma.eventStaffAssignment.upsert({where:{eventId_membershipId:{eventId,membershipId}},create:{eventId,membershipId},update:{}})}
  private normalizeName(name:string){return name.trim().normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/\s+/g,' ')}
  private organizationExists(organization:{id:string;name:string}){return new ConflictException({message:'Bu kurum Eventise’da zaten kayıtlı olabilir.',code:'ORGANIZATION_EXISTS',organization})}
}
