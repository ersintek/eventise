import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { FormsController } from './forms.controller';
import { PublicFormsController } from './public-forms.controller';
import { FormsService } from './forms.service';
@Module({ imports: [OrganizationsModule], controllers: [FormsController, PublicFormsController], providers: [FormsService], exports: [FormsService] })
export class FormsModule {}
