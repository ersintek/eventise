CREATE TABLE "EventInvitation" ("id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "email" TEXT NOT NULL, "invitedById" TEXT NOT NULL, "acceptedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "EventInvitation_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "EventInvitation_eventId_email_key" ON "EventInvitation"("eventId", "email");
ALTER TABLE "EventInvitation" ADD CONSTRAINT "EventInvitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
