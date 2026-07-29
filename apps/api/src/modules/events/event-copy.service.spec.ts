import { describe, expect, it, vi } from 'vitest';
import { EventCopyService } from './event-copy.service';

describe('EventCopyService upcoming events', () => {
  it('lists discoverable events and adds participant context', async () => {
    const findMany = vi.fn().mockResolvedValue([{
      id: 'event-1',
      title: 'Açık Etkinlik',
      slug: 'acik-etkinlik',
      summary: 'Özet',
      startsAt: new Date('2027-01-10T10:00:00Z'),
      endsAt: new Date('2027-01-10T12:00:00Z'),
      format: 'OFFLINE',
      venueName: 'Salon',
      capacity: 100,
      registrationStatus: 'OPEN',
      registrationMode: 'DIRECT',
      organization: { id: 'org-1', name: 'STK', slug: 'stk', followers: [{ id: 'follow-1' }] },
      registrations: [{ id: 'registration-1', applicationStatus: 'ACCEPTED' }],
    }]);
    const prisma = {
      user: { findUniqueOrThrow: vi.fn().mockResolvedValue({ email: 'participant@example.com' }) },
      event: { findMany },
    };
    const service = new EventCopyService(prisma as never, {} as never, {} as never, {} as never);

    const result = await service.upcomingEvents('user-1');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        publicationStatus: 'PUBLISHED',
        visibility: 'PUBLIC',
        endsAt: expect.any(Object),
      }),
      orderBy: { startsAt: 'asc' },
    }));
    expect(result[0]).toMatchObject({
      followed: true,
      registration: { applicationStatus: 'ACCEPTED' },
      organization: { id: 'org-1', name: 'STK', slug: 'stk' },
    });
    expect(result[0].organization).not.toHaveProperty('followers');
  });
});
