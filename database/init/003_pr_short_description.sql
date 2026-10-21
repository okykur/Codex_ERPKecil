ALTER TABLE purchase_requests
  ADD COLUMN IF NOT EXISTS short_description varchar(255);

UPDATE purchase_requests
SET short_description = LEFT(COALESCE(NULLIF(title, ''), 'Purchase Request'), 255)
WHERE short_description IS NULL OR BTRIM(short_description) = '';

ALTER TABLE purchase_requests
  ALTER COLUMN short_description SET NOT NULL;
