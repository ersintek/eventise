import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RegistrationApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { FeaturesService } from '../features/features.service';
import { ResourcesService } from '../resources/resources.service';
@Injectable()
export class ParticipantService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(FeaturesService) private features: FeaturesService, @Inject(ResourcesService) private resourcesService: ResourcesService) {}
  async registration(userId: string, eventId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, firstName: true, lastName: true } });
    if (!user) return null;
    const email = user.email.trim().toLowerCase();
    const registration = await this.prisma.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } }, select: { id: true, applicationStatus: true, answers: true } });
    return { user, registration };
  }
  async updateRegistration(userId: string, eventId: string, answers: object) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    const registration = await this.prisma.eventRegistration.findUnique({ where: { eventId_email: { eventId, email: user.email.trim().toLowerCase() } }, include: { event: { include: { form: { include: { versions: { where: { publishedAt: { not: null } }, orderBy: { version: 'desc' }, take: 1 } } } } } } });
    if (!registration || registration.applicationStatus !== 'ACCEPTED') throw new BadRequestException('Yalnızca onaylanmış başvurular düzenlenebilir.');
    const version = registration.event.form?.versions[0];
    const fields = ((version?.schema as { fields?: Array<{ key: string; type: string; required: boolean; options?: string[] }> } | undefined)?.fields ?? []);
    const submittedAnswers = answers as Record<string, unknown>;
    const values = Object.fromEntries(fields.map(field => [field.key, submittedAnswers[field.key]]));
    for (const field of fields) {
      const value = values[field.key];
      const empty = value === undefined || value === null || value === '' || value === false;
      if (field.required && empty) throw new BadRequestException(`${field.key} alanı zorunludur.`);
      if (field.type === 'number' && value !== undefined && value !== '' && !Number.isFinite(Number(value))) throw new BadRequestException(`${field.key} sayısal olmalıdır.`);
      if (field.type === 'select' && value !== undefined && value !== '' && field.options && !field.options.includes(String(value))) throw new BadRequestException(`${field.key} için geçersiz seçim.`);
    }
    const nextStatus: RegistrationApplicationStatus = registration.event.registrationMode === 'APPROVAL' ? 'PENDING' : 'ACCEPTED';
    const updated = await this.prisma.$transaction(async tx => {
      const mergedAnswers = { ...(registration.answers as Record<string, unknown>), ...values };
      const value = await tx.eventRegistration.update({ where: { id: registration.id }, data: { answers: mergedAnswers as Prisma.InputJsonValue, formVersionId: version?.id, applicationStatus: nextStatus } });
      await tx.registrationStatusHistory.create({ data: { registrationId: registration.id, fromStatus: registration.applicationStatus, toStatus: nextStatus, actorId: userId, reason: registration.event.registrationMode === 'APPROVAL' ? 'Katılımcı başvuru yanıtlarını güncelledi; yeniden değerlendirmeye alındı.' : 'Katılımcı başvuru yanıtlarını güncelledi.' } });
      return value;
    });
    return { id: updated.id, applicationStatus: updated.applicationStatus, requiresReview: nextStatus === 'PENDING' };
  }
  async modules(userId: string, eventId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } }), email = user?.email.trim().toLowerCase(), registration = email ? await this.prisma.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } } }) : null;
    if (!registration || registration.applicationStatus !== 'ACCEPTED') throw new NotFoundException('Kabul edilmiş katılımcı kaydı bulunamadı.');
    const [assessments, feedback, games, resources, notifications] = await Promise.all([
      this.prisma.assessment.findMany({ where: { eventId, open: true }, select: { id: true, kind: true, title: true, schema: true, submissions: { where: { registrationId: registration.id }, select: { id: true, score: true } } } }),
      this.prisma.feedbackForm.findMany({ where: { eventId, open: true }, select: { id: true, title: true, schema: true, submissions: { where: { registrationId: registration.id }, select: { id: true } } } }),
      this.prisma.gameSession.findMany({ where: { eventId, status: { in: ['OPEN', 'REVEAL'] } }, select: { id: true, title: true, status: true, config: true, assignments: { where: { registrationId: registration.id } }, responses: { where: { registrationId: registration.id } } } }),
      this.resourcesService.list(userId, eventId),
      this.prisma.inAppNotification.findMany({ where: { userId, eventId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return { eventId, assessments, feedback, games, resources, notifications };
  }
}
