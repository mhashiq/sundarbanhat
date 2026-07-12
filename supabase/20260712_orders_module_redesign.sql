-- ========================================================
-- Orders module redesign migration
-- - Normalizes order_source values
-- - Locks Website source against manual edits
-- - Adds indexes for search/filter performance
-- - Adds admin delete policy for orders
-- ========================================================

-- Normalize source values to the requested taxonomy
UPDATE public.orders
SET order_source = 'Phone Call'
WHERE order_source = 'Phone';

UPDATE public.orders
SET order_source = 'Other'
WHERE order_source = 'Referral';

UPDATE public.orders
SET order_source = 'Website'
WHERE order_source IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN order_source SET DEFAULT 'Website';

ALTER TABLE public.orders
  ALTER COLUMN order_source SET NOT NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_source_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_source_check
  CHECK (order_source IN (
    'Website',
    'Facebook',
    'Instagram',
    'TikTok',
    'WhatsApp',
    'Messenger',
    'Phone Call',
    'Walk-in Customer',
    'Other'
  ));

CREATE OR REPLACE FUNCTION public.prevent_order_source_mutation()
RETURNS trigger AS $$
BEGIN
  IF OLD.order_source = 'Website' AND NEW.order_source IS DISTINCT FROM OLD.order_source THEN
    RAISE EXCEPTION 'Website order source is system managed and cannot be changed';
  END IF;

  IF OLD.order_source IS DISTINCT FROM 'Website' AND NEW.order_source = 'Website' THEN
    RAISE EXCEPTION 'Manual orders cannot be converted to Website source';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_order_source_mutation ON public.orders;
CREATE TRIGGER trg_prevent_order_source_mutation
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_order_source_mutation();

-- Search and filter indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_orders_order_source_created_at
  ON public.orders (order_source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
  ON public.orders (order_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at
  ON public.orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_method_created_at
  ON public.orders (payment_method, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_phone_created_at
  ON public.orders (phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_transaction_id_trgm
  ON public.orders USING gin (lower(transaction_id) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm
  ON public.orders USING gin (lower(customer_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_orders_phone_trgm
  ON public.orders USING gin (lower(phone) gin_trgm_ops);

-- Secure order deletion for admins only
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE TO authenticated
USING (public.is_admin());
