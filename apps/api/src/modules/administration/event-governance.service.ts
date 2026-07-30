import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { JobRunnerService } from '../../infrastructure/jobs/job-runner.service';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';

@Injectable()
export class EventGovernanceService implements OnModuleInit {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JobRunnerService) private runner: JobRunnerService,
    @Inject(OrganizationAccessService) private access: OrganizationAccessService,
    @Inject(AuditService) private audit: AuditService,
  ) {}

  onModuleInit() {
    this.runner.register('event.deletion.purge', async payload => {
      await this.purge(String(payload.eventId));
    });
  }

  async schedule(userId: string, organizationId: string, eventId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN']);
    const current = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (current?.deletionScheduledFor && current.deletionScheduledFor > new Date()) {
      return { eventId, recoverableUntil: current.deletionScheduledFor, alreadyScheduled: true };
    }
    const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60_000);
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        publicationStatus: 'ARCHIVED',
        registrationStatus: 'CLOSED',
        deletedAt: new Date(),
        deletionScheduledFor: purgeAt,
      },
    });
    await this.prisma.backgroundJob.upsert({
      where: { idempotencyKey: `event-deletion:${eventId}` },
      create: {
        type: 'event.deletion.purge',
        payload: { eventId },
        runAt: purgeAt,
        idempotencyKey: `event-deletion:${eventId}`,
      },
      update: {
        type: 'event.deletion.purge',
        payload: { eventId },
        status: 'PENDING',
        runAt: purgeAt,
        attempts: 0,
        lockedAt: null,
        lockedBy: null,
        completedAt: null,
        lastError: null,
      },
    });
    await this.audit.record({
      actorId: userId,
      organizationId,
      action: 'event.deletion_scheduled',
      resourceType: 'event',
      resourceId: eventId,
      metadata: { purgeAt: purgeAt.toISOString() },
    });
    return { eventId: event.id, recoverableUntil: purgeAt, alreadyScheduled: false };
  }

  async recover(userId: string, organizationId: string, eventId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN']);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId, deletionScheduledFor: { gt: new Date() } },
    });
    if (!event) throw new NotFoundException('Geri alınabilir etkinlik bulunamadı.');
    await this.prisma.$transaction([
      this.prisma.event.update({
        where: { id: eventId },
        data: {
          publicationStatus: 'UNPUBLISHED',
          registrationStatus: 'CLOSED',
          deletedAt: null,
          deletionScheduledFor: null,
        },
      }),
      this.prisma.backgroundJob.updateMany({
        where: { idempotencyKey: `event-deletion:${eventId}`, status: { in: ['PENDING', 'FAILED'] } },
        data: { status: 'COMPLETED', completedAt: new Date(), lockedAt: null, lockedBy: null },
      }),
    ]);
    await this.audit.record({
      actorId: userId,
      organizationId,
      action: 'event.deletion_recovered',
      resourceType: 'event',
      resourceId: eventId,
    });
    return { recovered: true };
  }

  async announcementApproval(adminId: string, organizationId: string, approved: boolean) {
    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { announcementApproved: approved },
    });
    await this.audit.record({
      actorId: adminId,
      organizationId,
      action: 'admin.announcement_approval_changed',
      resourceType: 'organization',
      resourceId: organizationId,
      metadata: { approved },
    });
    return organization;
  }

  private async purge(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event?.deletionScheduledFor || event.deletionScheduledFor > new Date()) return;
    const organizationId = event.organizationId;
    await this.prisma.event.delete({ where: { id: eventId } });
    await this.audit.record({
      organizationId,
      action: 'event.permanently_deleted',
      resourceType: 'event',
      resourceId: eventId,
    });
  }
}
