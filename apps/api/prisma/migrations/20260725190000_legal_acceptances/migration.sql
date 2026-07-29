ALTER TABLE "Organization"
ADD COLUMN "organizationType" TEXT NOT NULL DEFAULT 'DERNEK';

CREATE TABLE "LegalAcceptance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT,
  "documentKey" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "representativeRole" TEXT,
  "authorityDeclared" BOOLEAN NOT NULL DEFAULT false,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "withdrawnAt" TIMESTAMP(3),
  CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalAcceptance_userId_organizationId_documentKey_documentVersion_key"
ON "LegalAcceptance"("userId", "organizationId", "documentKey", "documentVersion");
CREATE INDEX "LegalAcceptance_userId_documentKey_withdrawnAt_idx"
ON "LegalAcceptance"("userId", "documentKey", "withdrawnAt");
CREATE INDEX "LegalAcceptance_organizationId_documentKey_withdrawnAt_idx"
ON "LegalAcceptance"("organizationId", "documentKey", "withdrawnAt");

ALTER TABLE "LegalAcceptance"
ADD CONSTRAINT "LegalAcceptance_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalAcceptance"
ADD CONSTRAINT "LegalAcceptance_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
