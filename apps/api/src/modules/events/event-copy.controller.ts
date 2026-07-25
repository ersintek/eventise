import { Body, Controller, Delete, Get, Inject, Param, Post } from '@nestjs/common';
import { IsDateString, IsString } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { EventCopyService } from './event-copy.service';

class CopyDto {
  @IsString() title!: string;
  @IsString() slug!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
}

@Controller()
export class EventCopyController {
  constructor(@Inject(EventCopyService) private service: EventCopyService) {}
  @Get('participant/history') history(@CurrentUser() user: AuthenticatedUser) { return this.service.history(user.id); }
  @Get('participant/follows') follows(@CurrentUser() user: AuthenticatedUser) { return this.service.follows(user.id); }
  @Get('participant/following-events') followingEvents(@CurrentUser() user: AuthenticatedUser) { return this.service.followingEvents(user.id); }
  @Post('participant/organizations/:organizationId/follow') follow(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string) { return this.service.follow(user.id, organizationId); }
  @Delete('participant/organizations/:organizationId/follow') unfollow(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string) { return this.service.unfollow(user.id, organizationId); }
  @Post('organizations/:organizationId/events/:eventId/copy') copy(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Body() dto: CopyDto) { return this.service.copy(user.id, organizationId, eventId, dto); }
}
