import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { LEGAL_DOCUMENTS } from './legal-documents';

@Injectable()
export class LegalService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  documents() {
    return Object.values(LEGAL_DOCUMENTS);
  }

  async status(userId: string) {
    const userTerms = LEGAL_DOCUMENTS.USER_TERMS;
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
    const [accepted, organizationAcceptances, consentRecords] = await Promise.all([
      this.prisma.legalAcceptance.findFirst({
        where: { userId, organizationId: null, documentKey: userTerms.key, documentVersion: userTerms.version, withdrawnAt: null },
        select: { acceptedAt: true },
      }),
      this.prisma.legalAcceptance.findMany({
        where: { userId, organizationId: { not: null }, documentKey: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.key, withdrawnAt: null },
        select: { organizationId: true, documentVersion: true, acceptedAt: true, representativeRole: true },
        orderBy: { acceptedAt: 'desc' },
      }),
      this.prisma.consentRecord.findMany({
        where: { registration: { OR: [{ userId }, { email: user.email }] } },
        select: {
          id: true, status: true, createdAt: true,
          consentVersion: { select: { version: true, text: true, definition: { select: { title: true } } } },
          registration: { select: { event: { select: { title: true, organization: { select: { name: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      userTermsAccepted: Boolean(accepted),
      requiredVersion: userTerms.version,
      acceptedAt: accepted?.acceptedAt ?? null,
      organizationAcceptances,
      consentRecords: consentRecords.map(record => ({
        id: record.id,
        title: record.consentVersion.definition.title,
        text: record.consentVersion.text,
        version: record.consentVersion.version,
        status: record.status,
        acceptedAt: record.createdAt,
        eventName: record.registration.event.title,
        organizationName: record.registration.event.organization.name,
      })),
    };
  }

  async acceptUserTerms(userId: string, version: string) {
    const document = LEGAL_DOCUMENTS.USER_TERMS;
    if (version !== document.version) throw new BadRequestException('Güncel kullanıcı sözleşmesi kabul edilmelidir.');
    const existing = await this.prisma.legalAcceptance.findFirst({ where: { userId, organizationId: null, documentKey: document.key, documentVersion: document.version } });
    return existing
      ? this.prisma.legalAcceptance.update({ where: { id: existing.id }, data: { withdrawnAt: null, acceptedAt: new Date() } })
      : this.prisma.legalAcceptance.create({ data: { userId, documentKey: document.key, documentVersion: document.version } });
  }

  async acceptOrganizationTerms(userId: string, organizationId: string, version: string, representativeRole: string, authorityDeclared: boolean) {
    if (!authorityDeclared) throw new BadRequestException('Kurum adına yetki beyanı zorunludur.');
    if (version !== LEGAL_DOCUMENTS.ORGANIZATION_TERMS.version) throw new BadRequestException('Güncel kurumsal sözleşme kabul edilmelidir.');
    const membership = await this.prisma.organizationMembership.findUnique({ where: { userId_organizationId: { userId, organizationId } } });
    if (!membership) throw new NotFoundException('Kurum üyeliği bulunamadı.');
    return this.prisma.legalAcceptance.upsert({
      where: { userId_organizationId_documentKey_documentVersion: { userId, organizationId, documentKey: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.key, documentVersion: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.version } },
      create: { userId, organizationId, documentKey: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.key, documentVersion: LEGAL_DOCUMENTS.ORGANIZATION_TERMS.version, representativeRole: representativeRole.trim(), authorityDeclared: true },
      update: { withdrawnAt: null, acceptedAt: new Date(), representativeRole: representativeRole.trim(), authorityDeclared: true },
    });
  }

  async withdrawConsent(userId: string, consentRecordId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
    const record = await this.prisma.consentRecord.findFirst({
      where: { id: consentRecordId, registration: { OR: [{ userId }, { email: user.email }] } },
      select: { id: true },
    });
    if (!record) throw new NotFoundException('Onam kaydı bulunamadı.');
    return this.prisma.consentRecord.update({ where: { id: record.id }, data: { status: 'WITHDRAWN' } });
  }
}
