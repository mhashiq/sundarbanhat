-- ========================================================
-- Soft delete support for orders
-- Adds deleted_at so removed orders disappear from all portals
-- ========================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_deleted_at_created_at
  ON public.orders (deleted_at, created_at DESC);

-- Optional: keep the admin delete policy aligned with soft delete flows
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
