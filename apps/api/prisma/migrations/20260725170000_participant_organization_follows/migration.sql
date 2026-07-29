CREATE TABLE "OrganizationFollow" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationFollow_userId_organizationId_key" ON "OrganizationFollow"("userId", "organizationId");
CREATE INDEX "OrganizationFollow_organizationId_idx" ON "OrganizationFollow"("organizationId");
ALTER TABLE "OrganizationFollow" ADD CONSTRAINT "OrganizationFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationFollow" ADD CONSTRAINT "OrganizationFollow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
