import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/persistence/prisma.service';

export type JobHandler = (payload: Record<string, unknown>) => Promise<void>;
@Injectable()
export class JobRunnerService {
  private readonly handlers = new Map<string, JobHandler>();
  constructor(private readonly prisma: PrismaService) {}
  register(type: string, handler: JobHandler) { this.handlers.set(type, handler); }
  async runNext(workerId: string): Promise<boolean> {
    const candidate = await this.prisma.backgroundJob.findFirst({ where: { status: 'PENDING', runAt: { lte: new Date() } }, orderBy: { createdAt: 'asc' } });
    if (!candidate) return false;
    const claimed = await this.prisma.backgroundJob.updateMany({ where: { id: candidate.id, status: 'PENDING' }, data: { status: 'PROCESSING', lockedAt: new Date(), lockedBy: workerId, attempts: { increment: 1 } } });
    if (!claimed.count) return true;
    try {
      const handler = this.handlers.get(candidate.type); if (!handler) throw new Error(`Kayıtlı job handler yok: ${candidate.type}`);
      await handler(candidate.payload as Record<string, unknown>);
      await this.prisma.backgroundJob.update({ where: { id: candidate.id }, data: { status: 'COMPLETED', completedAt: new Date(), lockedAt: null, lockedBy: null } });
    } catch (error) {
      const exhausted = candidate.attempts + 1 >= candidate.maxAttempts;
      await this.prisma.backgroundJob.update({ where: { id: candidate.id }, data: { status: exhausted ? 'FAILED' : 'PENDING', runAt: exhausted ? candidate.runAt : new Date(Date.now() + 30_000), lockedAt: null, lockedBy: null, lastError: error instanceof Error ? error.message.slice(0, 500) : 'Bilinmeyen hata' } });
    }
    return true;
  }
}
