import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { TiersService } from './tiers.service';
@ApiTags('tiers') @ApiBearerAuth() @Controller('organizations/:organizationId/tier') export class TiersController { constructor(private readonly tiers: TiersService) {} @Get('limits') limits(@CurrentUser() user: AuthenticatedUser, @Param('organizationId') id: string) { return this.tiers.limitsFor(user.id, id); } }
