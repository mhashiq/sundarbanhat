-- Customer CRM upgrade for Admin Customer Management page.
-- Adds richer customer profile fields, indexes, and activity syncing.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON public.customers (lower(email));
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_last_active_at ON public.customers (last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_created_at ON public.orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone_created_at ON public.orders (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email_created_at ON public.orders (email, created_at DESC);

UPDATE public.customers c
SET
  email = COALESCE(c.email, sub.latest_email),
  last_active_at = COALESCE(c.last_active_at, sub.last_order_at)
FROM (
  SELECT
    customer_id,
    MAX(email) FILTER (WHERE email IS NOT NULL AND email <> '') AS latest_email,
    MAX(created_at) AS last_order_at
  FROM public.orders
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
) sub
WHERE c.id = sub.customer_id;

CREATE OR REPLACE FUNCTION public.sync_customer_activity_from_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET
      last_active_at = COALESCE(NEW.created_at, timezone('utc'::text, now())),
      email = COALESCE(NULLIF(NEW.email, ''), email)
    WHERE id = NEW.customer_id;
  ELSIF NEW.phone IS NOT NULL THEN
    UPDATE public.customers
    SET
      last_active_at = COALESCE(NEW.created_at, timezone('utc'::text, now())),
      email = COALESCE(NULLIF(NEW.email, ''), email)
    WHERE lower(phone) = lower(NEW.phone);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_customer_activity_from_order ON public.orders;
CREATE TRIGGER trg_sync_customer_activity_from_order
AFTER INSERT OR UPDATE OF customer_id, phone, email, created_at ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_activity_from_order();
