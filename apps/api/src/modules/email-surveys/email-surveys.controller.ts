import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { IsArray, IsObject, IsString, MaxLength } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { EmailSurveyQuestion, EmailSurveysService } from './email-surveys.service';

class CreateSurveyDto { @IsString() @MaxLength(160) title!: string; @IsArray() questions!: EmailSurveyQuestion[]; }
class SubmitSurveyDto { @IsObject() answers!: Record<string, unknown>; }
@Controller()
export class EmailSurveysController {
  constructor(@Inject(EmailSurveysService) private surveys: EmailSurveysService) {}
  @Get('organizations/:organizationId/events/:eventId/email-surveys') list(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string) { return this.surveys.list(user.id, organizationId, eventId); }
  @Post('organizations/:organizationId/events/:eventId/email-surveys') create(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Body() data: CreateSurveyDto) { return this.surveys.create(user.id, organizationId, eventId, data.title, data.questions); }
  @Public() @Get('public/surveys/:token') getPublic(@Param('token') token: string) { return this.surveys.publicSurvey(token); }
  @Public() @Post('public/surveys/:token/responses') submit(@Param('token') token: string, @Body() data: SubmitSurveyDto) { return this.surveys.submit(token, data.answers); }
}
