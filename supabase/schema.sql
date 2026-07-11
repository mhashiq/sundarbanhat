-- ========================================================
-- Sundarban Hat - Database Schema & Migration Script
-- Target: Supabase (PostgreSQL)
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Table Definitions
-- ==========================================

-- Admin Users Table (UUID references auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- Slug-like ID (e.g. honey-kholisha) matching current logic
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
    img TEXT NOT NULL, -- Storage URL path or public HTTP URL
    stock INTEGER DEFAULT 10 NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    shipping_cost NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'bkash')),
    order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_num NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Contact Messages Table
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

-- ==========================================
-- 2. Indexes for Speed/Optimization
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON public.orders(transaction_id);

-- ==========================================
-- 3. RLS (Row Level Security) Configuration
-- ==========================================

-- Enable RLS on all public tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Helper security function to verify admin access
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.1 Policies for Admin Users
DROP POLICY IF EXISTS "Admins can view admins" ON public.admin_users;
CREATE POLICY "Admins can view admins" 
ON public.admin_users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify admin list" ON public.admin_users;
CREATE POLICY "Only admins can modify admin list" 
ON public.admin_users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow anyone to insert themselves as admin for setup" ON public.admin_users;
CREATE POLICY "Allow anyone to insert themselves as admin for setup" 
ON public.admin_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3.2 Policies for Categories
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" 
ON public.categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify categories" ON public.categories;
CREATE POLICY "Only admins can modify categories" 
ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.3 Policies for Products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify products" ON public.products;
CREATE POLICY "Only admins can modify products" 
ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.4 Policies for Orders & Items
DROP POLICY IF EXISTS "Anyone can place orders" ON public.orders;
CREATE POLICY "Anyone can place orders" 
ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view/manage orders" ON public.orders;
CREATE POLICY "Only admins can view/manage orders" 
ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" 
ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view order items" ON public.order_items;
CREATE POLICY "Only admins can view order items" 
ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3.5 Policies for Contact Messages
DROP POLICY IF EXISTS "Anyone can send contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can send contact messages" 
ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can manage messages" ON public.contact_messages;
CREATE POLICY "Only admins can manage messages" 
ON public.contact_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- 4. Seed Initial Data
-- ==========================================

-- Seeding Categories
INSERT INTO public.categories (slug, name) VALUES
('honey', 'সুন্দরবনের খাঁটি মধু'),
('shrimp', 'তাজা চিংড়ি ও মাছ'),
('fruit', 'মৌসুমি ফল'),
('oil', 'খাঁটি তেল'),
('grain', 'দেশি চাল ও শস্য'),
('shutki', 'শুঁটকি ও সামুদ্রিক পণ্য'),
('river_fish', 'নদীর তাজা মাছ'),
('sea_fish', 'সামুদ্রিক মাছ')
ON CONFLICT (slug) DO NOTHING;

-- Seeding Products
INSERT INTO public.products (id, title, subcategory, category, price, price_num, weight, location, harvest, status, story, benefits, storage, img, stock, is_featured) VALUES
(
  'honey-kholisha',
  'সুন্দরবনের খাঁটি খলিশা মধু',
  'সুন্দরবনের খাঁটি মধু',
  'honey',
  '৳৮৫০',
  850,
  '৫০০ গ্রাম',
  'গহীন সুন্দরবন',
  'মে ২০২৬',
  'in-stock',
  'মৌয়ালদের মাধ্যমে বাঘের রাজত্ব সুন্দরবনের গভীর ম্যানগ্রোভ থেকে সরাসরি সংগৃহীত খলিশা ফুলের চাক ভাঙ্গা মধু। এটি সম্পূর্ণ প্রাকৃতিক ও ভেজালমুক্ত, যা আপনার রোগ প্রতিরোধ ক্ষমতা এবং শক্তি বৃদ্ধিতে সাহায্য করবে। খলিশা মধুর বিশেষ সোনালী রঙ এবং হালকা মিষ্টি সুগন্ধ থাকে যা এটিকে অত্যন্ত প্রিমিয়াম করে তোলে।',
  ARRAY[
    '১০০% খাঁটি ও সুন্দরবনের আসল খলিশা মধু।',
    'রোগ প্রতিরোধ ক্ষমতা ও শারীরিক এনার্জি বাড়াতে অত্যন্ত কার্যকর।',
    'শ্বাসকষ্ট, সর্দি ও কাশির নিরাময়ে অত্যন্ত সহায়ক।',
    'কৃত্রিম চিনি, প্রিজারভেটিভ বা ফ্লেভার মুক্ত শতভাগ প্রাকৃতিক।'
  ],
  'সাধারণ তাপমাত্রায় কাঁচের বোতলে মুখ ভালো করে আটকে শুষ্ক স্থানে সংরক্ষণ করুন। ফ্রিজে রাখার প্রয়োজন নেই। রোদ থেকে দূরে রাখুন।',
  '/honey-box.png',
  25,
  true
),
(
  'honey-goran',
  'সুন্দরবনের গরান ফুলের মধু',
  'সুন্দরবনের খাঁটি মধু',
  'honey',
  '৳৯০০',
  900,
  '৫০০ গ্রাম',
  'গহীন সুন্দরবন',
  'এপ্রিল ২০২৬',
  'in-stock',
  'সুন্দরবনের গরান গাছের ফুল থেকে সংগৃহীত লালচে রঙের কড়া মিষ্টি স্বাদের মধু। খলিশা মধুর তুলনায় এটি কিছুটা ঘন ও এর সুগন্ধ অত্যন্ত তীব্র ও আকর্ষণীয়। গরান মধু উচ্চ মানের অ্যান্টি-অক্সিডেন্ট সমৃদ্ধ যা বার্ধক্য রোধ করতে এবং কোষের সুরক্ষা দিতে কাজ করে।',
  ARRAY[
    'রক্ত পরিষ্কার করতে এবং হজম ক্ষমতা বাড়াতে সাহায্য করে।',
    'ত্বকের উজ্জ্বলতা বৃদ্ধিতে ও দ্রুত ক্ষত নিরাময়ে উপকারী।',
    'উচ্চ অ্যান্টি-অক্সিডেন্ট সমৃদ্ধ খাঁটি কাঁচা মধু।'
  ],
  'বোতলের ছিপি ভালো করে আটকে রাখুন। পিঁপড়ার আক্রমণ থেকে বাঁচতে শুষ্ক স্থানে রাখুন। ফ্রিজে রাখবেন না।',
  '/comingsoon.png',
  15,
  false
),
(
  'prawn-premium',
  'প্রিমিয়াম বাগদা চিংড়ি',
  'তাজা চিংড়ি ও মাছ',
  'shrimp',
  '৳৯০০',
  900,
  '৫০০ গ্রাম',
  'শ্যামনগর উপকূলীয় ঘের',
  'জুলাই ২০২৬',
  'in-stock',
  'শ্যামনগরের লোনা পানির প্রাকৃতিক ঘের থেকে প্রতিদিন ভোরে সংগৃহীত তাজা বাগদা চিংড়ি। কোনো কৃত্রিম কেমিক্যাল বা প্রিজারভেটিভ ছাড়া সম্পূর্ণ প্রাকৃতিক শৈবাল ও প্ল্যাঙ্কটন খেয়ে বড় হওয়া তাজা চিংড়ি। আমাদের চিংড়িগুলো মিষ্টি লোনা পানির কারণে অত্যন্ত সুস্বাদু ও পুষ্টিকর হয়ে থাকে।',
  ARRAY[
    'সরাসরি শ্যামনগরের লোনা ঘের থেকে সতেজ আহরণ ও কুরিয়ার।',
    '১০০% প্রিজারভেটিভ, ফরমালিন এবং ইউরিয়া মুক্ত।',
    'অত্যಂತ নরম, সুস্বাদু ও ঘিলু সমৃদ্ধ প্রিমিয়াম চিংড়ি।'
  ],
  'পণ্যটি হাতে পাওয়ার সাথে সাথে ডিপ ফ্রিজে সংরক্ষণ করুন। রান্নার কিছুক্ষণ আগে ফ্রিজ থেকে বের করে ধুয়ে নিন।',
  '/prawn.jpg',
  40,
  true
),
(
  'prawn-golda',
  'প্রিমিয়াম গলদা চিংড়ি',
  'তাজা চিংড়ি ও মাছ',
  'shrimp',
  '৳১০০০',
  1000,
  '৫০০ গ্রাম',
  'সাতক্ষীরা নদী সংলগ্ন মিষ্টি ঘের',
  'জুলাই ২০২৬',
  'in-stock',
  'সাতক্ষীরার মিষ্টি ও আধা-লোনা জলের নদী ও সংলগ্ন ঘের থেকে সংগৃহীত বড় আকারের গলদা চিংড়ি। এর নরম মাংস ও মাথার ভেতরের পুষ্টিকর হলুদ ঘিলু তরকারির স্বাদ বাড়ে। আমরা সরাসরি ঘের মালিকদের থেকে এটি সংগ্রহ করি।',
  ARRAY[
    'প্রাকৃতিক ও নিরাপদ চাষ পদ্ধতিতে বড় হওয়া চিংড়ি।',
    'উচ্চ মানের ওমেগা-৩ ও খনিজ উপাদান সমৃদ্ধ।',
    'ক্যালসিয়াম ও ভিটামিন বি-১২ এর চমৎকার প্রাকৃতিক উৎস।'
  ],
  'ডিপ ফ্রিজে মাইনাস তাপমাত্রায় দীর্ঘদিন সংরক্ষণ করা সম্ভব।',
  '/comingsoon.png',
  10,
  false
),
(
  'shutki-prawn',
  'চিংড়ি শুঁটকি (হাতে কাটা)',
  'শুঁটকি ও সামুদ্রিক পণ্য',
  'shutki',
  '৳৮০০',
  800,
  '৫০০ গ্রাম',
  'শ্যামনগর কুরিয়ার হাব',
  'জুন ২০২৬',
  'in-stock',
  'উপকূলের তাজা বাগদা চিংড়ি ভালো করে ধুয়ে খোলস ও মাথা ছাড়িয়ে হাতে কেটে রোদে শুকিয়ে প্রস্তুত করা অসাধারণ চিংড়ি শুঁটকি। শুঁটকিটি সম্পূর্ণ শুকানো ও বালুহীন, যাতে কুরিয়ারের পর দীর্ঘদিন ভালো থাকে। এতে কোনো কীটনাশক বা রাসায়নিক দেওয়া হয় না।',
  ARRAY[
    '১০০% প্রাকৃতিকভাবে রোদে শুকানো পরিষ্কার শুঁটকি।',
    'কোনো ক্ষতিকর প্রিজারভেটিভ বা অতিরিক্ত লবণ নেই।',
    'ভর্তা ও ডাল-সবজি রান্নায় দেয় অসাধারণ মিষ্টি স্বাদ।'
  ],
  'বায়ুরোধী বয়ামে ভরে নরমাল ফ্রিজে রেখে ৫-৬ মাস সংরক্ষণ করতে পারেন।',
  '/comingsoon.png',
  30,
  true
),
(
  'mango-rupali',
  'সাতক্ষীরার বিখ্যাত আম (রূপালী)',
  'মৌসুমি ফল',
  'fruit',
  '৳৪৫০',
  450,
  '৫ কেজি',
  'দেবহাটা আম বাগান, সাতক্ষীরা',
  'জুন ২০২৬',
  'in-stock',
  'ফরমালিনমুক্ত, সরাসরি দেবহাটার বাগান থেকে সংগৃহীত সুমিষ্ট রূপালী আম। রাসায়নিক কার্বাইড ছাড়াই গাছপাকা অত্যন্ত রসালো ও সুস্বাদু আম। সাতক্ষীরার আম স্বাদে অনন্য মিষ্টি হয়ে থাকে।',
  ARRAY[
    'সরাসরি সাতক্ষীরার আম বাগান থেকে সংগৃহীত ও প্যাকিং।',
    'কার্বাইড, ইথ্রেল ও ফরমালিন মুক্ত সম্পূর্ণ নিরাপদ আম।',
    'সুমিষ্ট ও রসালো স্বাদের প্রিমিয়াম আম।'
  ],
  'পণ্য পৌঁছানোর পর কার্টন থেকে বের করে ঠাণ্ডা ও শুষ্ক স্থানে ছড়িয়ে রাখুন। আম সম্পূর্ণ পেকে নরম হলে ফ্রিজে রাখতে পারেন।',
  '/mango.JPG',
  50,
  true
),
(
  'mustard-oil',
  'কাঠের ঘানির সরিষার তেল',
  'খাঁটি তেল',
  'oil',
  '৳৩৫০',
  350,
  '১ লিটার',
  'আশাশুনি সরিষা মিল, সাতক্ষীরা',
  'জুলাই ২০২৬',
  'in-stock',
  'দেশি লাল ও মাঘী সরিষা দানা রোদে শুকিয়ে কাঠের ঘানিতে ভাঙানো খাঁটি ও ঝাঁঝালো সরিষার তেল। এর ফলে সরিষার সমস্ত প্রাকৃতিক ভিটামিন ও খনিজ উপাদান অক্ষত থাকে। রান্নায় আনে ঐতিহ্যবাহী আসল ঘ্রাণ ও ঝাঁঝ।',
  ARRAY[
    'কাঠের ঘানিতে ভাঙানো খাঁটি ও কোল্ড-প্রেসড তেল।',
    'কোনো সস্তা পাম বা সয়াবিন তেল মেশানো হয়নি।',
    'শরীরের রক্ত সঞ্চালন বাড়াতে ও রান্নায় খাঁটি স্বাদ আনতে সেরা।'
  ],
  'সরাসরি সূর্যের আলো থেকে দূরে অন্ধকার ও শুষ্ক বোতলে মুখ বন্ধ করে রাখুন।',
  '/comingsoon.png',
  20,
  false
),
(
  'rice-atop',
  'উপকূলের খাঁটি আতপ চাল',
  'দেশি চাল ও শস্য',
  'grain',
  'আসন্ন (স্টক আউট)',
  0,
  '৫ কেজি',
  'শ্যামনগর ধানের মাঠ',
  'ডিসেম্বর ২০২৬',
  'out-of-stock',
  'উপকূলের উর্বর পলল মাটিতে কোনো ক্ষতিকর ইউরিয়া পলিশ বা কৃত্রিম রঙ ছাড়াই প্রাকৃতিকভাবে উৎপাদিত উর্বর ও সুগন্ধি দেশি আতপ চাল। (নতুন চাল আসার পর স্টক করা হবে)',
  ARRAY[
    'উপকূলের খাঁটি উর্বর মাটির উৎপাদন।',
    'পলিশ ছাড়া সম্পূর্ণ লালচে চালের ফাইবার ও পুষ্টিগুণ অটুট।',
    'পিঠা, পায়েস ও দেশি খিচুড়ি রান্নার জন্য সেরা সুগন্ধি চাল।'
  ],
  'শুষ্ক ও বায়ুরোধী বয়ামে রাখুন যাতে চালের পোকা না ধরে। মাঝে মাঝে রোদে শুকিয়ে নিতে পারেন।',
  '/rice.png',
  0,
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  price_num = EXCLUDED.price_num,
  status = EXCLUDED.status,
  stock = EXCLUDED.stock;

-- =========================================================================
-- 5. Automate admin creation trigger helper (copies new auth signup into public table if designated as admin)
-- =========================================================================

-- Trigger to automatically sync profiles
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

-- To enable automatic admin sync for testing
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
