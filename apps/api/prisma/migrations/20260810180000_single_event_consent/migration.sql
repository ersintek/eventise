-- Keep the most recently created consent when legacy events have more than one.
WITH ranked_consents AS (
  SELECT
    requirement."eventId",
    requirement."definitionId",
    ROW_NUMBER() OVER (
      PARTITION BY requirement."eventId"
      ORDER BY definition."createdAt" DESC, requirement."definitionId" DESC
    ) AS position
  FROM "EventConsentRequirement" AS requirement
  JOIN "ConsentDefinition" AS definition
    ON definition."id" = requirement."definitionId"
)
DELETE FROM "EventConsentRequirement" AS requirement
USING ranked_consents AS ranked
WHERE requirement."eventId" = ranked."eventId"
  AND requirement."definitionId" = ranked."definitionId"
  AND ranked.position > 1;

ALTER TABLE "EventConsentRequirement"
  DROP CONSTRAINT "EventConsentRequirement_pkey",
  ADD CONSTRAINT "EventConsentRequirement_pkey" PRIMARY KEY ("eventId");

CREATE INDEX "EventConsentRequirement_definitionId_idx"
  ON "EventConsentRequirement"("definitionId");
