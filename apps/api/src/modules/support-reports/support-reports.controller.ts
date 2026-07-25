import { Body, Controller, Inject, Post } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { SupportReportsService } from './support-reports.service';

class CreateSupportReportDto {
  @IsString() organizationId!: string;
  @IsString() @MinLength(5) @MaxLength(3000) description!: string;
  @IsString() @MinLength(1) @MaxLength(1000) page!: string;
}

@Controller('support-reports')
export class SupportReportsController {
  constructor(@Inject(SupportReportsService) private readonly reports: SupportReportsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupportReportDto) {
    return this.reports.create(user.id, dto.organizationId, dto.description, dto.page);
  }
}
