import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { IsBoolean, IsObject, IsString } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { FeedbackService } from './feedback.service';
class CreateDto { @IsString() title!: string; @IsObject() schema!: object }
class OpenDto { @IsBoolean() open!: boolean }
class SubmitDto { @IsObject() answers!: object; @IsBoolean() anonymous!: boolean }
@Controller()
export class FeedbackController {
  constructor(@Inject(FeedbackService) private feedback: FeedbackService) {}
  @Get('organizations/:organizationId/events/:eventId/feedback') list(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string) { return this.feedback.list(u.id, o, e); }
  @Post('organizations/:organizationId/events/:eventId/feedback') create(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: CreateDto) { return this.feedback.create(u.id, o, e, d.title, d.schema); }
  @Patch('organizations/:organizationId/feedback/:id/open') open(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('id') id: string, @Body() d: OpenDto) { return this.feedback.open(u.id, o, id, d.open); }
  @Post('participant/feedback/:id/submissions') submit(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string, @Body() d: SubmitDto) { return this.feedback.submit(u.id, id, d.answers, d.anonymous); }
  @Get('organizations/:organizationId/feedback/:id/results') results(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('id') id: string) { return this.feedback.results(u.id, o, id); }
}
