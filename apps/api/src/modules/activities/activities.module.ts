import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { FeaturesModule } from '../features/features.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
@Module({ imports: [OrganizationsModule, FeaturesModule], controllers: [ActivitiesController], providers: [ActivitiesService] })
export class ActivitiesModule {}
