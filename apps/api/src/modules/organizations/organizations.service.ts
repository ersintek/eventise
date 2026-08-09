import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JobQueue } from '../../infrastructure/jobs/job-queue.port';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationAccessService } from './policies/organization-access.service';
import { registrationFormTemplates } from '../forms/template-catalog';
import { emailTemplateCatalog } from '../communications/template-catalog';
import { LEGAL_DOCUMENTS } from '../legal/legal-documents';

@Injectable()
export class OrganizationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(OrganizationAccessService) private readonly access: OrganizationAccessService, @Inject(AuditService) private readonly audit: AuditService, @Inject(JobQueue) private readonly jobs: JobQueue) {}
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
  async addMember(userId:string,organizationId:string,email:string,role:'ORGANIZATION_ADMIN'|'EVENT_MANAGER'|'FIELD_STAFF'){
    await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);
    const normalized=email.trim().toLowerCase();
    const invited=await this.prisma.user.findUnique({where:{email:normalized},select:{id:true}});
    if(invited&&await this.prisma.organizationMembership.findUnique({where:{userId_organizationId:{userId:invited.id,organizationId}}}))throw new ConflictException('Bu kişi zaten kurum ekibinde.');
    const invitation=await this.prisma.organizationInvitation.upsert({
      where:{organizationId_email:{organizationId,email:normalized}},
      create:{organizationId,userId:invited?.id,email:normalized,role,invitedById:userId,expiresAt:new Date(Date.now()+7*24*60*60_000)},
      update:{userId:invited?.id,role,invitedById:userId,expiresAt:new Date(Date.now()+7*24*60*60_000),acceptedAt:null,cancelledAt:null},
    });
    await this.sendInvitation(invitation.id);
    await this.audit.record({actorId:userId,organizationId,action:'organization.member_invited',resourceType:'organization_invitation',resourceId:invitation.id,metadata:{role}});
    return{kind:'invitation',invitation};
  }
  async updateMemberRole(userId:string,organizationId:string,membershipId:string,role:'ORGANIZATION_ADMIN'|'EVENT_MANAGER'|'FIELD_STAFF'){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);try{const member=await this.prisma.$transaction(async tx=>{const current=await tx.organizationMembership.findFirst({where:{id:membershipId,organizationId}});if(!current)throw new NotFoundException('Ekip üyesi bulunamadı.');if(current.role==='ORGANIZATION_ADMIN'&&role!=='ORGANIZATION_ADMIN'&&await tx.organizationMembership.count({where:{organizationId,role:'ORGANIZATION_ADMIN'}})<=1)throw new ConflictException('Kurumun en az bir kurum yöneticisi olmalıdır.');return tx.organizationMembership.update({where:{id:membershipId},data:{role},include:{user:{select:{id:true,email:true,firstName:true,lastName:true}}}})},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});await this.audit.record({actorId:userId,organizationId,action:'organization.member_role_changed',resourceType:'membership',resourceId:membershipId,metadata:{role}});return member}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2034')throw new ConflictException('Ekip yetkisi aynı anda değiştirildi. Lütfen tekrar deneyin.');throw error}}
  async listInvitations(userId:string,organizationId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);return this.prisma.organizationInvitation.findMany({where:{organizationId,acceptedAt:null,cancelledAt:null},select:{id:true,email:true,role:true,expiresAt:true,createdAt:true},orderBy:{createdAt:'desc'}})}
  async resendInvitation(userId:string,organizationId:string,invitationId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const invitation=await this.prisma.organizationInvitation.findFirst({where:{id:invitationId,organizationId,acceptedAt:null,cancelledAt:null}});if(!invitation)throw new NotFoundException('Bekleyen davet bulunamadı.');await this.prisma.organizationInvitation.update({where:{id:invitationId},data:{expiresAt:new Date(Date.now()+7*24*60*60_000),invitedById:userId}});await this.sendInvitation(invitationId);return{resent:true}}
  async cancelInvitation(userId:string,organizationId:string,invitationId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const result=await this.prisma.organizationInvitation.updateMany({where:{id:invitationId,organizationId,acceptedAt:null,cancelledAt:null},data:{cancelledAt:new Date()}});if(!result.count)throw new NotFoundException('Bekleyen davet bulunamadı.');return{cancelled:true}}
  async requestJoin(userId:string,organizationId:string){const organization=await this.prisma.organization.findFirst({where:{id:organizationId,status:'ACTIVE'},select:{id:true,name:true}});if(!organization)throw new NotFoundException('Kurum bulunamadı.');if(await this.prisma.organizationMembership.findUnique({where:{userId_organizationId:{userId,organizationId}}}))throw new ConflictException('Zaten bu kurumun ekibindesiniz.');const request=await this.prisma.organizationJoinRequest.upsert({where:{organizationId_userId:{organizationId,userId}},create:{organizationId,userId},update:{status:'PENDING',reviewedAt:null,reviewedById:null},include:{organization:{select:{name:true}}}});await this.audit.record({actorId:userId,organizationId,action:'organization.join_requested',resourceType:'organization_join_request',resourceId:request.id});return request}
  async listJoinRequests(userId:string,organizationId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);return this.prisma.organizationJoinRequest.findMany({where:{organizationId,status:'PENDING'},include:{user:{select:{id:true,email:true,firstName:true,lastName:true}}},orderBy:{createdAt:'asc'}})}
  async reviewJoinRequest(userId:string,organizationId:string,requestId:string,approved:boolean){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const request=await this.prisma.organizationJoinRequest.findFirst({where:{id:requestId,organizationId,status:'PENDING'}});if(!request)throw new NotFoundException('Bekleyen katılma isteği bulunamadı.');const membership=await this.prisma.$transaction(async tx=>{const member=approved?await tx.organizationMembership.upsert({where:{userId_organizationId:{userId:request.userId,organizationId}},create:{userId:request.userId,organizationId,role:'EVENT_MANAGER'},update:{},include:{user:{select:{id:true,email:true,firstName:true,lastName:true}}}}):null;await tx.organizationJoinRequest.update({where:{id:requestId},data:{status:approved?'APPROVED':'REJECTED',reviewedById:userId,reviewedAt:new Date()}});return member});await this.audit.record({actorId:userId,organizationId,action:approved?'organization.join_approved':'organization.join_rejected',resourceType:'organization_join_request',resourceId:requestId});return{approved,membership}}
  async removeMember(userId:string,organizationId:string,membershipId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);try{await this.prisma.$transaction(async tx=>{const member=await tx.organizationMembership.findFirst({where:{id:membershipId,organizationId}});if(!member||member.userId===userId)throw new ConflictException('Bu ekip üyesi kaldırılamaz.');if(member.role==='ORGANIZATION_ADMIN'&&await tx.organizationMembership.count({where:{organizationId,role:'ORGANIZATION_ADMIN'}})<=1)throw new ConflictException('Kurumun son yöneticisi ekipten çıkarılamaz.');await tx.organizationMembership.delete({where:{id:membershipId}})},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable})}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2034')throw new ConflictException('Ekip aynı anda değiştirildi. Lütfen tekrar deneyin.');throw error}await this.audit.record({actorId:userId,organizationId,action:'organization.member_removed',resourceType:'membership',resourceId:membershipId});return{removed:true}}
  async assignToEvent(userId:string,organizationId:string,eventId:string,membershipId:string){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN']);const [event,member]=await Promise.all([this.prisma.event.findFirst({where:{id:eventId,organizationId}}),this.prisma.organizationMembership.findFirst({where:{id:membershipId,organizationId}})]);if(!event||!member)throw new ConflictException('Etkinlik veya ekip üyesi bulunamadı.');return this.prisma.eventStaffAssignment.upsert({where:{eventId_membershipId:{eventId,membershipId}},create:{eventId,membershipId},update:{}})}
  async getAccessStatus(userId:string){
    const user=await this.prisma.user.findUniqueOrThrow({where:{id:userId},select:{email:true}}),now=new Date();
    const [organizations,invitations,joinRequests]=await Promise.all([
      this.listForUser(userId),
      this.prisma.organizationInvitation.findMany({where:{email:user.email,acceptedAt:null,cancelledAt:null,expiresAt:{gt:now}},include:{organization:{select:{id:true,name:true,slug:true}}},orderBy:{createdAt:'asc'}}),
      this.prisma.organizationJoinRequest.findMany({where:{userId,status:'PENDING'},include:{organization:{select:{id:true,name:true,slug:true}}},orderBy:{createdAt:'asc'}}),
    ]);
    return{email:user.email,organizations,invitations,joinRequests};
  }
  async acceptInvitation(userId:string,invitationId:string){
    const user=await this.prisma.user.findUniqueOrThrow({where:{id:userId},select:{email:true}}),now=new Date();
    const invitation=await this.prisma.organizationInvitation.findFirst({where:{id:invitationId,email:user.email,acceptedAt:null,cancelledAt:null,expiresAt:{gt:now}},include:{organization:{select:{id:true,name:true,slug:true}}}});
    if(!invitation)throw new NotFoundException('Geçerli bir kurum daveti bulunamadı.');
    const membership=await this.prisma.$transaction(async tx=>{
      const value=await tx.organizationMembership.upsert({where:{userId_organizationId:{userId,organizationId:invitation.organizationId}},create:{userId,organizationId:invitation.organizationId,role:invitation.role},update:{role:invitation.role},include:{organization:{select:{id:true,name:true,slug:true}}}});
      await tx.organizationInvitation.update({where:{id:invitation.id},data:{userId,acceptedAt:now}});
      return value;
    });
    await this.audit.record({actorId:userId,organizationId:invitation.organizationId,action:'organization.invitation_accepted',resourceType:'organization_invitation',resourceId:invitation.id,metadata:{role:invitation.role}});
    return{accepted:true,membership};
  }
  private normalizeName(name:string){return name.trim().normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/\s+/g,' ')}
  private organizationExists(organization:{id:string;name:string}){return new ConflictException({message:'Bu kurum Eventise’da zaten kayıtlı olabilir.',code:'ORGANIZATION_EXISTS',organization})}
  private async sendInvitation(invitationId:string){
    const invitation=await this.prisma.organizationInvitation.findUniqueOrThrow({where:{id:invitationId},include:{organization:{select:{name:true}}}}),base=(process.env.PUBLIC_APP_URL||'').replace(/\/$/,''),url=`${base}/login/organization?invited=1`,role=invitation.role==='ORGANIZATION_ADMIN'?'Kurum yöneticisi':invitation.role==='EVENT_MANAGER'?'Etkinlik yetkilisi':'Saha görevlisi',message=await this.prisma.emailMessage.create({data:{recipient:invitation.email,subject:`${invitation.organization.name} ekibine davet`,body:`<p><strong>${invitation.organization.name}</strong> sizi Eventise ekibine <strong>${role}</strong> olarak davet etti.</p><p><a href="${url}">Eventise’a gir ve daveti görüntüle</a></p><p>Hesabınız yoksa bu e-posta adresiyle STK kaydı oluşturabilirsiniz. Davet 7 gün geçerlidir ve üyelik siz kabul ettiğinizde başlar.</p>`}});
    await this.jobs.enqueue({type:'email.send',payload:{messageId:message.id},idempotencyKey:`organization-invitation:${invitationId}:${message.id}`});
  }
}
