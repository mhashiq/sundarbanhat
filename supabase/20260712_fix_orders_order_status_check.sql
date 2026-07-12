-- Keep the orders and payment constraints aligned with the manual approval workflow.
-- Safe to run on an existing database that already has the old check constraints.

ALTER TABLE public.orders
  ALTER COLUMN order_status SET DEFAULT 'pending_payment';

ALTER TABLE public.orders
  ALTER COLUMN payment_status SET DEFAULT 'pending_payment';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod', 'bkash', 'nagad', 'rocket', 'bank_transfer'));

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_status_check
  CHECK (
    order_status IN (
      'pending',
      'pending_payment',
      'payment_submitted',
      'payment_verification',
      'payment_approved',
      'order_confirmed',
      'processing',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'payment_rejected',
      'correction_requested'
    )
  );

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (
    payment_status IN (
      'pending',
      'pending_payment',
      'payment_submitted',
      'under_review',
      'payment_approved',
      'payment_rejected',
      'paid',
      'failed',
      'refunded',
      'correction_requested'
    )
  );

DROP POLICY IF EXISTS "Customers can submit payments for their orders" ON public.payments;
CREATE POLICY "Customers can submit payments for their orders" 
ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id AND (orders.customer_id = auth.uid() OR orders.customer_id IS NULL)
  )
);

DROP POLICY IF EXISTS "Customers can submit payment proofs" ON public.payment_proofs;
CREATE POLICY "Customers can submit payment proofs" 
ON public.payment_proofs FOR INSERT TO anon, authenticated WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.payments p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.id = payment_id AND (o.customer_id = auth.uid() OR o.customer_id IS NULL)
  )
);

DROP POLICY IF EXISTS "Customers can add history entries for their orders" ON public.order_status_history;
CREATE POLICY "Customers can add history entries for their orders" 
ON public.order_status_history FOR INSERT TO anon, authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id AND (orders.customer_id = auth.uid() OR orders.customer_id IS NULL)
  )
);

DROP POLICY IF EXISTS "Customers can view order items" ON public.order_items;
CREATE POLICY "Customers can view order items"
ON public.order_items FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Only admins can manage order items" ON public.order_items;
CREATE POLICY "Only admins can manage order items"
ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can view/manage orders" ON public.orders;
DROP POLICY IF EXISTS "Customers and admins can view orders" ON public.orders;
CREATE POLICY "Customers and admins can view orders"
ON public.orders FOR SELECT TO authenticated USING (
  public.is_admin()
  OR customer_id = auth.uid()
  OR (
    customer_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = auth.uid() AND c.phone = orders.phone
    )
  )
);

CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  screenshot_url TEXT,
  file_name TEXT,
  content_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);