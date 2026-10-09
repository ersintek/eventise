-- S&P published a revised, detailed 2026 agenda.  Do not apply a blanket UTC
-- offset: several sessions and their titles have changed.  These values are
-- the current programme's local Paris times, converted by PostgreSQL.
WITH corrected(slug, local_start, title) AS (
  VALUES
    ('tracker-401', '2026-11-30 08:00', 'Training course registration'),
    ('tracker-402', '2026-11-30 18:00', 'Welcome Reception'),
    ('tracker-403', '2026-12-01 08:00', 'Registration and networking breakfast'),
    ('tracker-404', '2026-12-01 09:00', 'Chair’s welcoming remarks: Carbon markets under pressure'),
    ('tracker-405', '2026-12-01 09:05', 'Opening Keynote: Beyond climate idealism: Carbon markets as risk management tools in an age of insecurity'),
    ('tracker-406', '2026-12-01 12:25', 'Fireside Chat: From policy to markets: What this means for carbon pricing and demand'),
    ('tracker-407', '2026-12-01 09:20', 'Panel Discussion: Buyer insights: Demand signals, procurement strategies and market direction'),
    ('tracker-408', '2026-12-01 09:50', 'Fireside Chat: Carbon as an asset class: Are carbon markets fit for purpose?'),
    ('tracker-409', '2026-12-01 10:45', 'Networking & refreshment break'),
    ('tracker-410', '2026-12-01 11:25', 'Debate: EU ETS recalibration: Competitiveness versus climate ambition – can both win?'),
    ('tracker-411', '2026-12-01 11:55', 'Panel Discussion: CBAM in practice: Reshaping sourcing, trade exposure and carbon risk'),
    ('tracker-413', '2026-12-01 12:50', 'Networking lunch'),
    ('tracker-414', '2026-12-01 14:00', 'Carbon accounting under scrutiny: GHG Protocol updates, Scope 2 and the future of corporate reporting'),
    ('tracker-415', '2026-12-01 14:20', 'Powering digital growth: RECs, PPAs and removals in an era of data centre demand'),
    ('tracker-416', '2026-12-01 14:45', 'Panel discussion: Rebuilding trust: Where labels add real market value'),
    ('tracker-417', '2026-12-01 15:15', 'Panel Discussion: Hybrid mechanisms in practice: Article 6, PACM'),
    ('tracker-418', '2026-12-01 15:45', 'Panel discussion: CORSIA crunch time: Will supply be ready when airline demand takes off?'),
    ('tracker-419', '2026-12-01 16:15', 'End of Day One Closing Remarks and Welcome Reception'),
    ('tracker-420', '2026-12-02 08:00', 'Networking breakfast'),
    ('tracker-421', '2026-12-02 08:30', 'Breakfast workshops'),
    ('tracker-422', '2026-12-02 09:30', 'Chair’s recap of day one'),
    ('tracker-423', '2026-12-02 09:35', 'Fireside Chat: The new carbon diplomacy: Building government coalitions to scale carbon markets'),
    ('tracker-424', '2026-12-02 10:00', 'Spotlight on Brazil carbon markets'),
    ('tracker-425', '2026-12-02 10:30', 'Panel discussion: Article 6 at a crossroads: multilateral rules, bilateral reality'),
    ('tracker-426', '2026-12-02 11:00', 'Networking & refreshment break'),
    ('tracker-427', '2026-12-02 11:30', 'Rapid Insight Session: CCS in Europe: Momentum, delays and delivery risk'),
    ('tracker-428', '2026-12-02 11:45', 'Keynote: Removals in EU ETS and CRCF: Political limits and market realities'),
    ('tracker-429', '2026-12-02 12:05', 'Fireside Chat: Pricing permanence: Liability, insurance and data for financeable removals'),
    ('tracker-430', '2026-12-02 12:35', 'Networking lunch'),
    ('tracker-431', '2026-12-02 14:05', 'Panel Discussion: Financing carbon markets: From project concept to bankable asset'),
    ('tracker-432', '2026-12-02 14:35', 'Case study: From commitment to reporting: Corporate examples of SBTi validation in practice'),
    ('tracker-433', '2026-12-02 15:00', 'Closing remarks'),
    ('tracker-434', '2026-12-02 15:15', 'End of Conference')
)
UPDATE "Cop31Event" e
SET
  -- Cop31Event uses Prisma's UTC timestamp representation. Convert the
  -- organiser's wall-clock time to UTC explicitly so this migration does not
  -- depend on the database session's TimeZone setting.
  "startsAt" = ((c.local_start::timestamp AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'UTC'),
  "timezone" = 'Europe/Paris',
  "titleTr" = c.title,
  "titleEn" = c.title,
  "contentTr" = jsonb_set(e."contentTr", '{title}', to_jsonb(c.title), true),
  "contentEn" = jsonb_set(e."contentEn", '{title}', to_jsonb(c.title), true),
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
FROM corrected c
WHERE e."slug" = c.slug;

-- These rows are agenda section headings, not independently schedulable events.
DELETE FROM "Cop31Event"
WHERE "slug" IN ('tracker-412', 'tracker-435', 'tracker-436', 'tracker-437', 'tracker-438', 'tracker-439', 'tracker-440', 'tracker-441');

-- AlterCOP's official 2026 agenda corrected the pre-COP evening date.  The
-- "Saturday Unplugged" row and five transversal tracks are programme labels,
-- not scheduled events, so they must not be presented as individual listings.
UPDATE "Cop31Event"
SET
  "startsAt" = (TIMESTAMPTZ '2026-10-06 00:00:00+00' AT TIME ZONE 'UTC'),
  "timezone" = 'Asia/Singapore',
  "status" = 'DRAFT',
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "slug" = 'tracker-442';

DELETE FROM "Cop31Event"
WHERE "slug" IN ('tracker-452', 'tracker-454', 'tracker-455', 'tracker-456', 'tracker-457', 'tracker-458');

-- The organiser confirms the dates, but has not published session start times.
-- Keep the genuine programme days in editorial draft rather than expose the
-- importer's invented 09:00 time as a fact.
UPDATE "Cop31Event"
SET "status" = 'DRAFT', "verifiedAt" = NOW(), "updatedAt" = NOW()
WHERE "slug" IN ('tracker-443', 'tracker-444', 'tracker-445', 'tracker-446',
                   'tracker-447', 'tracker-448', 'tracker-449', 'tracker-450',
                   'tracker-451', 'tracker-453');

-- GFHS confirms one full-day forum and awards ceremony on 13 November.  The
-- imported discussion themes are not separately scheduled sessions.  Its
-- exact start time and venue are not yet published, so retain the genuine
-- forum as a draft with the official registration link, not a guessed time.
UPDATE "Cop31Event"
SET
  "startsAt" = (TIMESTAMPTZ '2026-11-13 00:00:00+00' AT TIME ZONE 'UTC'),
  "timezone" = 'Europe/Istanbul',
  "venueName" = NULL,
  "venueAddress" = NULL,
  "registrationUrl" = 'http://gfhsforum.mikecrm.com/0N6FJ4u',
  "status" = 'DRAFT',
  "contentTr" = jsonb_set(jsonb_set("contentTr", '{registrationUrl}', to_jsonb('http://gfhsforum.mikecrm.com/0N6FJ4u'::text), true), '{venueName}', 'null'::jsonb, true),
  "contentEn" = jsonb_set(jsonb_set("contentEn", '{registrationUrl}', to_jsonb('http://gfhsforum.mikecrm.com/0N6FJ4u'::text), true), '{venueName}', 'null'::jsonb, true),
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "slug" = 'tracker-459';

DELETE FROM "Cop31Event"
WHERE "slug" IN ('tracker-460', 'tracker-461', 'tracker-462', 'tracker-463',
                  'tracker-464', 'tracker-465', 'tracker-466', 'tracker-467');

-- CCWX lists the local time zone for every event.  Its current programme also
-- moved the Nature Economy session from 17:00 to 16:30 ET.
WITH ccwx(slug, local_start, local_end, tz) AS (
  VALUES
    ('tracker-527', '2026-11-23 08:00', '2026-11-23 18:00', 'America/Toronto'),
    ('tracker-528', '2026-11-23 09:00', '2026-11-23 17:00', 'America/Toronto'),
    ('tracker-529', '2026-11-23 10:00', '2026-11-23 11:00', 'America/Vancouver'),
    ('tracker-530', '2026-11-24 09:00', '2026-11-24 14:00', 'America/Toronto'),
    ('tracker-531', '2026-11-24 15:30', '2026-11-24 18:30', 'America/Toronto'),
    ('tracker-532', '2026-11-24 16:30', '2026-11-24 19:00', 'America/Toronto'),
    ('tracker-533', '2026-11-24 11:00', '2026-11-24 12:00', 'America/Denver'),
    ('tracker-534', '2026-11-24 10:00', '2026-11-24 11:00', 'America/Vancouver'),
    ('tracker-535', '2026-11-25 15:00', '2026-11-25 18:00', 'America/Toronto'),
    ('tracker-536', '2026-11-25 09:00', '2026-11-25 13:00', 'America/Vancouver'),
    ('tracker-537', '2026-11-25 18:00', '2026-11-25 21:00', 'America/Vancouver'),
    ('tracker-538', '2026-11-26 15:30', '2026-11-26 17:30', 'America/Toronto'),
    ('tracker-539', '2026-11-27 15:30', '2026-11-27 17:30', 'America/Toronto')
)
UPDATE "Cop31Event" e
SET
  "startsAt" = ((c.local_start::timestamp AT TIME ZONE c.tz) AT TIME ZONE 'UTC'),
  "endsAt" = ((c.local_end::timestamp AT TIME ZONE c.tz) AT TIME ZONE 'UTC'),
  "timezone" = c.tz,
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
FROM ccwx c
WHERE e."slug" = c.slug;

-- Durham's current programme confirms the final five lectures in the series in
-- UK time.  Three older imported session titles are no longer on its programme.
WITH durham(slug, local_start) AS (
  VALUES
    ('tracker-512', '2026-10-29 09:00'),
    ('tracker-513', '2026-11-05 09:00'),
    ('tracker-514', '2026-11-12 09:00'),
    ('tracker-515', '2026-11-19 09:00'),
    ('tracker-516', '2026-11-26 09:00')
)
UPDATE "Cop31Event" e
SET
  "startsAt" = ((d.local_start::timestamp AT TIME ZONE 'Europe/London') AT TIME ZONE 'UTC'),
  "endsAt" = (((d.local_start::timestamp + INTERVAL '90 minutes') AT TIME ZONE 'Europe/London') AT TIME ZONE 'UTC'),
  "timezone" = 'Europe/London',
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
FROM durham d
WHERE e."slug" = d.slug;

DELETE FROM "Cop31Event"
WHERE "slug" IN ('tracker-509', 'tracker-510', 'tracker-511');

-- GLF confirms the date, hybrid format and updated physical venue, but not a
-- programme start time.  Hide it until that time is published; thematic focus
-- labels are not separate events.
UPDATE "Cop31Event"
SET
  "startsAt" = (TIMESTAMPTZ '2026-11-18 00:00:00+00' AT TIME ZONE 'UTC'),
  "timezone" = 'Europe/Istanbul',
  "venueName" = 'DoubleTree by Hilton Antalya City Centre',
  "status" = 'DRAFT',
  "contentTr" = jsonb_set("contentTr", '{venueName}', to_jsonb('DoubleTree by Hilton Antalya City Centre'::text), true),
  "contentEn" = jsonb_set("contentEn", '{venueName}', to_jsonb('DoubleTree by Hilton Antalya City Centre'::text), true),
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "slug" = 'tracker-372';

DELETE FROM "Cop31Event"
WHERE "slug" IN ('tracker-373', 'tracker-374', 'tracker-375');

-- GlobalABC confirms planned COP31 activities but has not yet published these
-- webinar details.  Do not display the imported dates/times as confirmed.
UPDATE "Cop31Event"
SET "status" = 'DRAFT', "verifiedAt" = NOW(), "updatedAt" = NOW()
WHERE "slug" IN ('tracker-144', 'tracker-145', 'tracker-146', 'tracker-147', 'tracker-148');

-- IIGCC lists the 20 October webinar in BST.  The remaining guide-only rows
-- lack a current event page with a verifiable time/location, so keep them out
-- of the published directory pending a direct organiser listing.
UPDATE "Cop31Event"
SET
  "startsAt" = (TIMESTAMPTZ '2026-10-20 13:00:00+00' AT TIME ZONE 'UTC'),
  "timezone" = 'Europe/London',
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "slug" = 'tracker-93';

UPDATE "Cop31Event"
SET "status" = 'DRAFT', "verifiedAt" = NOW(), "updatedAt" = NOW()
WHERE "slug" IN ('tracker-159', 'tracker-279', 'tracker-506');

-- WAITRO publishes one three-day summit at 08:00–17:00 UTC.  Its imported
-- sub-rows are agenda labels without independently published schedules.
UPDATE "Cop31Event"
SET
  "startsAt" = (TIMESTAMPTZ '2026-10-26 08:00:00+00' AT TIME ZONE 'UTC'),
  "endsAt" = (TIMESTAMPTZ '2026-10-28 17:00:00+00' AT TIME ZONE 'UTC'),
  "timezone" = 'UTC',
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "slug" = 'tracker-260';

DELETE FROM "Cop31Event"
WHERE "slug" IN ('tracker-261', 'tracker-262', 'tracker-263', 'tracker-264',
                  'tracker-265', 'tracker-266', 'tracker-468', 'tracker-469',
                  'tracker-470', 'tracker-471', 'tracker-472', 'tracker-473',
                  'tracker-474', 'tracker-475', 'tracker-492', 'tracker-493',
                  'tracker-494', 'tracker-495', 'tracker-496', 'tracker-497');

-- GYCT's three advanced online sessions are current, timed in UTC.  Its COP31
-- ceremony has no time announced, so remains an editorial draft.
UPDATE "Cop31Event"
SET
  "endsAt" = "startsAt" + INTERVAL '90 minutes',
  "timezone" = 'UTC',
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "slug" IN ('tracker-150', 'tracker-151', 'tracker-152');

UPDATE "Cop31Event"
SET "status" = 'DRAFT', "verifiedAt" = NOW(), "updatedAt" = NOW()
WHERE "slug" = 'tracker-153';

-- Publication safety gate: a record stays publicly visible only where its
-- current organiser page was individually reconciled in this audit.  All
-- others remain available to editors as drafts while their primary-source
-- check continues; this prevents a plausible-but-unverified import from being
-- represented as confirmed event information.
UPDATE "Cop31Event"
SET "status" = 'DRAFT', "updatedAt" = NOW()
WHERE "status" = 'PUBLISHED'
  AND "slug" NOT IN (
    'tracker-93', 'tracker-94', 'tracker-100', 'tracker-123', 'tracker-124',
    'tracker-125', 'tracker-126', 'tracker-127', 'tracker-128', 'tracker-129',
    'tracker-130', 'tracker-131', 'tracker-132', 'tracker-133', 'tracker-134',
    'tracker-135', 'tracker-136', 'tracker-137', 'tracker-138', 'tracker-139',
    'tracker-140', 'tracker-141', 'tracker-142', 'tracker-143', 'tracker-150',
    'tracker-151', 'tracker-152', 'tracker-160',
    'tracker-169', 'tracker-170', 'tracker-171', 'tracker-172', 'tracker-173',
    'tracker-174', 'tracker-175', 'tracker-176', 'tracker-177', 'tracker-178',
    'tracker-260',
    'tracker-281', 'tracker-282', 'tracker-283', 'tracker-284', 'tracker-285',
    'tracker-286', 'tracker-287', 'tracker-288', 'tracker-289', 'tracker-290',
    'tracker-291', 'tracker-292', 'tracker-293', 'tracker-294', 'tracker-295',
    'tracker-296', 'tracker-297', 'tracker-340', 'tracker-341', 'tracker-342',
    'tracker-343', 'tracker-344', 'tracker-345', 'tracker-346', 'tracker-347',
    'tracker-354', 'tracker-355', 'tracker-356', 'tracker-357', 'tracker-358',
    'tracker-359', 'tracker-360', 'tracker-361', 'tracker-362', 'tracker-363',
    'tracker-364', 'tracker-365', 'tracker-376', 'tracker-377', 'tracker-378',
    'tracker-379', 'tracker-380', 'tracker-381', 'tracker-401', 'tracker-402',
    'tracker-403', 'tracker-404', 'tracker-405', 'tracker-406', 'tracker-407',
    'tracker-408', 'tracker-409', 'tracker-410', 'tracker-411', 'tracker-413',
    'tracker-414', 'tracker-415', 'tracker-416', 'tracker-417', 'tracker-418',
    'tracker-419', 'tracker-420', 'tracker-421', 'tracker-422', 'tracker-423',
    'tracker-424', 'tracker-425', 'tracker-426', 'tracker-427', 'tracker-428',
    'tracker-429', 'tracker-430', 'tracker-431', 'tracker-432', 'tracker-433',
    'tracker-434', 'tracker-512', 'tracker-513', 'tracker-514', 'tracker-515',
    'tracker-516', 'tracker-527', 'tracker-528', 'tracker-529', 'tracker-530',
    'tracker-531', 'tracker-532', 'tracker-533', 'tracker-534', 'tracker-535',
    'tracker-536', 'tracker-537', 'tracker-538', 'tracker-539'
  );

-- The original Luma listing was removed. The organiser's current COP31 agenda
-- is the authoritative information and registration destination.
UPDATE "Cop31Event"
SET
  "sourceUrl" = 'https://energyshift.capital/cop31',
  "registrationUrl" = 'https://energyshift.capital/cop31',
  "contentTr" = jsonb_set(jsonb_set("contentTr", '{sourceUrl}', to_jsonb('https://energyshift.capital/cop31'::text), true), '{registrationUrl}', to_jsonb('https://energyshift.capital/cop31'::text), true),
  "contentEn" = jsonb_set(jsonb_set("contentEn", '{sourceUrl}', to_jsonb('https://energyshift.capital/cop31'::text), true), '{registrationUrl}', to_jsonb('https://energyshift.capital/cop31'::text), true),
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "sourceUrl" = 'https://luma.com/pwdt2vel';

-- The Energy Shift Capital agenda supersedes the deleted Luma page.  It gives
-- the session titles and timings, but does not publish the former IC Santai
-- venue claim; remove that unsupported venue rather than preserve it.
WITH energy_shift(slug, local_start, local_end, title) AS (
  VALUES
    ('tracker-376', '2026-11-13 10:00', '2026-11-13 10:40', 'Panel: Where Capital is Moving: Investor Perspectives on Energy Transition'),
    ('tracker-377', '2026-11-13 10:40', '2026-11-13 11:20', 'Panel Discussion: Oil & Gas Sector Transition'),
    ('tracker-378', '2026-11-13 11:40', '2026-11-13 11:50', 'Keynote'),
    ('tracker-379', '2026-11-13 11:50', '2026-11-13 12:10', 'Investor Fireside Chat'),
    ('tracker-380', '2026-11-13 12:10', '2026-11-13 12:50', 'Panel Discussion: Building for What''s Next: Corporate Energy Strategies in a Transition Economy'),
    ('tracker-381', '2026-11-13 12:50', '2026-11-13 13:00', 'Keynote')
)
UPDATE "Cop31Event" e
SET
  "startsAt" = ((s.local_start::timestamp AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'UTC'),
  "endsAt" = ((s.local_end::timestamp AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'UTC'),
  "timezone" = 'Europe/Istanbul',
  "titleTr" = s.title,
  "titleEn" = s.title,
  "venueName" = NULL,
  "venueAddress" = NULL,
  "contentTr" = jsonb_set(jsonb_set(e."contentTr", '{title}', to_jsonb(s.title), true), '{venueName}', 'null'::jsonb, true),
  "contentEn" = jsonb_set(jsonb_set(e."contentEn", '{title}', to_jsonb(s.title), true), '{venueName}', 'null'::jsonb, true),
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
FROM energy_shift s
WHERE e."slug" = s.slug;

-- Education for Climate publishes its programme in CEST.  The importer stored
-- those wall-clock times as UTC; use the official programme times and end times.
WITH education(slug, local_start, local_end) AS (
  VALUES
    ('tracker-340', '2026-10-22 09:00', '2026-10-22 09:25'),
    ('tracker-341', '2026-10-22 09:25', '2026-10-22 09:55'),
    ('tracker-342', '2026-10-22 10:05', '2026-10-22 10:45'),
    ('tracker-343', '2026-10-22 10:55', '2026-10-22 11:55'),
    ('tracker-344', '2026-10-22 12:05', '2026-10-22 12:35'),
    ('tracker-345', '2026-10-22 13:50', '2026-10-22 14:40'),
    ('tracker-346', '2026-10-22 14:50', '2026-10-22 16:40'),
    ('tracker-347', '2026-10-22 16:40', '2026-10-22 17:00')
)
UPDATE "Cop31Event" e
SET
  "startsAt" = ((s.local_start::timestamp AT TIME ZONE 'Europe/Brussels') AT TIME ZONE 'UTC'),
  "endsAt" = ((s.local_end::timestamp AT TIME ZONE 'Europe/Brussels') AT TIME ZONE 'UTC'),
  "timezone" = 'Europe/Brussels',
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
FROM education s
WHERE e."slug" = s.slug;

-- The organiser states 10:00–11:30 ET (16:00–17:30 CEST) on 20 October.
UPDATE "Cop31Event"
SET
  "startsAt" = (TIMESTAMPTZ '2026-10-20 14:00:00+00' AT TIME ZONE 'UTC'),
  "endsAt" = (TIMESTAMPTZ '2026-10-20 15:30:00+00' AT TIME ZONE 'UTC'),
  "timezone" = 'America/New_York',
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "slug" = 'tracker-94';

-- Use the direct TÜSİAD listing rather than its outdated general events page.
UPDATE "Cop31Event"
SET
  "endsAt" = (TIMESTAMPTZ '2026-10-15 12:00:00+00' AT TIME ZONE 'UTC'),
  "sourceUrl" = 'https://etkinlik.tusiad.org/index.php?Itemid=138&catid=3&id=680&option=com_eventbooking&view=event',
  "registrationUrl" = 'https://etkinlik.tusiad.org/index.php?Itemid=138&catid=3&id=680&option=com_eventbooking&view=event',
  "contentTr" = jsonb_set(jsonb_set("contentTr", '{sourceUrl}', to_jsonb('https://etkinlik.tusiad.org/index.php?Itemid=138&catid=3&id=680&option=com_eventbooking&view=event'::text), true), '{registrationUrl}', to_jsonb('https://etkinlik.tusiad.org/index.php?Itemid=138&catid=3&id=680&option=com_eventbooking&view=event'::text), true),
  "contentEn" = jsonb_set(jsonb_set("contentEn", '{sourceUrl}', to_jsonb('https://etkinlik.tusiad.org/index.php?Itemid=138&catid=3&id=680&option=com_eventbooking&view=event'::text), true), '{registrationUrl}', to_jsonb('https://etkinlik.tusiad.org/index.php?Itemid=138&catid=3&id=680&option=com_eventbooking&view=event'::text), true),
  "verifiedAt" = NOW(),
  "updatedAt" = NOW()
WHERE "slug" = 'tracker-160';
