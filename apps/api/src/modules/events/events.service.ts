import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventPublicationStatus, EventRegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { TiersService } from '../tiers/tiers.service';
import { CreateEventDto, EventStateDto } from './dto/event.dto';
import { assertEventDates, canTransitionPublication } from './domain/event-rules';

@Injectable()
export class EventsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(OrganizationAccessService) private access: OrganizationAccessService, @Inject(TiersService) private tiers: TiersService, @Inject(AuditService) private audit: AuditService) {}
  async create(userId: string, organizationId: string, dto: CreateEventDto) {
    await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN','EVENT_MANAGER']);
    const limits = await this.tiers.limitsFor(userId, organizationId);
    const active = await this.prisma.event.count({ where: { organizationId, publicationStatus: { in: ['DRAFT','PUBLISHED','UNPUBLISHED'] } } });
    if (active >= limits.maxActiveEvents) throw new ConflictException('Aktif etkinlik tier limiti doldu.');
    if (dto.capacity > limits.maxParticipantsPerEvent) throw new BadRequestException('Katılımcı kapasitesi tier limitini aşıyor.');
    const startsAt = new Date(dto.startsAt), endsAt = new Date(dto.endsAt), opensAt = dto.registrationOpensAt ? new Date(dto.registrationOpensAt) : undefined, closesAt = dto.registrationClosesAt ? new Date(dto.registrationClosesAt) : undefined;
    assertEventDates(startsAt, endsAt, opensAt, closesAt);
    if (dto.formId && !await this.prisma.form.findFirst({ where: { id: dto.formId, organizationId } })) throw new BadRequestException('Kayıt formu bu kuruma ait değil.');
    const membership = await this.prisma.organizationMembership.findUniqueOrThrow({ where: { userId_organizationId: { userId, organizationId } } });
    const event = await this.prisma.event.create({ data: { organizationId, formId: dto.formId, title: dto.title.trim(), slug: dto.slug.toLowerCase(), summary: dto.summary, description: dto.description, venueName: dto.venueName, venueAddress: dto.venueAddress, startsAt, endsAt, timezone: dto.timezone, capacity: dto.capacity, visibility: dto.visibility, registrationMode: dto.registrationMode, registrationOpensAt: opensAt, registrationClosesAt: closesAt, staffAssignments: { create: { membershipId: membership.id } }, faqs: { create: dto.faqs?.map((f, i) => ({ ...f, sortOrder: i })) ?? [] } }, include: { faqs: true } });
    await this.audit.record({ actorId: userId, organizationId, action: 'event.created', resourceType: 'event', resourceId: event.id }); return event;
  }
  async list(userId: string, organizationId: string) { await this.access.requireMembership(userId, organizationId); return this.prisma.event.findMany({ where: { organizationId }, include: { faqs: true, _count: { select: { registrations: true } } }, orderBy: { startsAt: 'desc' } }); }
  async setState(userId: string, organizationId: string, eventId: string, dto: EventStateDto) {
    await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN','EVENT_MANAGER']);
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizationId } }); if (!event) throw new NotFoundException('Etkinlik bulunamadı.');
    if (!Object.values(EventPublicationStatus).includes(dto.publicationStatus as EventPublicationStatus) || !canTransitionPublication(event.publicationStatus, dto.publicationStatus)) throw new BadRequestException('Geçersiz yayın durumu geçişi.');
    const updated = await this.prisma.event.update({ where: { id: eventId }, data: { publicationStatus: dto.publicationStatus as EventPublicationStatus, registrationStatus: dto.registrationStatus } });
    await this.audit.record({ actorId: userId, organizationId, action: 'event.state_changed', resourceType: 'event', resourceId: eventId, metadata: { from: event.publicationStatus, to: updated.publicationStatus } }); return updated;
  }
  async publicGet(orgSlug: string, eventSlug: string) { const event = await this.prisma.event.findFirst({ where: { slug: eventSlug, organization: { slug: orgSlug }, publicationStatus: 'PUBLISHED', visibility: { not: 'INVITE_ONLY' } }, include: { organization: { select: { name: true, slug: true } }, faqs: { orderBy: { sortOrder: 'asc' } } } }); if (!event) throw new NotFoundException('Etkinlik bulunamadı.'); return event; }
  async setPhase(userId:string,organizationId:string,eventId:string,phase:'PRE_EVENT'|'LIVE'|'POST_EVENT'|'ARCHIVED'){await this.access.requireMembership(userId,organizationId,['ORGANIZATION_ADMIN','EVENT_MANAGER']);const event=await this.prisma.event.findFirst({where:{id:eventId,organizationId}});if(!event)throw new NotFoundException('Etkinlik bulunamadı.');const allowed:Record<string,string[]>={PRE_EVENT:['LIVE','ARCHIVED'],LIVE:['POST_EVENT','ARCHIVED'],POST_EVENT:['ARCHIVED'],ARCHIVED:[]};if(!allowed[event.phase].includes(phase))throw new BadRequestException('Geçersiz etkinlik fazı geçişi.');const updated=await this.prisma.event.update({where:{id:eventId},data:{phase}});await this.audit.record({actorId:userId,organizationId,action:'event.phase_changed',resourceType:'event',resourceId:eventId,metadata:{from:event.phase,to:phase}});return updated}
}
