import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';

@Injectable()
export class OrganizationAccessService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async requireMembership(userId: string, organizationId: string, roles?: OrganizationRole[]) {
    const membership = await this.prisma.organizationMembership.findUnique({ where: { userId_organizationId: { userId, organizationId } }, include: { organization: true } });
    if (!membership || membership.organization.status !== 'ACTIVE') throw new NotFoundException('Kurum bulunamadı.');
    if (roles && !roles.includes(membership.role)) throw new ForbiddenException('Bu işlem için kurum yetkiniz yok.');
    return membership;
  }
  async requireEventAccess(userId:string,organizationId:string,eventId:string,roles?:OrganizationRole[]){const membership=await this.requireMembership(userId,organizationId,roles);const event=await this.prisma.event.findFirst({where:{id:eventId,organizationId},select:{id:true}});if(!event)throw new NotFoundException('Etkinlik bulunamadı.');if(membership.role!=='ORGANIZATION_ADMIN'){const assignment=await this.prisma.eventStaffAssignment.findUnique({where:{eventId_membershipId:{eventId,membershipId:membership.id}}});if(!assignment)throw new NotFoundException('Etkinlik bulunamadı.')}return membership}
}
