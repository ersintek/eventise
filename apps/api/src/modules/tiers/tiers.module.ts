import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TiersController } from './tiers.controller';
import { TiersService } from './tiers.service';
@Module({ imports: [OrganizationsModule], controllers: [TiersController], providers: [TiersService], exports: [TiersService] }) export class TiersModule {}
