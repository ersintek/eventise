ALTER TABLE "Organization" ADD COLUMN "normalizedName" TEXT;

WITH normalized AS (
  SELECT
    "id",
    translate(lower(regexp_replace(trim("name"), '\s+', ' ', 'g')), 'çğıöşüâîûé', 'cgiosuaiue') AS base_name,
    row_number() OVER (
      PARTITION BY translate(lower(regexp_replace(trim("name"), '\s+', ' ', 'g')), 'çğıöşüâîûé', 'cgiosuaiue')
      ORDER BY "createdAt", "id"
    ) AS duplicate_number
  FROM "Organization"
)
UPDATE "Organization" AS organization
SET "normalizedName" = CASE
  WHEN normalized.duplicate_number = 1 THEN normalized.base_name
  ELSE normalized.base_name || ' #' || organization."id"
END
FROM normalized
WHERE organization."id" = normalized."id";

ALTER TABLE "Organization" ALTER COLUMN "normalizedName" SET NOT NULL;
CREATE UNIQUE INDEX "Organization_normalizedName_key" ON "Organization"("normalizedName");

CREATE TYPE "OrganizationJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "OrganizationJoinRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "OrganizationJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationJoinRequest_organizationId_userId_key"
ON "OrganizationJoinRequest"("organizationId", "userId");

CREATE INDEX "OrganizationJoinRequest_organizationId_status_createdAt_idx"
ON "OrganizationJoinRequest"("organizationId", "status", "createdAt");

ALTER TABLE "OrganizationJoinRequest"
ADD CONSTRAINT "OrganizationJoinRequest_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationJoinRequest"
ADD CONSTRAINT "OrganizationJoinRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
