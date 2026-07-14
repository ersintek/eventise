-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_CONFIRMED', 'CHECKED_IN', 'NO_SHOW', 'MANUALLY_CONFIRMED');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('ACCOUNT', 'MAGIC_LINK', 'DOOR_REGISTRATION', 'STAFF_MANUAL');

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "EventCheckInAccess" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCheckInAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFeatureSetting" (
    "eventId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFeatureSetting_pkey" PRIMARY KEY ("eventId","featureKey")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'NOT_CONFIRMED',
    "method" "CheckInMethod",
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInAttempt" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT,
    "method" "CheckInMethod" NOT NULL,
    "successful" BOOLEAN NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestAccessToken" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCheckInAccess_eventId_key" ON "EventCheckInAccess"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCheckInAccess_publicToken_key" ON "EventCheckInAccess"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_registrationId_key" ON "AttendanceRecord"("registrationId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_eventId_status_idx" ON "AttendanceRecord"("eventId", "status");

-- CreateIndex
CREATE INDEX "CheckInAttempt_eventId_createdAt_idx" ON "CheckInAttempt"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuestAccessToken_tokenHash_key" ON "GuestAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "GuestAccessToken_eventId_expiresAt_idx" ON "GuestAccessToken"("eventId", "expiresAt");

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCheckInAccess" ADD CONSTRAINT "EventCheckInAccess_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeatureSetting" ADD CONSTRAINT "EventFeatureSetting_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInAttempt" ADD CONSTRAINT "CheckInAttempt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInAttempt" ADD CONSTRAINT "CheckInAttempt_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestAccessToken" ADD CONSTRAINT "GuestAccessToken_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestAccessToken" ADD CONSTRAINT "GuestAccessToken_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
