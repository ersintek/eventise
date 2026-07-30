import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JobQueue } from '../../infrastructure/jobs/job-queue.port';
import { JobRunnerService } from '../../infrastructure/jobs/job-runner.service';
import { PrismaService } from '../../shared/persistence/prisma.service';

@Injectable()
export class EventLifecycleService implements OnModuleInit {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JobQueue) private jobs: JobQueue,
    @Inject(JobRunnerService) private runner: JobRunnerService,
    @Inject(AuditService) private audit: AuditService,
  ) {}

  onModuleInit() {
    this.runner.register('event.close_temporary_modules', async payload => {
      await this.close(String(payload.eventId));
    });
  }

  async schedule(eventId: string, endsAt: Date) {
    const idempotencyKey = `event-close:${eventId}`;
    const runAt = new Date(endsAt.getTime() + 7 * 24 * 60 * 60_000);
    const existing = await this.prisma.backgroundJob.findUnique({ where: { idempotencyKey }, select: { id: true, status: true } });
    if (existing?.status === 'PENDING') {
      return this.prisma.backgroundJob.update({ where: { id: existing.id }, data: { runAt, payload: { eventId } }, select: { id: true } });
    }
    if (existing) return { id: existing.id };
    return this.jobs.enqueue({
      type: 'event.close_temporary_modules',
      payload: { eventId },
      runAt,
      idempotencyKey,
    });
  }

  async close(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { organizationId: true, temporaryModulesClosedAt: true } });
    if (!event || event.temporaryModulesClosedAt) return { closed: false };
    await this.prisma.$transaction([
      this.prisma.feedbackForm.updateMany({ where: { eventId, open: true }, data: { open: false } }),
      this.prisma.event.update({ where: { id: eventId }, data: { temporaryModulesClosedAt: new Date() } }),
    ]);
    await this.audit.record({
      organizationId: event.organizationId,
      action: 'event.temporary_modules_closed',
      resourceType: 'event',
      resourceId: eventId,
    });
    return { closed: true };
  }
}
