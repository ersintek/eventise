import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { NotificationsService } from './notifications.service';

class BroadcastDto { @IsString() @MaxLength(160) title!: string; @IsString() @MaxLength(2000) body!: string; @IsOptional() @IsIn(['ACCEPTED', 'ALL', 'CHECKED_IN']) audience?: string; }

@Controller()
export class NotificationsController {
  constructor(@Inject(NotificationsService) private notifications: NotificationsService) {}
  @Post('organizations/:organizationId/events/:eventId/notifications') broadcast(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Body() data: BroadcastDto) { return this.notifications.broadcast(user.id, organizationId, eventId, data.title, data.body, data.audience); }
  @Get('organizations/:organizationId/events/:eventId/notifications/audience') audience(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Query('audience') audience?: string) { return this.notifications.audiencePreview(user.id, organizationId, eventId, audience); }
  @Get('organizations/:organizationId/events/:eventId/notifications/sent') sentList(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string) { return this.notifications.sentList(user.id, organizationId, eventId); }
  @Get('notifications') list(@CurrentUser() user: AuthenticatedUser) { return this.notifications.list(user.id); }
  @Patch('notifications/:id/read') read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.notifications.read(user.id, id); }
}
