import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { PrismaService } from '../../../shared/persistence/prisma.service';

@Injectable()
export class OrganizationAccessService {
  constructor(private readonly prisma: PrismaService) {}
  async requireMembership(userId: string, organizationId: string, roles?: OrganizationRole[]) {
    const membership = await this.prisma.organizationMembership.findUnique({ where: { userId_organizationId: { userId, organizationId } }, include: { organization: true } });
    if (!membership || membership.organization.status !== 'ACTIVE') throw new NotFoundException('Kurum bulunamadı.');
    if (roles && !roles.includes(membership.role)) throw new ForbiddenException('Bu işlem için kurum yetkiniz yok.');
    return membership;
  }
}
