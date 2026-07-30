import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { AuditService } from '../audit/audit.service';
import { EventsService } from './events.service';

@Injectable()
export class EventCopyService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(OrganizationAccessService) private access: OrganizationAccessService, @Inject(EventsService) private events: EventsService, @Inject(AuditService) private audit: AuditService) {}

  async history(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } }), now = new Date();
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { email: user.email, applicationStatus: 'ACCEPTED' },
      select: {
        event: { select: { id: true, title: true, startsAt: true, endsAt: true, organization: { select: { id: true, name: true, slug: true } } } },
        certificates: { where: { status: 'READY' }, select: { id: true, verificationCode: true, issuedAt: true } },
      },
      orderBy: { event: { startsAt: 'desc' } },
    });
    return registrations.map(({ event, certificates }) => ({ ...event, event, certificates, period: event.startsAt > now ? 'UPCOMING' : event.endsAt < now ? 'PAST' : 'CURRENT' }));
  }

  async follows(userId: string) {
    return this.prisma.organizationFollow.findMany({ where: { userId }, include: { organization: { select: { id: true, name: true, slug: true, description: true } } }, orderBy: { organization: { name: 'asc' } } });
  }

  async followingEvents(userId: string) {
    const follows = await this.prisma.organizationFollow.findMany({ where: { userId }, select: { organizationId: true } });
    if (!follows.length) return [];
    return this.prisma.event.findMany({
      where: { organizationId: { in: follows.map(item => item.organizationId) }, publicationStatus: 'PUBLISHED', visibility: 'PUBLIC', endsAt: { gte: new Date() } },
      select: { id: true, title: true, slug: true, summary: true, startsAt: true, registrationStatus: true, organization: { select: { id: true, name: true, slug: true } } },
      orderBy: { startsAt: 'asc' },
      take: 50,
    });
  }

  async upcomingEvents(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    const events = await this.prisma.event.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        visibility: 'PUBLIC',
        endsAt: { gte: new Date() },
        organization: { status: 'ACTIVE' },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        startsAt: true,
        endsAt: true,
        format: true,
        venueName: true,
        capacity: true,
        registrationStatus: true,
        registrationMode: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            followers: { where: { userId }, select: { id: true }, take: 1 },
          },
        },
        registrations: {
          where: { email: user.email.trim().toLowerCase() },
          select: { id: true, applicationStatus: true },
          take: 1,
        },
      },
      orderBy: { startsAt: 'asc' },
      take: 100,
    });
    return events.map(({ registrations, organization, ...event }) => ({
      ...event,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      followed: organization.followers.length > 0,
      registration: registrations[0] ?? null,
    }));
  }

  async follow(userId: string, organizationId: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id: organizationId, status: 'ACTIVE' }, select: { id: true } });
    if (!organization) throw new NotFoundException('Kurum bulunamadı.');
    return this.prisma.organizationFollow.upsert({ where: { userId_organizationId: { userId, organizationId } }, create: { userId, organizationId }, update: { emailNotifications: true } });
  }

  async unfollow(userId: string, organizationId: string) {
    await this.prisma.organizationFollow.deleteMany({ where: { userId, organizationId } });
    return { unfollowed: true };
  }

  async copy(userId: string, organizationId: string, eventId: string, data: { title: string; slug: string; startsAt: string; endsAt: string }) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const source = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: { faqs: true, form: { include: { versions: { orderBy: { version: 'asc' } } } } },
    });
    let clonedFormId: string | undefined;
    if (source.form) {
      const clonedForm = await this.prisma.form.create({
        data: {
          organizationId,
          name: `${data.title.trim()} kayıt formu`,
          versions: {
            create: source.form.versions.map(version => ({
              version: version.version,
              schema: version.schema as Prisma.InputJsonValue,
              publishedAt: version.publishedAt,
            })),
          },
        },
      });
      clonedFormId = clonedForm.id;
    }
    let created;
    try {
      created = await this.events.create(userId, organizationId, { title: data.title, slug: data.slug, summary: source.summary ?? undefined, description: source.description ?? undefined, venueName: source.venueName ?? undefined, venueAddress: source.venueAddress ?? undefined, startsAt: data.startsAt, endsAt: data.endsAt, timezone: source.timezone, capacity: source.capacity, visibility: source.visibility, registrationMode: source.registrationMode, formId: clonedFormId, faqs: source.faqs.map(faq => ({ question: faq.question, answer: faq.answer })) });
    } catch (error) {
      if (clonedFormId) await this.prisma.form.delete({ where: { id: clonedFormId } });
      throw error;
    }
    await this.audit.record({ actorId: userId, organizationId, action: 'event.copied', resourceType: 'event', resourceId: created.id, metadata: { sourceEventId: eventId } });
    return created;
  }
}
