import { describe, expect, it, vi } from 'vitest';
import { DatabaseJobQueue } from './database-job-queue';

describe('DatabaseJobQueue', () => {
  it('returns the existing job for a repeated idempotency key', async () => {
    const prisma = { backgroundJob: { findUnique: vi.fn().mockResolvedValue({ id: 'job-1' }), create: vi.fn() } };
    const queue = new DatabaseJobQueue(prisma as never);
    await expect(queue.enqueue({ type: 'email.send', payload: {}, idempotencyKey: 'same-event' })).resolves.toEqual({ id: 'job-1' });
    expect(prisma.backgroundJob.create).not.toHaveBeenCalled();
  });
  it('creates a durable pending job', async () => {
    const prisma = { backgroundJob: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'job-2' }) } };
    const queue = new DatabaseJobQueue(prisma as never);
    await expect(queue.enqueue({ type: 'report.generate', payload: { eventId: 'e1' }, idempotencyKey: 'report-e1' })).resolves.toEqual({ id: 'job-2' });
    expect(prisma.backgroundJob.create).toHaveBeenCalledOnce();
  });
});
