import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SupportReportsController } from './support-reports.controller';
import { SupportReportsService } from './support-reports.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [SupportReportsController],
  providers: [SupportReportsService],
})
export class SupportReportsModule {}
