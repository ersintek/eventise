CREATE TYPE "Cop31EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'POSTPONED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "Cop31EventFormat" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');

CREATE TABLE "Cop31Event" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "titleTr" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "summaryTr" TEXT NOT NULL,
  "summaryEn" TEXT NOT NULL,
  "descriptionTr" TEXT,
  "descriptionEn" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  "format" "Cop31EventFormat" NOT NULL DEFAULT 'ONLINE',
  "venueName" TEXT,
  "venueAddress" TEXT,
  "city" TEXT,
  "country" TEXT,
  "organizers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "organizerUrl" TEXT,
  "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "cop31Connection" TEXT NOT NULL,
  "registrationUrl" TEXT,
  "informationUrl" TEXT,
  "sourceUrl" TEXT NOT NULL,
  "status" "Cop31EventStatus" NOT NULL DEFAULT 'DRAFT',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cop31Event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Cop31Event_slug_key" ON "Cop31Event"("slug");
CREATE INDEX "Cop31Event_status_startsAt_idx" ON "Cop31Event"("status", "startsAt");
CREATE INDEX "Cop31Event_featured_startsAt_idx" ON "Cop31Event"("featured", "startsAt");
