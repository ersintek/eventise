import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { EnqueueJob, JobQueue } from './job-queue.port';
@Injectable()
export class DatabaseJobQueue implements JobQueue {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async enqueue(job: EnqueueJob) {
    if (job.idempotencyKey) {
      const existing = await this.prisma.backgroundJob.findUnique({ where: { idempotencyKey: job.idempotencyKey }, select: { id: true } });
      if (existing) return existing;
    }
    return this.prisma.backgroundJob.create({ data: { type: job.type, payload: job.payload as Prisma.InputJsonValue, runAt: job.runAt, idempotencyKey: job.idempotencyKey, maxAttempts: job.maxAttempts }, select: { id: true } });
  }
}
