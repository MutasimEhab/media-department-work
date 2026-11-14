ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS kind_flags text[] NOT NULL DEFAULT ARRAY[]::text[];

UPDATE assignments
   SET kind_flags = CASE WHEN kind = 'social_media' THEN ARRAY['social_media']::text[] ELSE ARRAY[]::text[] END
 WHERE cardinality(kind_flags) = 0;

DO $$ BEGIN
  ALTER TABLE assignments ADD CONSTRAINT assignments_kind_flags_check
    CHECK (kind_flags <@ ARRAY['materials_required', 'social_media']::text[]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
