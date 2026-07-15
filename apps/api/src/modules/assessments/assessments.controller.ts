import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { AssessmentKind } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsObject, IsString } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { AssessmentsService } from './assessments.service';
import { AssessmentQuestion } from './scoring';
class CreateDto { @IsEnum(AssessmentKind) kind!: AssessmentKind; @IsString() title!: string; @IsArray() questions!: AssessmentQuestion[] }
class CopyDto { @IsEnum(AssessmentKind) kind!: AssessmentKind; @IsString() title!: string }
class OpenDto { @IsBoolean() open!: boolean }
class SubmitDto { @IsObject() answers!: Record<string, unknown> }
@Controller()
export class AssessmentsController {
  constructor(@Inject(AssessmentsService) private assessments: AssessmentsService) {}
  @Get('organizations/:organizationId/events/:eventId/assessments') list(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string) { return this.assessments.list(u.id, o, e); }
  @Get('organizations/:organizationId/events/:eventId/assessments/comparison') comparison(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string) { return this.assessments.comparison(u.id, o, e); }
  @Post('organizations/:organizationId/events/:eventId/assessments') create(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: CreateDto) { return this.assessments.create(u.id, o, e, d.kind, d.title, d.questions); }
  @Post('organizations/:organizationId/assessments/:id/copy') copy(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('id') id: string, @Body() d: CopyDto) { return this.assessments.copy(u.id, o, id, d.kind, d.title); }
  @Patch('organizations/:organizationId/assessments/:id/open') open(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('id') id: string, @Body() d: OpenDto) { return this.assessments.setOpen(u.id, o, id, d.open); }
  @Get('participant/events/:eventId/assessments') available(@CurrentUser() u: AuthenticatedUser, @Param('eventId') e: string) { return this.assessments.available(u.id, e); }
  @Post('participant/assessments/:id/submissions') submit(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string, @Body() d: SubmitDto) { return this.assessments.submit(u.id, id, d.answers); }
}
