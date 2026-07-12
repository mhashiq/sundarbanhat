-- Fix admin order visibility and customer scoped access for order management.
-- Apply in Supabase SQL Editor on the live project.

-- Orders: admin reads all, customers read own (or legacy phone-linked null customer_id rows)
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

DROP POLICY IF EXISTS "Only admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Order Items: customers only for their orders, admins all
DROP POLICY IF EXISTS "Only admins can view order items" ON public.order_items;
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

DROP POLICY IF EXISTS "Only admins can manage order items" ON public.order_items;
CREATE POLICY "Only admins can manage order items"
ON public.order_items FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Payments: admins see all, customers only their orders
DROP POLICY IF EXISTS "Customers and admins can view payments" ON public.payments;
CREATE POLICY "Customers and admins can view payments"
ON public.payments FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id
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

DROP POLICY IF EXISTS "Only admins can modify payments" ON public.payments;
CREATE POLICY "Only admins can modify payments"
ON public.payments FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Order status history: admins all, customers only their orders
DROP POLICY IF EXISTS "Customers can view history for their orders" ON public.order_status_history;
CREATE POLICY "Customers can view history for their orders"
ON public.order_status_history FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
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

DROP POLICY IF EXISTS "Only admins can manage order history" ON public.order_status_history;
CREATE POLICY "Only admins can manage order history"
ON public.order_status_history FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Payment proofs: admins all, customers only their orders
DROP POLICY IF EXISTS "Customers and admins can view payment proofs" ON public.payment_proofs;
CREATE POLICY "Customers and admins can view payment proofs"
ON public.payment_proofs FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.payments p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.id = payment_id
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

DROP POLICY IF EXISTS "Only admins can manage payment proofs" ON public.payment_proofs;
CREATE POLICY "Only admins can manage payment proofs"
ON public.payment_proofs FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
