ALTER TABLE "MediaAsset" ADD COLUMN "quotaReservationId" TEXT;
CREATE UNIQUE INDEX "MediaAsset_quotaReservationId_key" ON "MediaAsset"("quotaReservationId");
