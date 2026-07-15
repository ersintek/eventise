import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { AuditService } from '../audit/audit.service';
import { EventsService } from './events.service';
@Injectable()
export class EventCopyService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(OrganizationAccessService) private access: OrganizationAccessService, @Inject(EventsService) private events: EventsService, @Inject(AuditService) private audit: AuditService) {}
  async history(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } }), now = new Date();
    const registrations = await this.prisma.eventRegistration.findMany({ where: { email: user.email, applicationStatus: 'ACCEPTED' }, select: { event: { select: { id: true, title: true, startsAt: true, endsAt: true, phase: true, organization: { select: { name: true } } } }, certificates: { where: { status: 'READY' }, select: { id: true, verificationCode: true, issuedAt: true } } }, orderBy: { event: { startsAt: 'desc' } } });
    return registrations.map(({ event, certificates }) => ({ ...event, event, certificates, period: event.startsAt > now ? 'UPCOMING' : event.endsAt < now ? 'PAST' : 'CURRENT' }));
  }
  async copy(userId: string, organizationId: string, eventId: string, d: { title: string; slug: string; startsAt: string; endsAt: string }) { await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']); const source = await this.prisma.event.findUniqueOrThrow({ where: { id: eventId }, include: { faqs: true } }); const created = await this.events.create(userId, organizationId, { title: d.title, slug: d.slug, summary: source.summary ?? undefined, description: source.description ?? undefined, venueName: source.venueName ?? undefined, venueAddress: source.venueAddress ?? undefined, startsAt: d.startsAt, endsAt: d.endsAt, timezone: source.timezone, capacity: source.capacity, visibility: source.visibility, registrationMode: source.registrationMode, formId: source.formId ?? undefined, faqs: source.faqs.map(f => ({ question: f.question, answer: f.answer })) }); await this.audit.record({ actorId: userId, organizationId, action: 'event.copied', resourceType: 'event', resourceId: created.id, metadata: { sourceEventId: eventId } }); return created; }
}
