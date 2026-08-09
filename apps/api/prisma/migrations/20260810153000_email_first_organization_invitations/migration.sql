ALTER TABLE "OrganizationInvitation"
ALTER COLUMN "userId" DROP NOT NULL;

CREATE INDEX "OrganizationInvitation_email_acceptedAt_cancelledAt_expiresAt_idx"
ON "OrganizationInvitation"("email", "acceptedAt", "cancelledAt", "expiresAt");
