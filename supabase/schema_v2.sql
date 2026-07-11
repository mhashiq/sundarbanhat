-- ========================================================
-- Sundarban Hat - Database Schema v2 (Migration Update)
-- Target: Supabase (PostgreSQL)
-- Adds Customer Authentication, Addresses, Manual Payments & Proofs
-- ========================================================

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Addresses Table (Saved Shipping Addresses)
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Modify Orders Table (Add customer reference)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 4. Create Payments Table (Manual Payment Submissions)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL, -- bKash, Nagad, Rocket, Bank Transfer
    transaction_id TEXT NOT NULL UNIQUE,
    amount NUMERIC NOT NULL,
    screenshot_url TEXT, -- Supabase Storage file path
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL,
    rejection_reason TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Order Status History Table (Chronological Tracking)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. Indexes for Speed
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON public.addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_status_history_order ON public.order_status_history(order_id);

-- ==========================================
-- 7. RLS (Row Level Security) Configuration
-- ==========================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- 7.1 Customers Table Policies
DROP POLICY IF EXISTS "Customers can view their own profile" ON public.customers;
CREATE POLICY "Customers can view their own profile" 
ON public.customers FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Customers can edit their own profile" ON public.customers;
CREATE POLICY "Customers can edit their own profile" 
ON public.customers FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can insert customer profiles" ON public.customers;
CREATE POLICY "Anyone can insert customer profiles" 
ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 7.2 Addresses Table Policies
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.addresses;
CREATE POLICY "Customers can manage their own addresses" 
ON public.addresses FOR ALL TO authenticated USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());

-- 7.3 Payments Table Policies
DROP POLICY IF EXISTS "Customers can submit payments for their orders" ON public.payments;
CREATE POLICY "Customers can submit payments for their orders" 
ON public.payments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id AND orders.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers and admins can view payments" ON public.payments;
CREATE POLICY "Customers and admins can view payments" 
ON public.payments FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id AND orders.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Only admins can modify payments" ON public.payments;
CREATE POLICY "Only admins can modify payments" 
ON public.payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7.4 Order Status History Policies
DROP POLICY IF EXISTS "Customers can view history for their orders" ON public.order_status_history;
CREATE POLICY "Customers can view history for their orders" 
ON public.order_status_history FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id AND orders.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Only admins can manage order history" ON public.order_status_history;
CREATE POLICY "Only admins can manage order history" 
ON public.order_status_history FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Update Orders Policies to allow Customer selective SELECT
DROP POLICY IF EXISTS "Only admins can view/manage orders" ON public.orders;
CREATE POLICY "Customers and admins can view orders" 
ON public.orders FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update orders" 
ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================================
-- 8. Refactor handle_new_user trigger to handle Customer & Admin routing
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_val TEXT;
  name_val TEXT;
BEGIN
  -- If the email ends in the dummy domain, it is a customer account
  IF new.email LIKE '%@customer.sundarbanhat.com' THEN
    -- Extract phone number from email (everything before the @)
    phone_val := split_part(new.email, '@', 1);
    -- Extract full name from metadata
    name_val := coalesce(new.raw_user_meta_data ->> 'full_name', 'Customer');
    
    INSERT INTO public.customers (id, full_name, phone)
    VALUES (new.id, name_val, phone_val)
    ON CONFLICT (phone) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
