import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { EmailSurveysController } from './email-surveys.controller';
import { EmailSurveysService } from './email-surveys.service';
@Module({ imports: [OrganizationsModule], controllers: [EmailSurveysController], providers: [EmailSurveysService], exports: [EmailSurveysService] })
export class EmailSurveysModule {}
