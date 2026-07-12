-- ========================================================
-- Sundarban Hat - Database Order Status Migration Update
-- Target: Supabase (PostgreSQL)
-- Drop old lowercase statuses and set clean uppercase English statuses.
-- ========================================================

-- 1. Drop the old check constraint first so we can update the rows freely
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;

-- 2. Migrate existing orders to new uppercase statuses to prevent constraint violations
UPDATE public.orders
SET order_status = CASE
  WHEN order_status IN ('pending', 'pending_payment', 'payment_submitted', 'payment_verification', 'payment_rejected', 'correction_requested') THEN 'Order Placed'
  WHEN order_status IN ('payment_approved', 'order_confirmed') THEN 'Payment Confirmed'
  WHEN order_status = 'processing' THEN 'Order Packing'
  WHEN order_status IN ('packed', 'shipped') THEN 'Order Shipping'
  WHEN order_status = 'delivered' THEN 'Order Delivered'
  WHEN order_status = 'cancelled' THEN 'Order Cancelled'
  WHEN order_status = 'refunded' THEN 'Refunded'
  ELSE 'Order Placed'
END;

-- 3. Set the new default value
ALTER TABLE public.orders ALTER COLUMN order_status SET DEFAULT 'Order Placed';

-- 4. Add the new check constraint supporting ONLY these 7 valid statuses
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (
  order_status IN (
    'Order Placed',
    'Payment Confirmed',
    'Order Packing',
    'Order Shipping',
    'Order Delivered',
    'Order Cancelled',
    'Refunded'
  )
);

-- 5. Fix customer order items RLS query visibility discrepancy
-- Ensure customers can view nested items even if customer_id IS NULL but phone number matches.
DROP POLICY IF EXISTS "Customers can view order items" ON public.order_items;
CREATE POLICY "Customers can view order items"
ON public.order_items FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.customer_id = auth.uid()
        OR (
          o.customer_id IS NULL
          AND EXISTS (
            SELECT 1 FROM public.customers c
            WHERE c.id = auth.uid() AND c.phone = o.phone
          )
        )
      )
  )
);
