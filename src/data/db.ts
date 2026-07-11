import productsData from './products.json';

export interface Product {
  id: string;
  title: string;
  subcategory: string;
  category: 'honey' | 'shrimp' | 'river_fish' | 'sea_fish' | 'oil' | 'grain' | 'fruit' | 'shutki';
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

// Local mock databases
const reviews: Review[] = [
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
    text: "ঘানির সরিষার তেল অর্ডার করেছিলাম। বোতলের ছিপি খুলতেই ঝাঁঝালো সুন্দর ঘ্রাণ বের হয়েছে। রান্নাতেও খুব ভালো স্বাদ এসেছে। ওদের ব্যবহারও খুব আন্তরিক।"
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

const faqs: Faq[] = [
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

// Asynchronous Data layer APIs (designed to resemble DB queries)
export async function getProducts(): Promise<Product[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return productsData as Product[];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const products = productsData as Product[];
  return products.find(p => p.id === id);
}

export async function getReviews(): Promise<Review[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return reviews;
}

export async function getFaqs(): Promise<Faq[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return faqs;
}
