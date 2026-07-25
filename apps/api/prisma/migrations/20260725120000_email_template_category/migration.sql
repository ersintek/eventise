-- E-posta şablonlarını durum bildirimleri ve zamanlanabilir hatırlatmalar olarak ayırır.
ALTER TABLE "EmailTemplate"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'NOTIFICATION';

UPDATE "EmailTemplate"
SET "category" = 'REMINDER'
WHERE "key" IN ('reminder_1', 'reminder_2');
