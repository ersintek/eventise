import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { RegistrationApplicationStatus } from '@prisma/client';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsObject, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { AccountSetupService } from '../identity/account-setup.service';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { InvitationsService } from './invitations.service';
import { RegistrationsService } from './registrations.service';

class SubmitDto { @IsEmail() @MaxLength(254) email!: string; @IsString() @Length(2, 100) firstName!: string; @IsString() @Length(2, 100) lastName!: string; @IsObject() answers!: object; @IsOptional() @IsString() formVersionId?: string; @IsOptional() @IsArray() @IsString({ each: true }) consentVersionIds?: string[]; @IsOptional() @IsBoolean() createAccount?: boolean }
class DecisionDto { @IsEnum(RegistrationApplicationStatus) status!: RegistrationApplicationStatus; @IsOptional() @IsString() reason?: string }
class InviteDto { @IsEmail() email!: string }

@Controller()
export class RegistrationsController {
  constructor(@Inject(RegistrationsService) private registrations: RegistrationsService, @Inject(AccountSetupService) private accounts: AccountSetupService, @Inject(InvitationsService) private invitations: InvitationsService) {}
  @Public() @Post('public/events/:orgSlug/:eventSlug/registrations') async submit(@Param('orgSlug') o: string, @Param('eventSlug') e: string, @Body() d: SubmitDto) { await this.invitations.assertPublic(o, e); const result = await this.registrations.submit(o, e, { ...d, consentVersionIds: d.consentVersionIds ?? [] }); if (d.createAccount !== false) await this.accounts.request(d.email, d.firstName, d.lastName); return result; }
  @Post('organizations/:organizationId/events/:eventId/invitations') invite(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: InviteDto) { return this.invitations.invite(u.id, o, e, d.email); }
  @Post('participant/events/:eventId/accept-invitation') async accept(@CurrentUser() u: AuthenticatedUser, @Param('eventId') eventId: string) { const { invitation, user } = await this.invitations.accept(u.id, eventId); return this.registrations.submit(invitation.event.organization.slug, invitation.event.slug, { email: user.email, firstName: user.firstName, lastName: user.lastName, answers: { source: 'invitation' }, consentVersionIds: [] }); }
  @Get('organizations/:organizationId/events/:eventId/registrations') list(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string) { return this.registrations.list(u.id, o, e); }
  @Patch('organizations/:organizationId/registrations/:id/decision') decide(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('id') id: string, @Body() d: DecisionDto) { return this.registrations.decide(u.id, o, id, d.status, d.reason ?? ''); }
}
