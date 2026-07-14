import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.tier.upsert({
    where: { key: 'tier-1' }, update: {},
    create: { key: 'tier-1', name: 'Tier 1', maxActiveEvents: 20, maxParticipantsPerEvent: 500, photoStorageLimitBytes: 1_073_741_824n, fileStorageLimitBytes: 1_073_741_824n, maxPhotosPerEvent: 50, defaultMaxPhotosPerParticipant: 5, emailMultiplier: 3, allowedFileTypes: ['PDF','DOC','DOCX','XLS','XLSX','LINK'], featureFlags: { doorRegistration: true, basicSpamProtection: true } },
  });
}
main().finally(() => prisma.$disconnect());
