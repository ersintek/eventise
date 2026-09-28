import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { EmailSurveyQuestion, EmailSurveysService } from './email-surveys.service';

class CreateSurveyDto { @IsString() @MaxLength(160) title!: string; @IsArray() questions!: EmailSurveyQuestion[]; }
class UpdateSurveyDto { @IsOptional() @IsString() @MaxLength(160) title?: string; @IsOptional() @IsArray() questions?: EmailSurveyQuestion[]; @IsOptional() @IsBoolean() open?: boolean; }
class SubmitSurveyDto { @IsObject() answers!: Record<string, unknown>; }
@Controller()
export class EmailSurveysController {
  constructor(@Inject(EmailSurveysService) private surveys: EmailSurveysService) {}
  @Get('organizations/:organizationId/events/:eventId/email-surveys') list(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string) { return this.surveys.list(user.id, organizationId, eventId); }
  @Post('organizations/:organizationId/events/:eventId/email-surveys') create(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Body() data: CreateSurveyDto) { return this.surveys.create(user.id, organizationId, eventId, data.title, data.questions); }
  @Patch('organizations/:organizationId/events/:eventId/email-surveys/:surveyId') update(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Param('surveyId') surveyId: string, @Body() data: UpdateSurveyDto) { return this.surveys.update(user.id, organizationId, eventId, surveyId, data); }
  @Post('organizations/:organizationId/events/:eventId/email-surveys/:surveyId/copy') copy(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Param('surveyId') surveyId: string) { return this.surveys.copy(user.id, organizationId, eventId, surveyId); }
  @Get('organizations/:organizationId/events/:eventId/email-surveys/:surveyId/results') results(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Param('surveyId') surveyId: string) { return this.surveys.results(user.id, organizationId, eventId, surveyId); }
  @Public() @Get('public/surveys/:token') getPublic(@Param('token') token: string) { return this.surveys.publicSurvey(token); }
  @Public() @Post('public/surveys/:token/responses') submit(@Param('token') token: string, @Body() data: SubmitSurveyDto) { return this.surveys.submit(token, data.answers); }
}
