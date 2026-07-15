import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { FeaturesModule } from '../features/features.module';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
@Module({ imports: [OrganizationsModule, FeaturesModule], controllers: [AssessmentsController], providers: [AssessmentsService] })
export class AssessmentsModule {}
