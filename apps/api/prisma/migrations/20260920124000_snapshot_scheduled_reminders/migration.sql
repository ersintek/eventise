-- Planlanmış hatırlatmalar, şablon sonradan değişse bile planlandıkları metni korur.
ALTER TABLE "ScheduledNotification"
  ADD COLUMN "subject" TEXT,
  ADD COLUMN "body" TEXT;
