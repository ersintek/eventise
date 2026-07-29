import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { JobQueue } from '../../infrastructure/jobs/job-queue.port';
import { JobRunnerService } from '../../infrastructure/jobs/job-runner.service';
import { StorageProvider } from '../../infrastructure/storage/storage-provider.port';
import { PrismaService } from '../../shared/persistence/prisma.service';

const DAY = 24 * 60 * 60_000;

@Injectable()
export class RetentionService implements OnModuleInit {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JobQueue) private jobs: JobQueue,
    @Inject(JobRunnerService) private runner: JobRunnerService,
    @Inject(StorageProvider) private storage: StorageProvider,
  ) {}

  onModuleInit() {
    this.runner.register('retention.cleanup', () => this.cleanup());
    void this.schedule(new Date(Date.now() + 60_000));
  }

  private schedule(runAt: Date) {
    const day = runAt.toISOString().slice(0, 10);
    return this.jobs.enqueue({ type: 'retention.cleanup', payload: {}, runAt, idempotencyKey: `retention:${day}` });
  }

  private async removeObjects(keys: Array<string | null>) {
    for (const key of [...new Set(keys.filter((value): value is string => Boolean(value)))]) {
      await this.storage.delete(key);
    }
  }

  async cleanup() {
    const now = new Date();
    const reportCutoff = new Date(now.getTime() - 30 * DAY);
    const annualCutoff = new Date(now.getTime() - 365 * DAY);
    const tokenCutoff = new Date(now.getTime() - 7 * DAY);

    const [reports, registrations] = await Promise.all([
      this.prisma.reportExport.findMany({ where: { completedAt: { lt: reportCutoff } }, select: { id: true, storageKey: true } }),
      this.prisma.eventRegistration.findMany({
        where: { event: { endsAt: { lt: annualCutoff } } },
        select: { id: true, certificates: { select: { storageKey: true } } },
      }),
    ]);

    await this.removeObjects(reports.map(row => row.storageKey));
    await this.removeObjects(registrations.flatMap(row => row.certificates.map(certificate => certificate.storageKey)));

    await this.prisma.$transaction([
      this.prisma.reportExport.deleteMany({ where: { id: { in: reports.map(row => row.id) } } }),
      this.prisma.eventRegistration.deleteMany({ where: { id: { in: registrations.map(row => row.id) } } }),
      this.prisma.guestAccessToken.deleteMany({ where: { expiresAt: { lt: tokenCutoff } } }),
      this.prisma.accountSetupToken.deleteMany({ where: { expiresAt: { lt: tokenCutoff } } }),
      this.prisma.auditLog.deleteMany({ where: { createdAt: { lt: annualCutoff } } }),
      this.prisma.emailMessage.deleteMany({ where: { createdAt: { lt: annualCutoff } } }),
      this.prisma.checkInAttempt.deleteMany({ where: { createdAt: { lt: annualCutoff } } }),
    ]);

    await this.schedule(new Date(now.getTime() + DAY));
  }
}
