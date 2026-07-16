-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "onlineLink" TEXT,
ADD COLUMN "format" "EventFormat" NOT NULL DEFAULT 'OFFLINE';
