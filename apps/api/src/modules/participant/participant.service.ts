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
    await this.features.assertEnabled(eventId, 'participant_area');
    const user = await this.prisma.user.findUnique({ where: { id: userId } }), email = user?.email.trim().toLowerCase(), registration = email ? await this.prisma.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } } }) : null;
    if (!registration || registration.applicationStatus !== 'ACCEPTED') throw new NotFoundException('Kabul edilmiş katılımcı kaydı bulunamadı.');
    const settings = await this.prisma.eventFeatureSetting.findMany({ where: { eventId, enabled: true }, select: { featureKey: true } }), enabled = new Set(settings.map(item => item.featureKey));
    const [assessments, feedback, games, resources, notifications] = await Promise.all([
      enabled.has('assessments') ? this.prisma.assessment.findMany({ where: { eventId, open: true }, select: { id: true, kind: true, title: true, schema: true, submissions: { where: { registrationId: registration.id }, select: { id: true, score: true } } } }) : [],
      enabled.has('feedback') ? this.prisma.feedbackForm.findMany({ where: { eventId, open: true }, select: { id: true, title: true, schema: true, submissions: { where: { registrationId: registration.id }, select: { id: true } } } }) : [],
      enabled.has('icebreaker') ? this.prisma.gameSession.findMany({ where: { eventId, status: { in: ['OPEN', 'REVEAL'] } }, select: { id: true, title: true, status: true, config: true, assignments: { where: { registrationId: registration.id } }, responses: { where: { registrationId: registration.id } } } }) : [],
      this.prisma.eventResource.findMany({ where: { eventId, visible: true }, select: { id: true, title: true, kind: true, externalUrl: true } }),
      this.prisma.inAppNotification.findMany({ where: { userId, eventId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return { eventId, assessments, feedback, games, resources, notifications };
  }
}
