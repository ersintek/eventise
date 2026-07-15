import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AuthenticatedUser, CurrentUser } from '../identity/policies/current-user.decorator';
import { GroupsService } from './groups.service';

class GenerateDto {
  @IsInt() @Min(1) count!: number;
  @IsEnum(['RANDOM', 'BALANCED']) strategy!: 'RANDOM' | 'BALANCED';
  @IsOptional() @IsString() balanceField?: string;
}
class ManualDto { @IsArray() groups!: string[][] }

@Controller('organizations/:organizationId/events/:eventId/groups')
export class GroupsController {
  constructor(@Inject(GroupsService) private groups: GroupsService) {}
  @Post('generate') generate(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: GenerateDto) { return this.groups.generate(u.id, o, e, d.count, d.strategy, d.balanceField ?? ''); }
  @Post('manual') manual(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string, @Body() d: ManualDto) { return this.groups.manual(u.id, o, e, d.groups); }
  @Get() list(@CurrentUser() u: AuthenticatedUser, @Param('organizationId') o: string, @Param('eventId') e: string) { return this.groups.list(u.id, o, e); }
}
