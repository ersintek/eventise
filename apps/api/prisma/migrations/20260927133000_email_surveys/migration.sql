CREATE TABLE "EmailSurvey" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "questions" JSONB NOT NULL,
  "open" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailSurvey_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailSurveyInvitation" (
  "id" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "registrationId" TEXT,
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "isTest" BOOLEAN NOT NULL DEFAULT false,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailSurveyInvitation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailSurveyResponse" (
  "id" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "invitationId" TEXT NOT NULL,
  "registrationId" TEXT,
  "answers" JSONB NOT NULL,
  "isTest" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailSurveyResponse_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ScheduledNotification" ADD COLUMN "surveyId" TEXT;
CREATE UNIQUE INDEX "EmailSurveyInvitation_tokenHash_key" ON "EmailSurveyInvitation"("tokenHash");
CREATE UNIQUE INDEX "EmailSurveyResponse_invitationId_key" ON "EmailSurveyResponse"("invitationId");
CREATE UNIQUE INDEX "EmailSurveyResponse_surveyId_registrationId_key" ON "EmailSurveyResponse"("surveyId", "registrationId");
CREATE INDEX "EmailSurvey_eventId_open_idx" ON "EmailSurvey"("eventId", "open");
CREATE INDEX "EmailSurveyInvitation_surveyId_registrationId_idx" ON "EmailSurveyInvitation"("surveyId", "registrationId");
CREATE INDEX "EmailSurveyResponse_surveyId_isTest_submittedAt_idx" ON "EmailSurveyResponse"("surveyId", "isTest", "submittedAt");
CREATE INDEX "ScheduledNotification_surveyId_idx" ON "ScheduledNotification"("surveyId");
ALTER TABLE "EmailSurvey" ADD CONSTRAINT "EmailSurvey_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSurveyInvitation" ADD CONSTRAINT "EmailSurveyInvitation_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "EmailSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSurveyInvitation" ADD CONSTRAINT "EmailSurveyInvitation_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSurveyResponse" ADD CONSTRAINT "EmailSurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "EmailSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSurveyResponse" ADD CONSTRAINT "EmailSurveyResponse_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "EmailSurveyInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSurveyResponse" ADD CONSTRAINT "EmailSurveyResponse_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "EmailSurvey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
