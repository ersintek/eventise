import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/identity/auth.module';
import { JwtAuthGuard } from './modules/identity/policies/jwt-auth.guard';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PersistenceModule } from './shared/persistence/persistence.module';
import { TiersModule } from './modules/tiers/tiers.module';
import { JobsModule } from './infrastructure/jobs/jobs.module';
import { EmailModule } from './infrastructure/email/email.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { HealthController } from './health.controller';
import { BigIntSerializationInterceptor } from './shared/http/bigint-serialization.interceptor';
import { validateEnvironment } from './config/environment';
import { EventsModule } from './modules/events/events.module';
import { FormsModule } from './modules/forms/forms.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { ConsentsModule } from './modules/consents/consents.module';
import { AiModule } from './infrastructure/ai/ai.module';
import { FeaturesModule } from './modules/features/features.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { GroupsModule } from './modules/groups/groups.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MediaModule } from './modules/media/media.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { PdfModule } from './infrastructure/pdf/pdf.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }), PersistenceModule, AuditModule, JobsModule, EmailModule, StorageModule, PdfModule, AiModule, AuthModule, OrganizationsModule, TiersModule, EventsModule, FormsModule, CommunicationsModule, ConsentsModule, RegistrationsModule, FeaturesModule, CheckInModule, GroupsModule, ActivitiesModule, AssessmentsModule, FeedbackModule, NotificationsModule, MediaModule, ResourcesModule, CertificatesModule, ReportingModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_INTERCEPTOR, useClass: BigIntSerializationInterceptor }],
})
export class AppModule {}
export { JobRunnerService } from './infrastructure/jobs/job-runner.service';
