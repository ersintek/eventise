import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(OrganizationAccessService) private access: OrganizationAccessService, @Inject(AuditService) private audit: AuditService) {}

  private audienceWhere(eventId: string, audience: string) {
    const where: any = { eventId };
    if (audience === 'ACCEPTED') where.applicationStatus = 'ACCEPTED';
    else if (audience === 'CHECKED_IN') {
      where.applicationStatus = 'ACCEPTED';
      where.attendance = { some: { status: 'CHECKED_IN' } };
    }
    return where;
  }

  async audiencePreview(userId: string, organizationId: string, eventId: string, audience: string = 'ACCEPTED') {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const registrations = await this.prisma.eventRegistration.findMany({ where: this.audienceWhere(eventId, audience), select: { userId: true, email: true } });
    const unlinked = registrations.filter(registration => !registration.userId);
    const users = unlinked.length ? await this.prisma.user.findMany({ where: { email: { in: unlinked.map(registration => registration.email.trim().toLowerCase()) } }, select: { id: true, email: true } }) : [];
    const userIdByEmail = new Map(users.map(user => [user.email.trim().toLowerCase(), user.id]));
    const recipientIds = new Set(registrations.flatMap(registration => registration.userId ? [registration.userId] : userIdByEmail.get(registration.email.trim().toLowerCase()) ? [userIdByEmail.get(registration.email.trim().toLowerCase())!] : []));
    return { recipientCount: recipientIds.size, targetCount: registrations.length, withoutAccountCount: Math.max(0, registrations.length - recipientIds.size) };
  }

  async broadcast(userId: string, organizationId: string, eventId: string, title: string, body: string, audience: string = 'ACCEPTED') {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const registrations = await this.prisma.eventRegistration.findMany({ where: this.audienceWhere(eventId, audience), select: { id: true, userId: true, email: true } });
    const unlinked = registrations.filter(registration => !registration.userId);
    if (unlinked.length) {
      const users = await this.prisma.user.findMany({ where: { email: { in: unlinked.map(registration => registration.email.trim().toLowerCase()) } }, select: { id: true, email: true } });
      const userIdByEmail = new Map(users.map(user => [user.email.trim().toLowerCase(), user.id]));
      for (const registration of unlinked) {
        const linkedUserId = userIdByEmail.get(registration.email.trim().toLowerCase());
        if (linkedUserId) await this.prisma.eventRegistration.update({ where: { id: registration.id }, data: { userId: linkedUserId } });
      }
    }
    const refreshed = await this.prisma.eventRegistration.findMany({ where: this.audienceWhere(eventId, audience), select: { userId: true } });
    const recipientIds = [...new Set(refreshed.flatMap(registration => registration.userId ? [registration.userId] : []))];
    if (recipientIds.length) await this.prisma.inAppNotification.createMany({ data: recipientIds.map(id => ({ userId: id, eventId, title, body })) });
    await this.audit.record({ actorId: userId, organizationId, action: 'notification.broadcast', resourceType: 'event', resourceId: eventId, metadata: { recipientCount: recipientIds.length, audience } });
    return { recipientCount: recipientIds.length };
  }

  list(userId: string) { return this.prisma.inAppNotification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }); }
  async sentList(userId: string, organizationId: string, eventId: string) { await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']); const logs = await this.prisma.auditLog.findMany({ where: { action: 'notification.broadcast', resourceType: 'event', resourceId: eventId }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, createdAt: true, metadata: true } }); return logs.map(log => ({ id: log.id, createdAt: log.createdAt, ...(log.metadata as object) })); }
  async read(userId: string, id: string) { const updated = await this.prisma.inAppNotification.updateMany({ where: { id, userId }, data: { readAt: new Date() } }); return { updated: updated.count }; }
}
