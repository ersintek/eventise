import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { FeaturesModule } from '../features/features.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
@Module({ imports: [OrganizationsModule, FeaturesModule], controllers: [FeedbackController], providers: [FeedbackService] })
export class FeedbackModule {}
