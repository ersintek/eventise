import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/persistence/prisma.service';

export interface AuditEntry { organizationId?: string; actorId?: string; action: string; resourceType: string; resourceId?: string; metadata?: Record<string, unknown>; ipHash?: string; }
@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  record(entry: AuditEntry) { return this.prisma.auditLog.create({ data: { ...entry, metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue } }); }
}
