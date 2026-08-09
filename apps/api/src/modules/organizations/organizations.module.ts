import { Module } from '@nestjs/common';
import { OrganizationAccessController, OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationAccessService } from './policies/organization-access.service';
@Module({ controllers: [OrganizationsController, OrganizationAccessController], providers: [OrganizationsService, OrganizationAccessService], exports: [OrganizationsService, OrganizationAccessService] }) export class OrganizationsModule {}
