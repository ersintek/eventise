import { Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { IsBoolean, IsString, MinLength } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { ConsentsService } from './consents.service';

class ConsentDto { @IsString() key!: string; @IsString() title!: string; @IsString() text!: string }
class VersionDto { @IsString() text!: string }
class RequirementDto { @IsBoolean() required!: boolean }
class EventConsentDto { @IsString() @MinLength(20) text!: string }

@Controller()
export class ConsentsController {
  constructor(@Inject(ConsentsService) private consents: ConsentsService) {}

  @Post('organizations/:organizationId/consents')
  create(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Body() dto: ConsentDto) {
    return this.consents.create(user.id, organizationId, dto.key, dto.title, dto.text);
  }

  @Post('organizations/:organizationId/consents/:id/versions')
  version(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('id') id: string, @Body() dto: VersionDto) {
    return this.consents.addVersion(user.id, organizationId, id, dto.text);
  }

  @Put('organizations/:organizationId/events/:eventId/consent')
  saveEventConsent(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Body() dto: EventConsentDto) {
    return this.consents.saveForEvent(user.id, organizationId, eventId, dto.text);
  }

  @Put('organizations/:organizationId/events/:eventId/consents/:definitionId')
  requirement(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') organizationId: string, @Param('eventId') eventId: string, @Param('definitionId') definitionId: string, @Body() dto: RequirementDto) {
    return this.consents.requireForEvent(user.id, organizationId, eventId, definitionId, dto.required);
  }

  @Public()
  @Get('public/event-consents/:eventId')
  requirements(@Param('eventId') eventId: string) {
    return this.consents.publicRequirements(eventId);
  }
}
