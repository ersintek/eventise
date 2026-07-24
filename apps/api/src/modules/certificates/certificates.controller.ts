import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { CertificatesService } from './certificates.service';

class TemplateDto {
  @IsString() name!: string;
  @IsString() bodyTemplate!: string;
  @IsOptional() @IsString() primaryColor?: string | null;
  @IsOptional() @IsString() signatureLabel?: string | null;
  @IsOptional() @IsBoolean() includeQr?: boolean;
  @IsOptional() @IsString() orientation?: string;
  @IsOptional() @IsString() backgroundAssetId?: string | null;
}
class UpdateTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bodyTemplate?: string;
  @IsOptional() @IsString() primaryColor?: string | null;
  @IsOptional() @IsString() signatureLabel?: string | null;
  @IsOptional() @IsBoolean() includeQr?: boolean;
  @IsOptional() @IsString() orientation?: string;
  @IsOptional() @IsString() backgroundAssetId?: string | null;
}
class BackgroundUploadDto {
  @IsString() name!: string;
  @IsString() contentType!: string;
  @IsString() sizeBytes!: string; // FormData'dan string gelir, number'a çevrilir
}
class IssueDto { @IsString() templateId!: string; }
class ConfirmBackgroundDto { @IsString() assetId!: string; }

@Controller()
export class CertificatesController {
  constructor(@Inject(CertificatesService) private c: CertificatesService) {}

  @Post('organizations/:organizationId/events/:eventId/certificate-templates')
  template(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: TemplateDto) {
    return this.c.createTemplate(u.id, o, e, d.name, d.bodyTemplate, { primaryColor: d.primaryColor, signatureLabel: d.signatureLabel, includeQr: d.includeQr, orientation: d.orientation, backgroundAssetId: d.backgroundAssetId });
  }

  @Post('organizations/:organizationId/events/:eventId/certificate-templates/:templateId')
  updateTemplate(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Param('templateId') t: string, @Body() d: UpdateTemplateDto) {
    return this.c.updateTemplate(u.id, o, e, t, d);
  }

  @Post('organizations/:organizationId/events/:eventId/certificate-backgrounds/upload')
  requestBackground(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: BackgroundUploadDto) {
    return this.c.requestBackgroundUpload(u.id, o, e, d.name, d.contentType, Number(d.sizeBytes));
  }

  @Post('organizations/:organizationId/certificate-backgrounds/confirm')
  confirmBackground(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Body() d: ConfirmBackgroundDto) {
    return this.c.confirmBackgroundUpload(u.id, o, d.assetId);
  }

  @Post('organizations/:organizationId/events/:eventId/certificates')
  issue(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: IssueDto) { return this.c.issue(u.id, o, e, d.templateId); }

  @Get('participant/certificates')
  mine(@CurrentUser() u: AuthenticatedUser) { return this.c.mine(u.id); }

  @Public()
  @Get('certificates/verify/:code')
  verify(@Param('code') code: string) { return this.c.verify(code); }
}
