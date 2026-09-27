ALTER TABLE "ScheduledNotification" ADD COLUMN "recipientCount" INTEGER;
ALTER TABLE "EmailMessage" ADD COLUMN "deliveryKey" TEXT;
CREATE UNIQUE INDEX "EmailMessage_deliveryKey_key" ON "EmailMessage"("deliveryKey");
