import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { FeaturesService } from '../features/features.service';
@Injectable()
export class ParticipantService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(FeaturesService) private features: FeaturesService) {}
  async registration(userId: string, eventId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, firstName: true, lastName: true } });
    if (!user) return null;
    const email = user.email.trim().toLowerCase();
    const registration = await this.prisma.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } }, select: { id: true, applicationStatus: true } });
    return { user, registration };
  }
  async modules(userId: string, eventId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } }), email = user?.email.trim().toLowerCase(), registration = email ? await this.prisma.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } } }) : null;
    if (!registration || registration.applicationStatus !== 'ACCEPTED') throw new NotFoundException('Kabul edilmiş katılımcı kaydı bulunamadı.');
    const [assessments, feedback, games, resources, notifications] = await Promise.all([
      this.prisma.assessment.findMany({ where: { eventId, open: true }, select: { id: true, kind: true, title: true, schema: true, submissions: { where: { registrationId: registration.id }, select: { id: true, score: true } } } }),
      this.prisma.feedbackForm.findMany({ where: { eventId, open: true }, select: { id: true, title: true, schema: true, submissions: { where: { registrationId: registration.id }, select: { id: true } } } }),
      this.prisma.gameSession.findMany({ where: { eventId, status: { in: ['OPEN', 'REVEAL'] } }, select: { id: true, title: true, status: true, config: true, assignments: { where: { registrationId: registration.id } }, responses: { where: { registrationId: registration.id } } } }),
      this.prisma.eventResource.findMany({ where: { eventId, visible: true }, select: { id: true, title: true, kind: true, externalUrl: true } }),
      this.prisma.inAppNotification.findMany({ where: { userId, eventId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return { eventId, assessments, feedback, games, resources, notifications };
  }
}
