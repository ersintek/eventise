-- Locale-visible COP31 content is stored as two independent documents. This
-- prevents an English rendering from borrowing Turkish institution, venue or
-- source labels, while keeping the event's technical scheduling fields shared.
ALTER TABLE "Cop31Event"
  ADD COLUMN "contentTr" JSONB,
  ADD COLUMN "contentEn" JSONB;

UPDATE "Cop31Event"
SET
  "contentTr" = jsonb_build_object(
    'title', "titleTr", 'summary', "summaryTr", 'description', "descriptionTr",
    'venueName', "venueName", 'venueAddress', "venueAddress", 'city', "city", 'country', "country",
    'organizers', to_jsonb("organizers"), 'organizerUrl', "organizerUrl",
    'languages', to_jsonb("languages"), 'topics', to_jsonb("topics"), 'cop31Connection', "cop31Connection",
    'registrationUrl', "registrationUrl", 'informationUrl', "informationUrl", 'sourceUrl', "sourceUrl"
  ),
  "contentEn" = jsonb_build_object(
    'title', "titleEn", 'summary', "summaryEn", 'description', "descriptionEn",
    'venueName', "venueName", 'venueAddress', "venueAddress", 'city', "city", 'country', "country",
    'organizers', to_jsonb("organizers"), 'organizerUrl', "organizerUrl",
    'languages', to_jsonb("languages"), 'topics', to_jsonb("topics"), 'cop31Connection', "cop31Connection",
    'registrationUrl', "registrationUrl", 'informationUrl', "informationUrl", 'sourceUrl', "sourceUrl"
  );

ALTER TABLE "Cop31Event"
  ALTER COLUMN "contentTr" SET NOT NULL,
  ALTER COLUMN "contentEn" SET NOT NULL;
