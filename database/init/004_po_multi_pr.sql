ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS short_description varchar(255),
  ADD COLUMN IF NOT EXISTS description text;

UPDATE purchase_orders po
SET short_description = LEFT(
  COALESCE(
    NULLIF(pr.short_description, ''),
    NULLIF(pr.title, ''),
    'Purchase Order'
  ),
  255
)
FROM purchase_requests pr
WHERE pr.id = po.purchase_request_id
  AND (po.short_description IS NULL OR BTRIM(po.short_description) = '');

UPDATE purchase_orders
SET short_description = 'Purchase Order'
WHERE short_description IS NULL OR BTRIM(short_description) = '';

ALTER TABLE purchase_orders
  ALTER COLUMN short_description SET NOT NULL;

CREATE TABLE IF NOT EXISTS purchase_order_purchase_requests (
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  purchase_request_id uuid NOT NULL REFERENCES purchase_requests(id),
  PRIMARY KEY (purchase_order_id, purchase_request_id)
);

INSERT INTO purchase_order_purchase_requests (purchase_order_id, purchase_request_id)
SELECT id, purchase_request_id
FROM purchase_orders
ON CONFLICT (purchase_order_id, purchase_request_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_po_pr_purchase_request
  ON purchase_order_purchase_requests(purchase_request_id);
