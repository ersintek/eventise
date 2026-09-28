import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
    const surveys = await this.prisma.emailSurvey.findMany({
      where: { eventId }, orderBy: { createdAt: 'desc' },
      include: { responses: { where: { isTest: false }, select: { registrationId: true, invitationId: true } } },
    });
    return surveys.map(({ responses, ...survey }) => ({ ...survey, _count: { responses: new Set(responses.map(response => response.registrationId ?? response.invitationId)).size } }));
  }

  async results(userId: string, organizationId: string, eventId: string, surveyId: string) {
    await this.assertSurvey(userId, organizationId, eventId, surveyId);
    const [survey, responses] = await Promise.all([
      this.prisma.emailSurvey.findUniqueOrThrow({ where: { id: surveyId }, select: { id: true, title: true, questions: true } }),
      this.prisma.emailSurveyResponse.findMany({
        where: { surveyId, isTest: false }, orderBy: { submittedAt: 'desc' },
        include: { invitation: { select: { recipientName: true, recipientEmail: true } } },
      }),
    ]);
    const latest = new Map<string, typeof responses[number]>();
    for (const response of responses) latest.set(response.registrationId ?? response.invitationId, response);
    return { survey, responses: [...latest.values()].map(response => ({ id: response.id, name: response.invitation.recipientName, email: response.invitation.recipientEmail, answers: response.answers, submittedAt: response.submittedAt })) };
  }

  async create(userId: string, organizationId: string, eventId: string, title: string, questions: EmailSurveyQuestion[]) {
    await this.access.requireEventAccess(userId, organizationId, eventId, ['ORGANIZATION_ADMIN', 'EVENT_MANAGER']);
    return this.prisma.emailSurvey.create({ data: { eventId, title: this.validateTitle(title), questions: this.validateQuestions(questions) } });
  }

  async update(userId: string, organizationId: string, eventId: string, surveyId: string, input: { title?: string; questions?: EmailSurveyQuestion[]; open?: boolean }) {
    const survey = await this.assertSurvey(userId, organizationId, eventId, surveyId);
    const changingContent = input.title !== undefined || input.questions !== undefined;
    if (changingContent && await this.prisma.emailSurveyResponse.count({ where: { surveyId, isTest: false } })) {
      throw new BadRequestException('Yanıt gelmiş ankette soru veya başlık değiştirilemez. Yeni sürüm oluşturun.');
    }
    if (input.open !== undefined && typeof input.open !== 'boolean') throw new BadRequestException('Anket durumu geçersiz.');
    return this.prisma.emailSurvey.update({ where: { id: survey.id }, data: {
      title: input.title === undefined ? undefined : this.validateTitle(input.title),
      questions: input.questions === undefined ? undefined : this.validateQuestions(input.questions),
      open: input.open,
    } });
  }

  async copy(userId: string, organizationId: string, eventId: string, surveyId: string) {
    const survey = await this.assertSurvey(userId, organizationId, eventId, surveyId);
    return this.prisma.emailSurvey.create({ data: { eventId, title: `${survey.title} (yeni sürüm)`, questions: this.validateQuestions(survey.questions as unknown as EmailSurveyQuestion[]), open: false } });
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
    return { title: invitation.survey.title, questions: invitation.survey.questions, email: invitation.recipientEmail, name: invitation.recipientName, eventTitle: invitation.survey.event.title, organizationName: invitation.survey.event.organization.name, isTest: invitation.isTest };
  }

  async submit(token: string, answers: Record<string, unknown>) {
    const invitation = await this.prisma.emailSurveyInvitation.findUnique({ where: { tokenHash: this.digest(token) }, include: { survey: true } });
    if (!invitation || !invitation.survey.open) throw new NotFoundException('Anket bağlantısı geçersiz veya kapalı.');
    const questions = this.validateQuestions(invitation.survey.questions as unknown as EmailSurveyQuestion[]);
    if (Object.keys(answers).length > questions.length || questions.some(question => answers[question.id] !== undefined && (typeof answers[question.id] !== 'string' || String(answers[question.id]).length > 4_000))) throw new BadRequestException('Anket yanıtları geçersiz veya çok uzun.');
    const normalizedAnswers=Object.fromEntries(questions.map(question=>[question.id,String(answers[question.id]??'').trim()]));
    await this.prisma.emailSurveyResponse.create({ data: { surveyId: invitation.surveyId, invitationId: invitation.id, registrationId: invitation.registrationId, answers: normalizedAnswers as Prisma.InputJsonValue, isTest: invitation.isTest } });
    return { submitted: true, isTest: invitation.isTest };
  }

  private validateTitle(title: string) {
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 160) throw new BadRequestException('Anket başlığı 1 ila 160 karakter olmalıdır.');
    return title.trim();
  }

  private validateQuestions(questions: EmailSurveyQuestion[]) {
    if (!Array.isArray(questions) || !questions.length || questions.length > 25) throw new BadRequestException('Ankette 1 ila 25 soru olmalıdır.');
    const normalized = questions.map(question => ({ id: typeof question?.id === 'string' ? question.id.trim() : '', label: typeof question?.label === 'string' ? question.label.trim() : '', required: question?.required !== false }));
    if (normalized.some(question => !question.id || question.id.length > 80 || !question.label || question.label.length > 500) || new Set(normalized.map(question => question.id)).size !== normalized.length) {
      throw new BadRequestException('Soruların başlığı ve birbirinden farklı kimliği olmalıdır.');
    }
    return normalized;
  }

  private digest(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private publicUrl(token: string) { return `${(process.env.PUBLIC_APP_URL ?? '').replace(/\/$/, '')}/anket/${token}`; }
}
