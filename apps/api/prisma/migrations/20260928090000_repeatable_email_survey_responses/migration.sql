DROP INDEX "EmailSurveyResponse_invitationId_key";
DROP INDEX "EmailSurveyResponse_surveyId_registrationId_key";
CREATE INDEX "EmailSurveyResponse_surveyId_registrationId_submittedAt_idx" ON "EmailSurveyResponse"("surveyId", "registrationId", "submittedAt");
