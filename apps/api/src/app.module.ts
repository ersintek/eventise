import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PersistenceModule, AuditModule, JobsModule, EmailModule, StorageModule, AuthModule, OrganizationsModule, TiersModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
