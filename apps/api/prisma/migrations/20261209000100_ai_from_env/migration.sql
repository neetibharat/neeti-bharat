-- The service, model and key now come from the install's environment. A company that had set one keeps the
-- features that were on, and starts with none on otherwise.
ALTER TABLE "ai_settings" ADD COLUMN "enabledFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "ai_settings"
SET "enabledFeatures" = ARRAY(
  SELECT feature
  FROM unnest(ARRAY['policy_import', 'policy_tailor', 'policy_check', 'proof_check']) AS feature
  WHERE feature <> ALL (COALESCE("disabledFeatures", ARRAY[]::TEXT[]))
);

ALTER TABLE "ai_settings"
  DROP COLUMN "provider",
  DROP COLUMN "model",
  DROP COLUMN "apiKey",
  DROP COLUMN "keyHint",
  DROP COLUMN "disabledFeatures";
