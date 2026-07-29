import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { IsBoolean, IsString, MinLength } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { Public } from '../identity/policies/public.decorator';
import { LegalService } from './legal.service';

class UserAcceptanceDto { @IsString() version!: string; }
class OrganizationAcceptanceDto {
  @IsString() organizationId!: string;
  @IsString() version!: string;
  @IsString() @MinLength(2) representativeRole!: string;
  @IsBoolean() authorityDeclared!: boolean;
}

@Controller('legal')
export class LegalController {
  constructor(@Inject(LegalService) private legal: LegalService) {}
  @Public() @Get('documents') documents() { return this.legal.documents(); }
  @Get('status') status(@CurrentUser() user: AuthenticatedUser) { return this.legal.status(user.id); }
  @Post('accept-user-terms') acceptUser(@CurrentUser() user: AuthenticatedUser, @Body() dto: UserAcceptanceDto) { return this.legal.acceptUserTerms(user.id, dto.version); }
  @Post('accept-organization-terms') acceptOrganization(@CurrentUser() user: AuthenticatedUser, @Body() dto: OrganizationAcceptanceDto) {
    return this.legal.acceptOrganizationTerms(user.id, dto.organizationId, dto.version, dto.representativeRole, dto.authorityDeclared);
  }
  @Post('consents/:consentRecordId/withdraw') withdrawConsent(@CurrentUser() user: AuthenticatedUser, @Param('consentRecordId') id: string) {
    return this.legal.withdrawConsent(user.id, id);
  }
}
