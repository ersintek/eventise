import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OrganizationAccessService } from './organization-access.service';

describe('OrganizationAccessService', () => {
  it('hides organizations outside the current tenant', async () => {
    const prisma = { organizationMembership: { findUnique: vi.fn().mockResolvedValue(null) } };
    const service = new OrganizationAccessService(prisma as never);
    await expect(service.requireMembership('user-a', 'organization-b')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rejects a role that cannot perform the operation', async () => {
    const prisma = { organizationMembership: { findUnique: vi.fn().mockResolvedValue({ role: 'FIELD_STAFF', organization: { status: 'ACTIVE' } }) } };
    const service = new OrganizationAccessService(prisma as never);
    await expect(service.requireMembership('user-a', 'organization-a', ['ORGANIZATION_ADMIN'])).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('returns a valid scoped membership', async () => {
    const membership = { role: 'EVENT_MANAGER', organization: { status: 'ACTIVE' } };
    const prisma = { organizationMembership: { findUnique: vi.fn().mockResolvedValue(membership) } };
    const service = new OrganizationAccessService(prisma as never);
    await expect(service.requireMembership('user-a', 'organization-a', ['EVENT_MANAGER'])).resolves.toBe(membership);
  });
});
