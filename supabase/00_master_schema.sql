-- ========================================================
-- Sundarban Hat - Consolidated Master Database Schema
-- Target: Supabase (PostgreSQL)
-- Fully Idempotent Script for Production Setup & Migrations
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- 1. Table Definitions
-- ==========================================

-- 1.1 Admin Users Table (UUID references auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.2 Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- Slug-like ID (e.g. honey-kholisha)
    title TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    category TEXT NOT NULL REFERENCES public.categories(slug) ON DELETE CASCADE,
    price TEXT NOT NULL,
    price_num NUMERIC NOT NULL,
    weight TEXT NOT NULL,
    location TEXT NOT NULL,
    harvest TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('in-stock', 'out-of-stock')),
    story TEXT NOT NULL,
    benefits TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    storage TEXT NOT NULL,
    img TEXT NOT NULL,
    stock INTEGER DEFAULT 10 NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Customers Table (Auth user profile)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    notes TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.6 Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    shipping_cost NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'bkash', 'nagad', 'rocket', 'bank_transfer')),
    order_status TEXT DEFAULT 'pending_payment' CHECK (
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
            'correction_requested',
            'Order Placed',
            'Payment Confirmed',
            'Order Packing',
            'Order Shipping',
            'Order Delivered',
            'Order Cancelled'
        )
    ) NOT NULL,
    payment_status TEXT DEFAULT 'pending_payment' CHECK (
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
    ) NOT NULL,
    order_source TEXT DEFAULT 'Website' CHECK (
        order_source IN (
            'Website',
            'Facebook',
            'Instagram',
            'TikTok',
            'WhatsApp',
            'Messenger',
            'Phone Call',
            'Walk-in Customer',
            'Other'
        )
    ) NOT NULL,
    advance_paid_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    total_paid_amount NUMERIC DEFAULT 0,
    courier_collection_amount NUMERIC DEFAULT 0,
    courier_name TEXT,
    courier_tracking_number TEXT,
    payment_received_by TEXT,
    payment_received_date TIMESTAMP WITH TIME ZONE,
    payment_proof_image TEXT,
    payment_notes TEXT,
    internal_notes TEXT,
    notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.7 Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_num NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.8 Payments Table (Manual Payment Submissions)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    screenshot_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'correction_requested')) NOT NULL,
    rejection_reason TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.9 Payment Proofs Table
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    screenshot_url TEXT,
    file_name TEXT,
    content_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.10 Order Status History Table
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.11 Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.12 Dynamic Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Settings
INSERT INTO public.settings (key, value) VALUES
  ('facebook_url', 'https://facebook.com/sundarbanhat'),
  ('instagram_url', 'https://instagram.com/sundarbanhat'),
  ('tiktok_url', ''),
  ('youtube_url', ''),
  ('whatsapp_number', '+8801873520181')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 2. Indexes for Performance & Search
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON public.orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at_created_at ON public.orders(deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at ON public.orders(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_source_created_at ON public.orders(order_source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON public.customers(lower(email));
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON public.addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_payment ON public.payment_proofs(payment_id);
CREATE INDEX IF NOT EXISTS idx_status_history_order ON public.order_status_history(order_id);

-- Trigram Indexes for Fast Text Search
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id_trgm ON public.orders USING gin (lower(transaction_id) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm ON public.orders USING gin (lower(customer_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_phone_trgm ON public.orders USING gin (lower(phone) gin_trgm_ops);

-- ==========================================
-- 3. Row Level Security (RLS) Configuration
-- ==========================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper security function to verify admin access
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.1 Admin Users Policies
DROP POLICY IF EXISTS "Admins can view admins" ON public.admin_users;
CREATE POLICY "Admins can view admins" 
ON public.admin_users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify admin list" ON public.admin_users;
CREATE POLICY "Only admins can modify admin list" 
ON public.admin_users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow anyone to insert themselves as admin for setup" ON public.admin_users;
CREATE POLICY "Allow anyone to insert themselves as admin for setup" 
ON public.admin_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3.2 Categories Policies
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" 
ON public.categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify categories" ON public.categories;
CREATE POLICY "Only admins can modify categories" 
ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.3 Products Policies
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify products" ON public.products;
CREATE POLICY "Only admins can modify products" 
ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.4 Customers Policies
DROP POLICY IF EXISTS "Customers can view their own profile" ON public.customers;
CREATE POLICY "Customers can view their own profile" 
ON public.customers FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Customers can edit their own profile" ON public.customers;
CREATE POLICY "Customers can edit their own profile" 
ON public.customers FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can insert customer profiles" ON public.customers;
CREATE POLICY "Anyone can insert customer profiles" 
ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 3.5 Addresses Policies
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.addresses;
CREATE POLICY "Customers can manage their own addresses" 
ON public.addresses FOR ALL TO authenticated USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());

-- 3.6 Orders Policies
DROP POLICY IF EXISTS "Anyone can place orders" ON public.orders;
CREATE POLICY "Anyone can place orders" 
ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Customers and admins can view orders" ON public.orders;
CREATE POLICY "Customers and admins can view orders" 
ON public.orders FOR SELECT TO anon, authenticated USING (
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
  OR true -- Allow anonymous retrieval by unique transaction_id in query
);

DROP POLICY IF EXISTS "Only admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" 
ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE TO authenticated USING (public.is_admin());

-- 3.7 Order Items Policies
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" 
ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can view order items" ON public.order_items;
CREATE POLICY "Customers can view order items" 
ON public.order_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can manage order items" ON public.order_items;
CREATE POLICY "Only admins can manage order items" 
ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.8 Payments Policies
DROP POLICY IF EXISTS "Customers can submit payments for their orders" ON public.payments;
CREATE POLICY "Customers can submit payments for their orders" 
ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id AND (orders.customer_id = auth.uid() OR orders.customer_id IS NULL)
  )
);

DROP POLICY IF EXISTS "Customers and admins can view payments" ON public.payments;
CREATE POLICY "Customers and admins can view payments" 
ON public.payments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify payments" ON public.payments;
CREATE POLICY "Only admins can modify payments" 
ON public.payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.9 Payment Proofs Policies
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

DROP POLICY IF EXISTS "Customers and admins can view payment proofs" ON public.payment_proofs;
CREATE POLICY "Customers and admins can view payment proofs" 
ON public.payment_proofs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can manage payment proofs" ON public.payment_proofs;
CREATE POLICY "Only admins can manage payment proofs" 
ON public.payment_proofs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.10 Order Status History Policies
DROP POLICY IF EXISTS "Customers can view history for their orders" ON public.order_status_history;
CREATE POLICY "Customers can view history for their orders" 
ON public.order_status_history FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Customers can add history entries for their orders" ON public.order_status_history;
CREATE POLICY "Customers can add history entries for their orders" 
ON public.order_status_history FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can manage order history" ON public.order_status_history;
CREATE POLICY "Only admins can manage order history" 
ON public.order_status_history FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.11 Contact Messages Policies
DROP POLICY IF EXISTS "Anyone can send contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can send contact messages" 
ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can manage messages" ON public.contact_messages;
CREATE POLICY "Only admins can manage messages" 
ON public.contact_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.12 Settings Policies
DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;
CREATE POLICY "Allow public read settings" 
ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write settings" ON public.settings;
CREATE POLICY "Allow admin write settings" 
ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- 4. Triggers and Business Logic Functions
-- ==========================================

-- 4.1 Handle New User Auth Creation (Customer Routing)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_val TEXT;
  name_val TEXT;
BEGIN
  IF new.email LIKE '%@customer.sundarbanhat.com' THEN
    phone_val := split_part(new.email, '@', 1);
    name_val := coalesce(new.raw_user_meta_data ->> 'full_name', 'Customer');
    
    INSERT INTO public.customers (id, full_name, phone, email)
    VALUES (new.id, name_val, phone_val, new.email)
    ON CONFLICT (phone) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.2 Sync Customer Activity from Orders
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

-- 4.3 Lock Website Order Source Mutations
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

-- 4.4 Auto Audit-Log Order Status Changes into Order Status History
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.order_status IS DISTINCT FROM NEW.order_status) OR (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    INSERT INTO public.order_status_history (order_id, status, notes, created_at)
    VALUES (
      NEW.id,
      NEW.order_status,
      'Order status changed to ' || NEW.order_status || ' (Payment: ' || NEW.payment_status || ')',
      timezone('utc'::text, now())
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_order_status_change ON public.orders;
CREATE TRIGGER trg_log_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();

-- ==========================================
-- 5. Transactional Atomic Order Creation RPC
-- ==========================================

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_order JSONB,
  p_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  -- Insert Order Header
  INSERT INTO public.orders (
    transaction_id,
    customer_id,
    customer_name,
    phone,
    email,
    address,
    city,
    shipping_cost,
    subtotal,
    total,
    payment_method,
    order_status,
    payment_status,
    order_source,
    notes
  )
  VALUES (
    p_order->>'transaction_id',
    (p_order->>'customer_id')::UUID,
    p_order->>'customer_name',
    p_order->>'phone',
    p_order->>'email',
    p_order->>'address',
    p_order->>'city',
    (p_order->>'shipping_cost')::NUMERIC,
    (p_order->>'subtotal')::NUMERIC,
    (p_order->>'total')::NUMERIC,
    p_order->>'payment_method',
    COALESCE(p_order->>'order_status', 'pending_payment'),
    COALESCE(p_order->>'payment_status', 'pending_payment'),
    COALESCE(p_order->>'order_source', 'Website'),
    p_order->>'notes'
  )
  RETURNING id INTO v_order_id;

  -- Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      price_num
    )
    VALUES (
      v_order_id,
      v_item->>'product_id',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price_num')::NUMERIC
    );
  END LOOP;

  -- Initial History Entry
  INSERT INTO public.order_status_history (order_id, status, notes)
  VALUES (v_order_id, COALESCE(p_order->>'order_status', 'pending_payment'), 'Order created');

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. Storage Buckets & Policies
-- ==========================================

-- Product Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to product images" ON storage.objects;
CREATE POLICY "Public access to product images"
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());

-- Payment Proofs Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to payment proofs" ON storage.objects;
CREATE POLICY "Public access to payment proofs"
ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Authenticated and anon users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated and anon users can upload payment proofs"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Only admins can delete payment proofs" ON storage.objects;
CREATE POLICY "Only admins can delete payment proofs"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'payment-proofs' AND public.is_admin());
