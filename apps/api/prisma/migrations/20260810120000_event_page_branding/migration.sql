-- Add durable visual identity fields for public event pages.
ALTER TABLE "Organization" ADD COLUMN "logoAssetId" TEXT;
ALTER TABLE "Event" ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#4F46E5';
ALTER TABLE "Event" ADD COLUMN "coverAssetId" TEXT;

CREATE UNIQUE INDEX "Organization_logoAssetId_key" ON "Organization"("logoAssetId");

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_logoAssetId_fkey"
  FOREIGN KEY ("logoAssetId") REFERENCES "MediaAsset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_coverAssetId_fkey"
  FOREIGN KEY ("coverAssetId") REFERENCES "MediaAsset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
