import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';
class MemberDto { @IsEmail() email!:string; @IsEnum(['ORGANIZATION_ADMIN','EVENT_MANAGER','FIELD_STAFF']) role!:'ORGANIZATION_ADMIN'|'EVENT_MANAGER'|'FIELD_STAFF'; } class AssignmentDto { @IsString() membershipId!:string; }
class MemberRoleDto { @IsEnum(['ORGANIZATION_ADMIN','EVENT_MANAGER','FIELD_STAFF']) role!:'ORGANIZATION_ADMIN'|'EVENT_MANAGER'|'FIELD_STAFF'; }
class ReviewJoinRequestDto { @IsBoolean() approved!: boolean; }
class UpdateOrganizationDto{@IsString()name!:string;@IsOptional()@IsString()description?:string;@IsEmail()contactEmail!:string;@IsOptional()@IsUrl({protocols:['http','https'],require_protocol:true})website?:string}

@ApiTags('organization-access') @ApiBearerAuth() @Controller('organization-access')
export class OrganizationAccessController {
  constructor(@Inject(OrganizationsService) private readonly organizations: OrganizationsService) {}
  @Get() status(@CurrentUser() user: AuthenticatedUser) { return this.organizations.getAccessStatus(user.id); }
  @Post('invitations/:invitationId/accept') accept(@CurrentUser() user: AuthenticatedUser, @Param('invitationId') invitationId: string) {
    return this.organizations.acceptInvitation(user.id, invitationId);
  }
}

@ApiTags('organizations') @ApiBearerAuth() @Controller('organizations')
export class OrganizationsController {
  constructor(@Inject(OrganizationsService) private readonly organizations: OrganizationsService) {}
  @Post() create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) { return this.organizations.create(user.id, dto); }
  @Get() list(@CurrentUser() user: AuthenticatedUser) { return this.organizations.listForUser(user.id); }
  @Get(':organizationId') get(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') id: string) { return this.organizations.get(user.id, id); }
  @Patch(':organizationId') update(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Body()d:UpdateOrganizationDto){return this.organizations.update(u.id,o,d)}
  @Get(':organizationId/members') members(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string){return this.organizations.listMembers(u.id,o)}
  @Post(':organizationId/members') addMember(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Body()d:MemberDto){return this.organizations.addMember(u.id,o,d.email,d.role)}
  @Patch(':organizationId/members/:membershipId') updateMember(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Param('membershipId')m:string,@Body()d:MemberRoleDto){return this.organizations.updateMemberRole(u.id,o,m,d.role)}
  @Get(':organizationId/invitations') invitations(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string){return this.organizations.listInvitations(u.id,o)}
  @Post(':organizationId/invitations/:invitationId/resend') resendInvitation(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Param('invitationId')i:string){return this.organizations.resendInvitation(u.id,o,i)}
  @Delete(':organizationId/invitations/:invitationId') cancelInvitation(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Param('invitationId')i:string){return this.organizations.cancelInvitation(u.id,o,i)}
  @Post(':organizationId/join-requests') requestJoin(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string){return this.organizations.requestJoin(u.id,o)}
  @Get(':organizationId/join-requests') joinRequests(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string){return this.organizations.listJoinRequests(u.id,o)}
  @Patch(':organizationId/join-requests/:requestId') reviewJoinRequest(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Param('requestId')r:string,@Body()d:ReviewJoinRequestDto){return this.organizations.reviewJoinRequest(u.id,o,r,d.approved)}
  @Delete(':organizationId/members/:membershipId') removeMember(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Param('membershipId')m:string){return this.organizations.removeMember(u.id,o,m)}
  @Put(':organizationId/events/:eventId/staff') assign(@CurrentUser()u:AuthenticatedUser,@Param('organizationId')o:string,@Param('eventId')e:string,@Body()d:AssignmentDto){return this.organizations.assignToEvent(u.id,o,e,d.membershipId)}
}
