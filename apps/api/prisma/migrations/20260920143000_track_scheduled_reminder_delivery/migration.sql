ALTER TYPE "ScheduledNotificationStatus" ADD VALUE IF NOT EXISTS 'SENT';

ALTER TABLE "EmailMessage"
  ADD COLUMN "scheduledNotificationId" TEXT;

ALTER TABLE "EmailMessage"
  ADD CONSTRAINT "EmailMessage_scheduledNotificationId_fkey"
  FOREIGN KEY ("scheduledNotificationId") REFERENCES "ScheduledNotification"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "EmailMessage_scheduledNotificationId_idx" ON "EmailMessage"("scheduledNotificationId");
