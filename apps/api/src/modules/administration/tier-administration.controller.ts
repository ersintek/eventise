import { Body, Controller, Delete, Inject, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { IsArray, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { SystemAdminGuard } from './system-admin.guard';
import { TierAdministrationService, TierInput } from './tier-administration.service';

class TierDto implements TierInput {
  @IsString() key!: string; @IsString() name!: string; @IsInt() @Min(1) maxActiveEvents!: number; @IsInt() @Min(1) maxParticipantsPerEvent!: number;
  @IsString() photoStorageLimitBytes!: string; @IsString() fileStorageLimitBytes!: string; @IsInt() @Min(1) maxPhotosPerEvent!: number;
  @IsInt() @Min(1) defaultMaxPhotosPerParticipant!: number; @IsInt() @Min(1) emailMultiplier!: number;
  @IsArray() @IsString({ each: true }) allowedFileTypes!: string[]; @IsObject() featureFlags!: Record<string, boolean>;
}
class OverrideDto { @IsObject() limits!: object; @IsString() reason!: string; @IsOptional() @IsString() expiresAt?: string; }

@UseGuards(SystemAdminGuard)
@Controller('admin')
export class TierAdministrationController {
  constructor(@Inject(TierAdministrationService) private service: TierAdministrationService) {}
  @Post('tiers') create(@CurrentUser() u: AuthenticatedUser, @Body() d: TierDto) { return this.service.create(u.id, d); }
  @Patch('tiers/:tierId') update(@CurrentUser() u: AuthenticatedUser, @Param('tierId') id: string, @Body() d: TierDto) { return this.service.update(u.id, id, d); }
  @Delete('tiers/:tierId') remove(@CurrentUser() u: AuthenticatedUser, @Param('tierId') id: string) { return this.service.remove(u.id, id); }
  @Put('organizations/:organizationId/tier-override') override(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Body() d: OverrideDto) { return this.service.override(u.id, o, d); }
}
