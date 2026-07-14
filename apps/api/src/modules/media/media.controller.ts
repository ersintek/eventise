import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { PhotoModerationStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { MediaService } from './media.service';

class UploadDto { @IsString() name!: string; @IsString() contentType!: string; @IsInt() @Min(1) sizeBytes!: number }
class ConfirmDto { @IsString() assetId!: string; @IsString() reservationId!: string; @IsOptional() @IsString() caption?: string }
class ModerateDto { @IsEnum(PhotoModerationStatus) status!: PhotoModerationStatus }

@Controller()
export class MediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}
  @Post('participant/events/:eventId/photos/upload') upload(@CurrentUser() u: AuthenticatedUser, @Param('eventId') eventId: string, @Body() dto: UploadDto) { return this.media.requestPhotoUpload(u.id, eventId, dto.name, dto.contentType, dto.sizeBytes); }
  @Post('participant/events/:eventId/photos/confirm') confirm(@CurrentUser() u: AuthenticatedUser, @Param('eventId') eventId: string, @Body() dto: ConfirmDto) { return this.media.confirmPhoto(u.id, eventId, dto.assetId, dto.reservationId, dto.caption); }
  @Get('organizations/:organizationId/events/:eventId/photos') manage(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string) { return this.media.manage(u.id, organizationId, eventId); }
  @Patch('organizations/:organizationId/events/:eventId/photos/:photoId') moderate(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Param('photoId') photoId: string, @Body() dto: ModerateDto) { return this.media.moderate(u.id, organizationId, eventId, photoId, dto.status); }
  @Public() @Get('public/event-photos/:eventId') gallery(@Param('eventId') eventId: string) { return this.media.gallery(eventId); }
}
