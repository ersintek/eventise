import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.tier.upsert({
    where: { key: 'tier-1' }, update: {},
    create: { key: 'tier-1', name: 'Tier 1', maxActiveEvents: 20, maxParticipantsPerEvent: 500, photoStorageLimitBytes: 1_073_741_824n, fileStorageLimitBytes: 1_073_741_824n, maxPhotosPerEvent: 50, defaultMaxPhotosPerParticipant: 5, emailMultiplier: 3, allowedFileTypes: ['PDF','DOC','DOCX','XLS','XLSX','LINK'], featureFlags: { doorRegistration: true, basicSpamProtection: true } },
  });
  await prisma.tier.upsert({
    where: { key: 'tier-2' }, update: {},
    create: { key: 'tier-2', name: 'Tier 2', maxActiveEvents: 75, maxParticipantsPerEvent: 2000, photoStorageLimitBytes: 5_368_709_120n, fileStorageLimitBytes: 10_737_418_240n, maxPhotosPerEvent: 250, defaultMaxPhotosPerParticipant: 10, emailMultiplier: 5, allowedFileTypes: ['PDF','DOC','DOCX','XLS','XLSX','LINK'], featureFlags: { doorRegistration: true, basicSpamProtection: true, advancedReports: true } },
  });
  await prisma.tier.upsert({
    where: { key: 'tier-3' }, update: {},
    create: { key: 'tier-3', name: 'Tier 3', maxActiveEvents: 250, maxParticipantsPerEvent: 10000, photoStorageLimitBytes: 21_474_836_480n, fileStorageLimitBytes: 53_687_091_200n, maxPhotosPerEvent: 1000, defaultMaxPhotosPerParticipant: 20, emailMultiplier: 10, allowedFileTypes: ['PDF','DOC','DOCX','XLS','XLSX','LINK'], featureFlags: { doorRegistration: true, basicSpamProtection: true, advancedReports: true, prioritySupport: true } },
  });
}
main().finally(() => prisma.$disconnect());
