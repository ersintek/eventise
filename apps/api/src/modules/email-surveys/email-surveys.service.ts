import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';

export type EmailSurveyQuestion = { id: string; label: string; required?: boolean };

@Injectable()
export class EmailSurveysService {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(OrganizationAccessService) private access: OrganizationAccessService) {}

  async list(userId: string, organizationId: string, eventId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    return this.prisma.emailSurvey.findMany({
      where: { eventId }, orderBy: { createdAt: 'desc' },
      include: { _count: { select: { responses: { where: { isTest: false } } } } },
    });
  }

  async create(userId: string, organizationId: string, eventId: string, title: string, questions: EmailSurveyQuestion[]) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    if (!title.trim() || !questions.length || questions.some(question => !question.id || !question.label.trim()) || new Set(questions.map(question => question.id)).size !== questions.length) {
      throw new BadRequestException('Anket başlığı ve birbirinden farklı en az bir soru gerekir.');
    }
    return this.prisma.emailSurvey.create({ data: { eventId, title: title.trim(), questions } });
  }

  async assertSurvey(userId: string, organizationId: string, eventId: string, surveyId: string) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    const survey = await this.prisma.emailSurvey.findFirst({ where: { id: surveyId, eventId } });
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    return survey;
  }

  async invitationUrl(surveyId: string, registration: { id: string; email: string; firstName: string; lastName: string }) {
    const survey = await this.prisma.emailSurvey.findUnique({ where: { id: surveyId } });
    if (!survey?.open) throw new BadRequestException('Anket gönderime açık değil.');
    const token = randomBytes(32).toString('base64url');
    await this.prisma.emailSurveyInvitation.create({ data: {
      surveyId, registrationId: registration.id, recipientEmail: registration.email.toLowerCase(),
      recipientName: `${registration.firstName} ${registration.lastName}`.trim(), tokenHash: this.digest(token), sentAt: new Date(),
    } });
    return this.publicUrl(token);
  }

  async testInvitationUrl(surveyId: string, recipientEmail: string) {
    const survey = await this.prisma.emailSurvey.findUnique({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    const token = randomBytes(32).toString('base64url');
    await this.prisma.emailSurveyInvitation.create({ data: { surveyId, recipientEmail: recipientEmail.toLowerCase(), recipientName: 'Test katılımcısı', tokenHash: this.digest(token), isTest: true, sentAt: new Date() } });
    return this.publicUrl(token);
  }

  async publicSurvey(token: string) {
    const invitation = await this.prisma.emailSurveyInvitation.findUnique({
      where: { tokenHash: this.digest(token) },
      include: { survey: { include: { event: { include: { organization: { select: { name: true } } } } } } },
    });
    if (!invitation || !invitation.survey.open) throw new NotFoundException('Anket bağlantısı geçersiz veya kapalı.');
    const answered = await this.prisma.emailSurveyResponse.findFirst({ where: invitation.registrationId ? { surveyId: invitation.surveyId, registrationId: invitation.registrationId } : { invitationId: invitation.id } });
    return { title: invitation.survey.title, questions: invitation.survey.questions, email: invitation.recipientEmail, name: invitation.recipientName, eventTitle: invitation.survey.event.title, organizationName: invitation.survey.event.organization.name, isTest: invitation.isTest, answered: Boolean(answered) };
  }

  async submit(token: string, answers: Record<string, unknown>) {
    const invitation = await this.prisma.emailSurveyInvitation.findUnique({ where: { tokenHash: this.digest(token) }, include: { survey: true } });
    if (!invitation || !invitation.survey.open) throw new NotFoundException('Anket bağlantısı geçersiz veya kapalı.');
    const questions = invitation.survey.questions as unknown as EmailSurveyQuestion[];
    if (questions.some(question => question.required !== false && !String(answers[question.id] ?? '').trim())) throw new BadRequestException('Lütfen tüm zorunlu soruları yanıtlayın.');
    try {
      await this.prisma.emailSurveyResponse.create({ data: { surveyId: invitation.surveyId, invitationId: invitation.id, registrationId: invitation.registrationId, answers: answers as Prisma.InputJsonValue, isTest: invitation.isTest } });
    } catch (error) {
      throw new ConflictException('Bu anketi daha önce yanıtladınız.');
    }
    return { submitted: true, isTest: invitation.isTest };
  }

  private digest(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private publicUrl(token: string) { return `${(process.env.PUBLIC_APP_URL ?? '').replace(/\/$/, '')}/anket/${token}`; }
}
