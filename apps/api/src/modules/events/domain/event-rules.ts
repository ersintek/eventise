import { BadRequestException } from '@nestjs/common';
export function assertEventDates(startsAt: Date, endsAt: Date, opensAt?: Date, closesAt?: Date) {
  if (endsAt <= startsAt) throw new BadRequestException('Bitiş tarihi başlangıçtan sonra olmalıdır.');
  if (opensAt && closesAt && closesAt <= opensAt) throw new BadRequestException('Kayıt kapanışı açılıştan sonra olmalıdır.');
  if (closesAt && closesAt > startsAt) throw new BadRequestException('Kayıt kapanışı etkinlik başlangıcından sonra olamaz.');
}
export function canTransitionPublication(from: string, to: string) {
  return ({ DRAFT: ['PUBLISHED','ARCHIVED'], PUBLISHED: ['UNPUBLISHED','ARCHIVED'], UNPUBLISHED: ['PUBLISHED','ARCHIVED'], ARCHIVED: [] } as Record<string,string[]>)[from]?.includes(to) ?? false;
}
