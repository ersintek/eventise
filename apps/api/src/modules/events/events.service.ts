import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventPublicationStatus, EventRegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { TiersService } from '../tiers/tiers.service';
import { StorageProvider } from '../../infrastructure/storage/storage-provider.port';
import { CreateEventDto, EventStateDto, UpdateEventDto } from './dto/event.dto';
import { assertEventDates, canTransitionPublication } from './domain/event-rules';

@Injectable()
export class EventsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(OrganizationAccessService) private access: OrganizationAccessService, @Inject(TiersService) private tiers: TiersService, @Inject(AuditService) private audit: AuditService, @Inject(StorageProvider) private storage: StorageProvider) {}
  async create(userId: string, organizationId: string, dto: CreateEventDto) {
    await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN','EVENT_MANAGER']);
    const limits = await this.tiers.limitsFor(userId, organizationId);
    const active = await this.prisma.event.count({ where: { organizationId, publicationStatus: { in: ['DRAFT','PUBLISHED','UNPUBLISHED'] } } });
    if (active >= limits.maxActiveEvents) throw new ConflictException('Aktif etkinlik tier limiti doldu.');
    if (dto.capacity > limits.maxParticipantsPerEvent) throw new BadRequestException('Katılımcı kapasitesi tier limitini aşıyor.');
    const startsAt = new Date(dto.startsAt), endsAt = new Date(dto.endsAt), opensAt = dto.registrationOpensAt ? new Date(dto.registrationOpensAt) : undefined, closesAt = dto.registrationClosesAt ? new Date(dto.registrationClosesAt) : undefined;
    assertEventDates(startsAt, endsAt, opensAt, closesAt);
    const slug = dto.slug.trim().toLowerCase();
    if (await this.prisma.event.findUnique({ where: { organizationId_slug: { organizationId, slug } } })) throw new ConflictException('Bu etkinlik bağlantı kısa adı kullanımda.');
    if (dto.formId && !await this.prisma.form.findFirst({ where: { id: dto.formId, organizationId } })) throw new BadRequestException('Kayıt formu bu kuruma ait değil.');
    const membership = await this.prisma.organizationMembership.findUniqueOrThrow({ where: { userId_organizationId: { userId, organizationId } } });
    const event = await this.prisma.$transaction(async tx => {
      let formId = dto.formId;
      if (!formId) {
        const form = await tx.form.create({ data: { organizationId, name: `${dto.title.trim()} kayıt formu`, versions: { create: { version: 1, schema: { fields: [] }, publishedAt: new Date() } } } });
        formId = form.id;
      }
      return tx.event.create({ data: { organizationId, formId, title: dto.title.trim(), slug, summary: dto.summary?.trim(), description: dto.description?.trim(), venueName: dto.venueName?.trim(), venueAddress: dto.venueAddress?.trim(), format: dto.format, onlineLink: dto.onlineLink?.trim(), startsAt, endsAt, timezone: dto.timezone, capacity: dto.capacity, visibility: dto.visibility, registrationMode: dto.registrationMode, registrationOpensAt: opensAt, registrationClosesAt: closesAt, staffAssignments: { create: { membershipId: membership.id } }, faqs: { create: dto.faqs?.map((f, i) => ({ ...f, sortOrder: i })) ?? [] } }, include: { faqs: true } });
    });
    await this.audit.record({ actorId: userId, organizationId, action: 'event.created', resourceType: 'event', resourceId: event.id }); return event;
  }
  async list(userId: string, organizationId: string) {
    const membership = await this.access.requireMembership(userId, organizationId);
    const events = await this.prisma.event.findMany({
      where: { organizationId, ...(membership.role === 'ORGANIZATION_ADMIN' ? {} : { staffAssignments: { some: { membershipId: membership.id } } }) },
      include: {
        faqs: true,
        form: { include: { versions: { where: { publishedAt: { not: null } }, orderBy: { version: 'desc' }, take: 1, select: { id: true, version: true, schema: true } } } },
        registrations: { select: { applicationStatus: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startsAt: 'desc' },
    });
    return events.map(({ registrations, ...event }) => ({
      ...event,
      registrationSummary: {
        total: registrations.length,
        pending: registrations.filter(item => item.applicationStatus === 'SUBMITTED' || item.applicationStatus === 'PENDING').length,
        accepted: registrations.filter(item => item.applicationStatus === 'ACCEPTED').length,
        waitlisted: registrations.filter(item => item.applicationStatus === 'WAITLISTED').length,
        rejected: registrations.filter(item => item.applicationStatus === 'REJECTED').length,
      },
    }));
  }
  async update(userId:string,organizationId:string,eventId:string,dto:UpdateEventDto){
    await this.access.requireEventAccess(userId,organizationId,eventId,['ORGANIZATION_ADMIN','EVENT_MANAGER']);
    const event=await this.prisma.event.findFirst({where:{id:eventId,organizationId}});if(!event)throw new NotFoundException('Etkinlik bulunamadı.');
    const startsAt=new Date(dto.startsAt),endsAt=new Date(dto.endsAt);assertEventDates(startsAt,endsAt);
    const limits=await this.tiers.limitsFor(userId,organizationId);if(dto.capacity>limits.maxParticipantsPerEvent)throw new BadRequestException('Katılımcı kapasitesi tier limitini aşıyor.');
    if(dto.formId&&!await this.prisma.form.findFirst({where:{id:dto.formId,organizationId}}))throw new BadRequestException('Kayıt formu bu kuruma ait değil.');
    const updated=await this.prisma.$transaction(async tx=>{if(dto.faqs!==undefined)await tx.eventFaqItem.deleteMany({where:{eventId}});return tx.event.update({where:{id:eventId},data:{title:dto.title.trim(),summary:dto.summary,description:dto.description,venueName:dto.venueName,venueAddress:dto.venueAddress,format:dto.format,onlineLink:dto.onlineLink,startsAt,endsAt,capacity:dto.capacity,visibility:dto.visibility,registrationMode:dto.registrationMode,...(dto.formId!==undefined?{formId:dto.formId||null}:{}),...(dto.faqs!==undefined?{faqs:{create:dto.faqs.map((faq,index)=>({...faq,sortOrder:index}))}}:{})},include:{faqs:true,_count:{select:{registrations:true}}}})});
    await this.audit.record({actorId:userId,organizationId,action:'event.updated',resourceType:'event',resourceId:eventId});return updated;
  }
  async updateFaqs(userId:string,organizationId:string,eventId:string,faqs:Array<{question:string;answer:string}>){
    await this.access.requireEventAccess(userId,organizationId,eventId,['ORGANIZATION_ADMIN','EVENT_MANAGER']);
    if(!await this.prisma.event.findFirst({where:{id:eventId,organizationId},select:{id:true}}))throw new NotFoundException('Etkinlik bulunamadı.');
    const items=await this.prisma.$transaction(async tx=>{await tx.eventFaqItem.deleteMany({where:{eventId}});if(faqs.length)await tx.eventFaqItem.createMany({data:faqs.map((faq,index)=>({eventId,question:faq.question.trim(),answer:faq.answer.trim(),sortOrder:index}))});return tx.eventFaqItem.findMany({where:{eventId},orderBy:{sortOrder:'asc'}})});
    await this.audit.record({actorId:userId,organizationId,action:'event.faqs_updated',resourceType:'event',resourceId:eventId,metadata:{count:items.length}});return items;
  }
  async setState(userId: string, organizationId: string, eventId: string, dto: EventStateDto) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN','EVENT_MANAGER']);
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizationId } }); if (!event) throw new NotFoundException('Etkinlik bulunamadı.');
    if (!Object.values(EventPublicationStatus).includes(dto.publicationStatus as EventPublicationStatus) || !canTransitionPublication(event.publicationStatus, dto.publicationStatus)) throw new BadRequestException('Geçersiz yayın durumu geçişi.');
    const nextRegistration = dto.registrationStatus ?? event.registrationStatus;
    if (dto.publicationStatus !== 'PUBLISHED' && nextRegistration === 'OPEN') throw new BadRequestException('Kayıt formunu açmadan önce etkinliği yayınlayın.');
    const updated = await this.prisma.event.update({ where: { id: eventId }, data: { publicationStatus: dto.publicationStatus as EventPublicationStatus, registrationStatus: nextRegistration } });
    await this.audit.record({ actorId: userId, organizationId, action: 'event.state_changed', resourceType: 'event', resourceId: eventId, metadata: { from: event.publicationStatus, to: updated.publicationStatus } }); return updated;
  }
  async publicGet(orgSlug: string, eventSlug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug: eventSlug, organization: { slug: orgSlug }, publicationStatus: 'PUBLISHED', visibility: { not: 'INVITE_ONLY' } },
      include: {
        coverAsset: { select: { storageKey: true, status: true } },
        organization: { select: { name: true, slug: true, description: true, website: true, logoAsset: { select: { storageKey: true, status: true } } } },
        faqs: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı.');
    const [coverImageUrl, logoUrl] = await Promise.all([
      event.coverAsset?.status === 'ACTIVE' ? this.storage.createDownloadUrl(event.coverAsset.storageKey, 3600) : null,
      event.organization.logoAsset?.status === 'ACTIVE' ? this.storage.createDownloadUrl(event.organization.logoAsset.storageKey, 3600) : null,
    ]);
    const { coverAsset, organization, ...result } = event;
    const { logoAsset, ...publicOrganization } = organization;
    return { ...result, coverImageUrl, organization: { ...publicOrganization, logoUrl } };
  }
}
