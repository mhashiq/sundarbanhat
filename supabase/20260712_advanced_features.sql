-- ========================================================
-- Sundarban Hat - Database Schema v3 (Advanced Features Migration)
-- Target: Supabase (PostgreSQL)
-- Adds public.settings for configuration, and advanced fields to public.orders
-- ========================================================

-- 1. Create Settings Table for Dynamic Configurations
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Populate Default Social Media URLs
INSERT INTO public.settings (key, value) VALUES
  ('facebook_url', 'https://facebook.com/sundarbanhat'),
  ('instagram_url', 'https://instagram.com/sundarbanhat'),
  ('tiktok_url', ''),
  ('youtube_url', ''),
  ('whatsapp_number', '+8801873520181')
ON CONFLICT (key) DO NOTHING;

-- 3. Configure Row Level Security (RLS) on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;
CREATE POLICY "Allow public read settings" 
ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write settings" ON public.settings;
CREATE POLICY "Allow admin write settings" 
ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Add Advanced Payment and Tracking Columns to Orders Table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_source TEXT DEFAULT 'Website' CHECK (order_source IN ('Website', 'Facebook', 'Instagram', 'TikTok', 'WhatsApp', 'Messenger', 'Phone Call', 'Walk-in Customer', 'Other'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS advance_paid_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS due_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_paid_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_collection_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_received_by TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_received_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof_image TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 5. Create storage bucket for payment-proofs if not exists
-- (This is usually done via Supabase Dashboard, but running SQL helps configure policies)
-- The bucket name is 'payment-proofs'. We grant public select and authenticated upload.
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'payment-proofs' bucket
DROP POLICY IF EXISTS "Public access to payment proofs" ON storage.objects;
CREATE POLICY "Public access to payment proofs"
ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Only admins can delete payment proofs" ON storage.objects;
CREATE POLICY "Only admins can delete payment proofs"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'payment-proofs' AND public.is_admin());
