import { supabase } from '../supabase/supabase';

export interface Product {
  id: string;
  title: string;
  subcategory: string;
  category: string; // references Category slug
  price: string;
  priceNum: number;
  weight: string;
  location: string;
  harvest: string;
  status: 'in-stock' | 'out-of-stock';
  story: string;
  benefits: string[];
  storage: string;
  img: string;
  stock?: number;
  is_featured?: boolean;
}

export interface Category {
  slug: string;
  name: string;
  created_at?: string;
}

export interface Review {
  id: string;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface OrderInput {
  transaction_id: string;
  customer_name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  shipping_cost: number;
  subtotal: number;
  total: number;
  payment_method: string;
  notes?: string;
}

export interface OrderItemInput {
  product: { id: string; priceNum: number };
  quantity: number;
}

const staticReviews: Review[] = [
  {
    id: "rev-1",
    name: "রাশেদুল ইসলাম",
    location: "উত্তরা, ঢাকা",
    avatar: "রা",
    rating: 5,
    text: "সুন্দরবন হাটের খলিশা ফুলের মধু চমৎকার! আসল সুন্দরবনের মধুর যে সুগন্ধ আর মৃদু টক স্বাদ থাকে, তা এটার মধ্যে পুরোপুরি আছে। প্যাকেজিংও অসম্ভব ভালো ছিল।"
  },
  {
    id: "rev-2",
    name: "তাসনিম ফেরদৌস",
    location: "চট্টগ্রাম সদর",
    avatar: "তা",
    rating: 5,
    text: "আমি বাগদা চিংড়ি নিয়েছিলাম। বরফ দিয়ে একদম সতেজ অবস্থায় আমার কাছে পৌঁছেছে। কোনো কেমিক্যাল বা গন্ধ ছিল না। একদম ফ্রেশ নদীর চিংড়ির আসল মিষ্টি স্বাদ।"
  },
  {
    id: "rev-3",
    name: "সৈয়দ আহসান",
    location: "সিলেট জিন্দাবাজার",
    avatar: "স",
    rating: 5,
    text: "ঘানির সরিষার তেল অর্ডার করেছিলাম। বোতলের ছিপি খুলতেই ঝাঁঝালো সুন্দর ঘ্রাণ বের হয়েছে। রান্নাতেও খুব ভালো স্বাদ এসেছে। ওনাদের ব্যবহারও খুব আন্তরিক।"
  },
  {
    id: "rev-4",
    name: "ফারিহা সুলতানা",
    location: "রাজশাহী বিশ্ববিদ্যালয়",
    avatar: "ফ",
    rating: 5,
    text: "বাগানপাকা রূপালী আম নিয়েছিলাম। প্রতিটি আম একদম তাজা আর সুমিষ্ট ছিল। কোনো আম নষ্ট হয়নি। আগামী বছরও সুন্দরবন হাট থেকেই নিব।"
  }
];

const staticFaqs: Faq[] = [
  {
    id: "faq-1",
    question: "সুন্দরবন হাটের মধু সত্যিই ১০০% খাঁটি তো?",
    answer: "হ্যাঁ, আমরা শতভাগ নিশ্চয়তা দিচ্ছি। আমরা সুন্দরবনের মৌয়ালদের সাথে বনের ভেতরে গিয়ে মধু সংগ্রহ প্রত্যক্ষ করি। আমাদের মধুতে কোনো চিনি, কৃত্রিম মিষ্টি, ফ্লেভার বা রাসায়নিক পদার্থ মেশানো হয় না। এটি সরাসরি চাক থেকে চিপে নেওয়া কাঁচা প্রাকৃতিক মধু।"
  },
  {
    id: "faq-2",
    question: "মাছ এবং চিংড়িগুলো কীভাবে কুরিয়ার করা হয়? নষ্ট হবে না তো?",
    answer: "চিংড়ি এবং অন্যান্য মাছগুলো ধরার পরপরই মানসম্মত উপায়ে ধুয়ে পরিষ্কার করে প্লাস্টিক প্যাকেট করে বরফের লেয়ারসহ কর্ক শিটের বাক্সে সীলগালা করে কুরিয়ারে বুকিং করা হয়। এই বিশেষ কোল্ড চেইন প্যাকেজিংয়ের কারণে মাছ ২-৩ দিন পর্যন্ত একদম সতেজ থাকে।"
  },
  {
    id: "faq-3",
    question: "অর্ডার করার কত দিনের মধ্যে আমি পণ্য পাবো?",
    answer: "অর্ডার কনফার্ম করার পর ঢাকা সিটির ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি সম্পন্ন হয়। ঢাকার বাইরে কুরিয়ারের কন্ডিশন সার্ভিসের মাধ্যমে ২ থেকে ৪ দিন সময় লাগতে পারে। তবে হরতাল বা প্রাকৃতিক দুর্যোগে সময় সামান্য বেশি লাগতে পারে।"
  },
  {
    id: "faq-4",
    question: "পণ্য ভালো না লাগলে কি ফেরত দেওয়ার সুযোগ আছে?",
    answer: "অবশ্যই! পণ্য নেওয়ার পর যদি আপনার কাছে এর গুণগত মান সন্তোষজনক মনে না হয়, তবে আপনি তৎক্ষণাৎ কুরিয়ার পয়েন্টে আমাদের সাথে যোগাযোগ করে পণ্য ফেরত দিতে পারেন। সতেজ বা কাঁচা পণ্যের ক্ষেত্রে ডেলিভারির সময় অবশ্যই চেক করে রিসিভ করতে হবে।"
  }
];

// Unified Data Service layer communicating with Supabase
export const dataService = {
  // 1. Fetch products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }
    
    // Map database fields to front-end camelCase / exact shapes
    return (data || []).map(p => ({
      id: p.id,
      title: p.title,
      subcategory: p.subcategory,
      category: p.category,
      price: p.price,
      priceNum: Number(p.price_num),
      weight: p.weight,
      location: p.location,
      harvest: p.harvest,
      status: p.status as 'in-stock' | 'out-of-stock',
      story: p.story,
      benefits: p.benefits,
      storage: p.storage,
      img: p.img,
      stock: p.stock,
      is_featured: p.is_featured
    }));
  },

  // 2. Fetch single product by id
  async getProductById(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching product ${id} from Supabase:`, error);
      return undefined;
    }
    if (!data) return undefined;

    return {
      id: data.id,
      title: data.title,
      subcategory: data.subcategory,
      category: data.category,
      price: data.price,
      priceNum: Number(data.price_num),
      weight: data.weight,
      location: data.location,
      harvest: data.harvest,
      status: data.status as 'in-stock' | 'out-of-stock',
      story: data.story,
      benefits: data.benefits,
      storage: data.storage,
      img: data.img,
      stock: data.stock,
      is_featured: data.is_featured
    };
  },

  // 3. Fetch categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data || [];
  },

  // 4. Create checkout order (transacts order metadata & order items sequential)
  async createOrder(order: any, items: OrderItemInput[]): Promise<string> {
    // 4.1 Write to orders table
    const { data, error: orderError } = await supabase
      .from('orders')
      .insert({
        transaction_id: order.transaction_id,
        customer_name: order.customer_name,
        phone: order.phone,
        email: order.email || null,
        address: order.address,
        city: order.city,
        shipping_cost: order.shipping_cost,
        subtotal: order.subtotal,
        total: order.total,
        payment_method: order.payment_method,
        notes: order.notes || null,
        order_status: 'pending_payment',
        payment_status: 'pending',
        customer_id: order.customer_id || null
      })
      .select('id')
      .single();

    if (orderError || !data) {
      console.error('Error placing order metadata:', orderError);
      throw new Error(orderError?.message || 'Failed to place order.');
    }

    const dbOrderId = data.id;

    // 4.2 Write items to order_items table referencing the generated order UUID
    const orderItemsPayload = items.map(item => ({
      order_id: dbOrderId,
      product_id: item.product.id,
      quantity: item.quantity,
      price_num: item.product.priceNum
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsError) {
      console.error('Error placing order items:', itemsError);
      // Clean up orphaned order metadata on items failure
      await supabase.from('orders').delete().eq('id', dbOrderId);
      throw new Error(itemsError.message || 'Failed to register order items.');
    }

    return dbOrderId;
  },

  // 5. Submit contact query message
  async createContactMessage(message: { name: string; phone: string; email?: string; subject?: string; message: string }): Promise<void> {
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: message.name,
        phone: message.phone,
        email: message.email || null,
        subject: message.subject || null,
        message: message.message,
        status: 'unread'
      });

    if (error) {
      console.error('Error sending message:', error);
      throw new Error(error.message);
    }
  },

  // 6. Fetch reviews (static fallback, can be connected if desired)
  async getReviews(): Promise<Review[]> {
    return staticReviews;
  },

  // 7. Fetch FAQs
  async getFaqs(): Promise<Faq[]> {
    return staticFaqs;
  }
};

export const getImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // If the image is stored in Supabase Storage, it starts with 'storage/'
  // We resolve the public URL dynamically.
  if (path.startsWith('storage/')) {
    const cleanPath = path.replace('storage/', '');
    // e.g. path format: 'product-images/my-image.jpg'
    const bucket = cleanPath.split('/')[0];
    const file = cleanPath.replace(`${bucket}/`, '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(file);
    return data?.publicUrl || '';
  }

  // Fallback to local assets
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};
