-- ScheduledNotificationStatus: FAILED eklendi
ALTER TYPE "ScheduledNotificationStatus" ADD VALUE IF NOT EXISTS 'FAILED';

-- AlterTable: ScheduledNotification failureReason
ALTER TABLE "ScheduledNotification" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;

-- AlterTable: CertificateTemplate tasarım alanları
ALTER TABLE "CertificateTemplate" ADD COLUMN IF NOT EXISTS "backgroundAssetId" TEXT,
ADD COLUMN IF NOT EXISTS "primaryColor" TEXT,
ADD COLUMN IF NOT EXISTS "signatureLabel" TEXT,
ADD COLUMN IF NOT EXISTS "includeQr" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "orientation" TEXT NOT NULL DEFAULT 'LANDSCAPE';

-- AddForeignKey: CertificateTemplate.backgroundAssetId -> MediaAsset.id (SetNull)
ALTER TABLE "CertificateTemplate"
ADD CONSTRAINT "CertificateTemplate_backgroundAssetId_fkey"
FOREIGN KEY ("backgroundAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
