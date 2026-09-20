import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { JobQueue } from '../../infrastructure/jobs/job-queue.port';
import { JobRunnerService } from '../../infrastructure/jobs/job-runner.service';
import { EmailProvider } from '../../infrastructure/email/email-provider.port';
import { OrganizationAccessService } from '../organizations/policies/organization-access.service';
import { emailVariables, renderEmailBody, renderTemplate, validateTemplate } from './template-engine';
import { toPublicUrl } from './public-url';

@Injectable()
export class CommunicationsService implements OnModuleInit {
  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(JobQueue) private jobs: JobQueue, @Inject(JobRunnerService) private runner: JobRunnerService, @Inject(EmailProvider) private email: EmailProvider, @Inject(OrganizationAccessService) private access: OrganizationAccessService) {}
  onModuleInit() { this.runner.register('email.send', p => this.deliver(String(p.messageId))); this.runner.register('notification.dispatch', p => this.dispatchNotification(String(p.notificationId))); }
  async queueRegistrationMessage(input: { organizationId:string; templateKey:string; recipient:string; participantFirstName:string; participantFullName:string; organizationName:string; eventName:string; eventStart:Date; eventEnd?:Date; eventLocation?:string; eventPublicUrl:string; certificateUrl?:string; subjectOverride?:string; bodyOverride?:string; scheduledNotificationId?:string }) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { organizationId_key: { organizationId: input.organizationId, key: input.templateKey } } }); if (!template) return;
    const longDate = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(input.eventStart);
    const longDateTime = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(input.eventStart);
    const startTime = new Intl.DateTimeFormat('tr-TR', { timeStyle: 'short' }).format(input.eventStart);
    const publicUrl = toPublicUrl(input.eventPublicUrl);
    const variables = { 'participant.first_name':input.participantFirstName, 'participant.full_name':input.participantFullName, 'organization.name':input.organizationName, 'event.name':input.eventName, 'event.start_date':longDate, 'event.start_datetime':longDateTime, 'event.start_time':startTime, 'event.end_date':input.eventEnd ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(input.eventEnd) : longDate, 'event.end_time':input.eventEnd ? new Intl.DateTimeFormat('tr-TR', { timeStyle: 'short' }).format(input.eventEnd) : startTime, 'event.location':input.eventLocation ?? '', 'event.public_url':publicUrl, 'event.participant_url':publicUrl, 'certificate.url':input.certificateUrl ?? '' };
    const subject=input.subjectOverride??template.subject,body=input.bodyOverride??template.body; validateTemplate(subject, emailVariables); validateTemplate(body, emailVariables);
    const message = await this.prisma.emailMessage.create({ data: { templateId:template.id, scheduledNotificationId:input.scheduledNotificationId, recipient:input.recipient, subject:renderTemplate(subject, variables), body:renderEmailBody(body, variables) } });
    await this.jobs.enqueue({ type:'email.send', payload:{ messageId:message.id }, idempotencyKey:`email:${message.id}` }); return message;
  }
  async listTemplates(userId:string, organizationId:string) { await this.access.requireMembership(userId, organizationId); return this.prisma.emailTemplate.findMany({ where:{organizationId}, orderBy:{key:'asc'} }); }
  async queueSystemMessage(recipient:string,subject:string,body:string,idempotencyKey:string){const existing=await this.prisma.backgroundJob.findUnique({where:{idempotencyKey},select:{id:true}});if(existing)return existing;const message=await this.prisma.emailMessage.create({data:{recipient,subject,body}});return this.jobs.enqueue({type:'email.send',payload:{messageId:message.id},idempotencyKey});}
  async updateTemplate(userId:string, organizationId:string, id:string, subject:string, body:string) { await this.access.requireMembership(userId, organizationId, ['ORGANIZATION_ADMIN','EVENT_MANAGER']); validateTemplate(subject,emailVariables); validateTemplate(body,emailVariables); const found=await this.prisma.emailTemplate.findFirst({where:{id,organizationId}}); if(!found)throw new NotFoundException('Şablon bulunamadı.'); return this.prisma.emailTemplate.update({where:{id},data:{subject,body}}); }
  async scheduleReminder(userId:string, organizationId:string, eventId:string, templateId:string, sendAt:Date, subject:string, body:string) {
    await this.access.requireEventAccess(userId,organizationId,eventId,['ORGANIZATION_ADMIN','EVENT_MANAGER']);
    const event=await this.prisma.event.findFirst({where:{id:eventId,organizationId}});
    const template=await this.prisma.emailTemplate.findFirst({where:{id:templateId,organizationId,category:'REMINDER'}});
    if(!event||!template)throw new NotFoundException('Etkinlik veya hatırlatma şablonu bulunamadı.'); validateTemplate(subject,emailVariables); validateTemplate(body,emailVariables);
    if(Number.isNaN(sendAt.getTime())||sendAt<=new Date()||sendAt>=event.startsAt)throw new BadRequestException('Hatırlatma gelecekte ve etkinlikten önce olmalıdır.');
    for(let attempt=0;attempt<3;attempt++){
      try{
        return await this.prisma.$transaction(async tx=>{
          if(await tx.scheduledNotification.count({where:{eventId,status:'SCHEDULED'}})>=2)throw new BadRequestException('Bir etkinlik için en fazla iki hatırlatma planlanabilir.');
          const notification=await tx.scheduledNotification.create({data:{eventId,templateId,sendAt,subject,body}});
          await tx.backgroundJob.create({data:{type:'notification.dispatch',payload:{notificationId:notification.id},runAt:sendAt,idempotencyKey:`notification:${notification.id}`}});
          return notification;
        },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
      }catch(error){
        if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2034'&&attempt<2)continue;
        throw error;
      }
    }
    throw new BadRequestException('Hatırlatma şu anda planlanamadı. Lütfen yeniden deneyin.');
  }
  private async dispatchNotification(id:string) { const n=await this.prisma.scheduledNotification.findUnique({where:{id},include:{event:{include:{organization:true,registrations:{where:{applicationStatus:'ACCEPTED'}}}},template:true}}); if(!n||n.status!=='SCHEDULED')return; const period=n.sendAt.toISOString().slice(0,7); const participantCount=await this.prisma.eventRegistration.count({where:{event:{organizationId:n.event.organizationId},createdAt:{gte:new Date(`${period}-01T00:00:00.000Z`)}}}); const used=await this.prisma.usageCounter.findUnique({where:{organizationId_key_period:{organizationId:n.event.organizationId,key:'event_email',period}}}); const tier=await this.prisma.tier.findUniqueOrThrow({where:{id:n.event.organization.tierId}}); if(Number(used?.value??0n)+n.event.registrations.length>participantCount*tier.emailMultiplier){ // Kota yetersizse hatırlatmayı FAILED'a çek ve hata fırlatmadan dön — job retry'a girmez, STK arayüzde durumu görür.
 await this.prisma.scheduledNotification.update({where:{id},data:{status:'FAILED',failureReason:'Aylık etkinlik e-posta kotası aşıldı. Planınızı kontrol edin veya kota yenilenmesini bekleyin.'}}); return; } for(const r of n.event.registrations)await this.queueRegistrationMessage({organizationId:n.event.organizationId,templateKey:n.template.key,recipient:r.email,participantFirstName:r.firstName,participantFullName:`${r.firstName} ${r.lastName}`,organizationName:n.event.organization.name,eventName:n.event.title,eventStart:n.event.startsAt,eventEnd:n.event.endsAt,eventLocation:n.event.venueName??undefined,eventPublicUrl:`/events/${n.event.organization.slug}/${n.event.slug}`,subjectOverride:n.subject??undefined,bodyOverride:n.body??undefined,scheduledNotificationId:n.id}); await this.prisma.usageCounter.upsert({where:{organizationId_key_period:{organizationId:n.event.organizationId,key:'event_email',period}},create:{organizationId:n.event.organizationId,key:'event_email',period,value:n.event.registrations.length},update:{value:{increment:n.event.registrations.length}}}); await this.prisma.scheduledNotification.update({where:{id},data:{status:n.event.registrations.length?'QUEUED':'SENT',failureReason:null}}); }
  private async deliver(id:string) { const m=await this.prisma.emailMessage.findUnique({where:{id}}); if(!m||m.status==='SENT')return; try { await this.email.send({to:m.recipient,subject:m.subject,html:m.body,idempotencyKey:m.id}); await this.prisma.emailMessage.update({where:{id},data:{status:'SENT',sentAt:new Date(),lastError:null}}); await this.refreshScheduledNotificationStatus(m.scheduledNotificationId); } catch(e) { const failure=e instanceof Error?e.message.slice(0,500):'Gönderim hatası'; await this.prisma.emailMessage.update({where:{id},data:{status:'FAILED',lastError:failure}}); if(m.scheduledNotificationId)await this.prisma.scheduledNotification.update({where:{id:m.scheduledNotificationId},data:{status:'FAILED',failureReason:failure}}); throw e; } }
  private async refreshScheduledNotificationStatus(id?:string|null){if(!id)return;const pending=await this.prisma.emailMessage.count({where:{scheduledNotificationId:id,status:{not:'SENT'}}});if(!pending)await this.prisma.scheduledNotification.update({where:{id},data:{status:'SENT',failureReason:null}})}
  async listReminders(userId:string,organizationId:string,eventId:string){await this.access.requireEventAccess(userId,organizationId,eventId,['ORGANIZATION_ADMIN','EVENT_MANAGER']);return this.prisma.scheduledNotification.findMany({where:{eventId},include:{template:{select:{key:true,subject:true,body:true}}},orderBy:{sendAt:'asc'}})}
  async updateScheduledReminder(userId:string,organizationId:string,eventId:string,id:string,subject:string,body:string){await this.access.requireEventAccess(userId,organizationId,eventId,['ORGANIZATION_ADMIN','EVENT_MANAGER']);validateTemplate(subject,emailVariables);validateTemplate(body,emailVariables);const reminder=await this.prisma.scheduledNotification.findFirst({where:{id,eventId,status:'SCHEDULED'}});if(!reminder)throw new NotFoundException('Yalnızca henüz gönderilmemiş hatırlatmalar düzenlenebilir.');return this.prisma.scheduledNotification.update({where:{id},data:{subject,body}})}
  async cancelReminder(userId:string,organizationId:string,eventId:string,id:string){await this.access.requireEventAccess(userId,organizationId,eventId,['ORGANIZATION_ADMIN','EVENT_MANAGER']);const reminder=await this.prisma.scheduledNotification.findFirst({where:{id,eventId,status:'SCHEDULED'}});if(!reminder)throw new NotFoundException('İptal edilebilir hatırlatma bulunamadı.');await this.prisma.$transaction([this.prisma.scheduledNotification.update({where:{id},data:{status:'CANCELLED'}}),this.prisma.backgroundJob.updateMany({where:{idempotencyKey:`notification:${id}`,status:'PENDING'},data:{status:'COMPLETED',completedAt:new Date()}})]);return{cancelled:true}}
}
