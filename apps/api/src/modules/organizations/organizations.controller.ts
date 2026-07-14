import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations') @ApiBearerAuth() @Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}
  @Post() create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) { return this.organizations.create(user.id, dto); }
  @Get() list(@CurrentUser() user: AuthenticatedUser) { return this.organizations.listForUser(user.id); }
  @Get(':organizationId') get(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') id: string) { return this.organizations.get(user.id, id); }
}
