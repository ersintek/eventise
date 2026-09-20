-- Mevcut kurumların erişimini koru: özelliklerin tamamı varsayılan açık kalır.
UPDATE "Tier"
SET "featureFlags" = COALESCE("featureFlags", '{}'::jsonb) ||
  '{"doorRegistration": true, "basicSpamProtection": true, "advancedReports": true, "prioritySupport": true}'::jsonb;
