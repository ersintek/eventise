import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { FeaturesModule } from '../features/features.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
@Module({ imports: [OrganizationsModule, FeaturesModule], controllers: [GroupsController], providers: [GroupsService] })
export class GroupsModule {}
