-- Online source audit of the current 442-record directory. A record is public
-- only when its organiser page and source link responded, title/date/format
-- matched, and its explicitly announced time and venue matched the source.
-- Records without a published time remain drafts: this schema cannot represent
-- an unknown time without displaying a fabricated clock value.
UPDATE "Cop31Event" SET "status" = 'DRAFT', "updatedAt" = NOW()
WHERE "status" IN ('PUBLISHED', 'POSTPONED', 'CANCELLED');

UPDATE "Cop31Event"
SET "status" = 'PUBLISHED', "updatedAt" = NOW()
WHERE "slug" IN (
  'tracker-204','tracker-217','tracker-208','tracker-476','tracker-225','tracker-222','tracker-211','tracker-206',
  'tracker-203','tracker-201','tracker-477','tracker-219','tracker-478','tracker-212','tracker-479','tracker-480',
  'tracker-224','tracker-218','tracker-202','tracker-490','tracker-236','tracker-385','tracker-234','tracker-235',
  'tracker-231','tracker-237','tracker-239','tracker-233','tracker-247','tracker-245','tracker-242','tracker-246',
  'tracker-240','tracker-101','tracker-35','tracker-34','tracker-33','tracker-32','tracker-31','tracker-30',
  'tracker-29','tracker-42','tracker-41','tracker-40','tracker-39','tracker-38','tracker-37','tracker-36',
  'tracker-48','tracker-47','tracker-46','tracker-45','tracker-44','tracker-43','tracker-509','tracker-104',
  'tracker-72','tracker-70','tracker-69','tracker-79','tracker-77','tracker-78','tracker-76','tracker-75',
  'tracker-73','tracker-84','tracker-83','tracker-82','tracker-81','tracker-80','tracker-157','tracker-506',
  'tracker-128','tracker-127','tracker-125','tracker-124','tracker-123','tracker-133','tracker-132','tracker-131',
  'tracker-130','tracker-129','tracker-137','tracker-139','tracker-136','tracker-135','tracker-134','tracker-269',
  'tracker-510','tracker-200','tracker-91','tracker-92','tracker-93','tracker-511','tracker-489','tracker-512',
  'tracker-193','tracker-194','tracker-513','tracker-279','tracker-514','tracker-281','tracker-282','tracker-283',
  'tracker-284','tracker-285','tracker-286','tracker-287','tracker-288','tracker-289','tracker-290','tracker-291',
  'tracker-292','tracker-293','tracker-294','tracker-295','tracker-296','tracker-297','tracker-515','tracker-527',
  'tracker-528','tracker-529','tracker-534','tracker-533','tracker-536','tracker-516'
);
