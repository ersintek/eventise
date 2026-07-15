import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { ActivitiesService } from './activities.service';
class CreateDto { @IsOptional() @IsString() title?: string; @IsOptional() @IsString() prompt?: string }
class ResponseDto { @IsString() promptKey!: string; @IsString() @MaxLength(1000) answer!: string }
@Controller()
export class ActivitiesController {
  constructor(@Inject(ActivitiesService) private activities: ActivitiesService) {}
  @Public() @Get('activities/definitions') definitions() { return this.activities.definitions(); }
  @Get('organizations/:organizationId/events/:eventId/games') list(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string) { return this.activities.list(u.id, o, e); }
  @Post('organizations/:organizationId/events/:eventId/games') create(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: CreateDto) { return this.activities.create(u.id, o, e, d.title, d.prompt); }
  @Post('organizations/:organizationId/game-sessions/:id/open') open(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('id') id: string) { return this.activities.open(u.id, o, id); }
  @Post('organizations/:organizationId/game-sessions/:id/reveal') reveal(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('id') id: string) { return this.activities.setStatus(u.id, o, id, 'REVEAL'); }
  @Post('organizations/:organizationId/game-sessions/:id/complete') complete(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('id') id: string) { return this.activities.setStatus(u.id, o, id, 'COMPLETED'); }
  @Get('game-sessions/:id/assignment') assignment(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string) { return this.activities.myAssignment(u.id, id); }
  @Get('game-sessions/:id/reveal') revealed(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string) { return this.activities.revealedAnswer(u.id, id); }
  @Post('game-sessions/:id/responses') respond(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string, @Body() d: ResponseDto) { return this.activities.respond(u.id, id, d.promptKey, d.answer); }
}
