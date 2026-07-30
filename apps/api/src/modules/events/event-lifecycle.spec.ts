import { describe, expect, it, vi } from 'vitest';
import { EventLifecycleService } from './event-lifecycle.service';

describe('seven-day closure scheduling', () => {
  it('schedules exactly seven days after event end', async () => {
    const enqueue = vi.fn().mockResolvedValue({ id: 'job' });
    const end = new Date('2027-01-01T10:00:00Z');
    const service = new EventLifecycleService(
      { backgroundJob: { findUnique: vi.fn().mockResolvedValue(null) } } as never,
      { enqueue } as never,
      { register: vi.fn() } as never,
      {} as never,
    );
    await service.schedule('event', end);
    expect(enqueue.mock.calls[0][0].runAt.toISOString()).toBe('2027-01-08T10:00:00.000Z');
  });

  it('reschedules a pending closure after the event end changes', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'job' });
    const service = new EventLifecycleService(
      { backgroundJob: { findUnique: vi.fn().mockResolvedValue({ id: 'job', status: 'PENDING' }), update } } as never,
      {} as never,
      { register: vi.fn() } as never,
      {} as never,
    );
    await service.schedule('event', new Date('2027-02-01T10:00:00Z'));
    expect(update.mock.calls[0][0].data.runAt.toISOString()).toBe('2027-02-08T10:00:00.000Z');
  });
});
