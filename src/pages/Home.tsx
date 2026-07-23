import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataService, getImageUrl } from '../services/dataService';
import type { Product, Review, Faq } from '../services/dataService';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart } from 'lucide-react';
import { trackViewItemList, trackSelectItem } from '../analytics/analytics';
import { SundarbanJourneySection } from '../components/SundarbanJourneySection';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  const { addToCart, wishlistItems, addToWishlist, removeFromWishlist } = useCart();

  // Statistics counters
  const [stats, setStats] = useState({ clients: 0, villages: 0, districts: 0, purity: 0 });

  // 1. Track GA4 view_item_list event
  useEffect(() => {
    if (filteredProducts.length > 0) {
      const listName = activeFilter === 'all' 
        ? 'Homepage Featured Products' 
        : `Homepage Category: ${activeFilter}`;
      trackViewItemList(filteredProducts, listName);
    }
  }, [filteredProducts, activeFilter]);

  const handleSelectProduct = (product: Product, index: number) => {
    const listName = activeFilter === 'all' 
      ? 'Homepage Featured Products' 
      : `Homepage Category: ${activeFilter}`;
    trackSelectItem(product, index + 1, listName);
  };

  useEffect(() => {
    // Fetch DB records
    dataService.getProducts().then(prods => {
      setProducts(prods);
      setFilteredProducts(prods);
    });
    dataService.getReviews().then(setReviews);
    dataService.getFaqs().then(setFaqs);
  }, []);

  // Stats count up simulation on mount
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setStats({
        clients: Math.min(Math.floor((10000 / steps) * step), 10000),
        villages: Math.min(Math.floor((30 / steps) * step), 30),
        districts: Math.min(Math.floor((64 / steps) * step), 64),
        purity: Math.min(Math.floor((100 / steps) * step), 100)
      });

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Product Category Filter Handler
  const handleFilter = (category: string) => {
    setActiveFilter(category);
    if (category === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === category));
    }
  };

  const toggleFaq = (id: string) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  // Structured Data Schema for FAQ & local business SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  const heroSlides = [
    {
      img: '/sundarbanboat.jpg',
      tag: '🍃 সুন্দরবনের প্রাকৃতিক খাদ্য',
      title: 'সুন্দরবনের খাঁটি স্বাদ,\nসরাসরি আপনার ঘরে',
      desc: 'সুন্দরবনের গহীন বন ও লোনা পানির ঘের থেকে সংগৃহীত ১০০% নিরাপদ পণ্য।'
    },
    {
      img: '/honey.webp',
      tag: '🍯 ১০০% খাঁটি কাঁচা মধু',
      title: 'পাহাড় ও বনের খলিশা মধু,\nপ্রাকৃতিক ও বিশুদ্ধ সুবাস',
      desc: 'কোনো তাপ বা চিনি ছাড়া প্রাকৃতিক ধোঁয়া পদ্ধতিতে সরাসরি চাক ভাঙা।'
    },
    {
      img: '/prawn.jpg',
      tag: '🦐 তাজা বাগদা ও গলদা চিংড়ি',
      title: 'সাতক্ষীরার সতেজ চিংড়ি,\nবরফ শীতল সতেজ ডেলিভারি',
      desc: 'শ্যামনগরের লোনা ঘের থেকে তুলে দ্রুততম ডেলিভারি ব্যবস্থা।'
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <>
      <Helmet>
        <title>সুন্দরবন হাট - সুন্দরবনের খাঁটি স্বাদ, সরাসরি আপনার ঘরে</title>
        <meta name="description" content="সুন্দরবন হাট (Sundarban Hat) - শ্যামনগর, সাতক্ষীরা থেকে সরাসরি সংগৃহীত ১০০% খাঁটি খলিশা মধু, তাজা বাগদা চিংড়ি, কাঠের ঘানির সরিষার তেল এবং উপকূলীয় খাঁটি খাদ্যপণ্য।" />
        <meta name="keywords" content="সুন্দরবন হাট, খলিশা মধু, সুন্দরবনের মধু, চিংড়ি, বাগদা চিংড়ি, ঘানির সরিষার তেল, সাতক্ষীরার আম, অর্গানিক ফুড, উপকূলীয় খাদ্য" />
        <link rel="canonical" href="https://sundarbanhat.com/" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* Optimized Compact Mobile & Desktop Hero Slider */}
      <section className="sh-hero-slider">
        <style>{`
          .sh-hero-slider {
            position: relative;
            height: clamp(420px, 65vh, 600px);
            max-height: 640px;
            overflow: hidden;
            color: #FFFFFF;
            font-family: 'Hind Siliguri', sans-serif;
            background: #072211;
          }
          .sh-hero-slide-bg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: opacity 0.8s ease-in-out;
            z-index: 1;
          }
          .sh-hero-slide-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(7, 34, 17, 0.45) 0%, rgba(7, 34, 17, 0.88) 100%);
            z-index: 2;
          }
          .sh-hero-slide-content {
            position: relative;
            z-index: 3;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 24px 50px;
            max-width: 760px;
            margin: 0 auto;
          }
          .sh-hero-logo {
            width: clamp(90px, 18vw, 130px);
            max-height: 64px;
            object-fit: contain;
            margin-bottom: 14px;
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.35));
          }
          .sh-hero-tag {
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--color-honey);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
          }
          .sh-hero-heading {
            font-size: clamp(1.8rem, 5.5vw, 2.9rem);
            font-weight: 800;
            line-height: 1.25;
            color: #FFFFFF;
            margin-bottom: 12px;
            text-shadow: 0 3px 16px rgba(0,0,0,0.45);
            white-space: pre-line;
          }
          .sh-hero-sub {
            font-size: clamp(0.92rem, 2.8vw, 1.08rem);
            color: #E2E8F0;
            margin-bottom: 24px;
            line-height: 1.6;
            max-width: 580px;
          }
          .sh-hero-btns {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
          }
          .sh-hero-btn-main {
            background: linear-gradient(135deg, #2E7D32, #15803D);
            color: #FFFFFF;
            padding: 13px 28px;
            border-radius: 99px;
            font-weight: 800;
            font-size: 1rem;
            text-decoration: none;
            box-shadow: 0 6px 20px rgba(46, 125, 50, 0.45);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
          }
          .sh-hero-btn-sec {
            background: rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(8px);
            color: #FFFFFF;
            padding: 13px 24px;
            border-radius: 99px;
            font-weight: 700;
            font-size: 0.95rem;
            text-decoration: none;
            border: 1px solid rgba(255, 255, 255, 0.35);
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .sh-hero-dots {
            position: absolute;
            bottom: 18px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 4;
            display: flex;
            gap: 8px;
          }
          .sh-hero-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 0;
          }
          .sh-hero-dot.active {
            width: 22px;
            border-radius: 99px;
            background: #FFFFFF;
          }
        `}</style>

        {heroSlides.map((slide, idx) => (
          <img
            key={idx}
            src={getImageUrl(slide.img)}
            alt={slide.title}
            className="sh-hero-slide-bg"
            style={{ opacity: currentSlide === idx ? 1 : 0 }}
          />
        ))}

        <div className="sh-hero-slide-overlay" />

        <div className="sh-hero-slide-content">
          <img src="/logo.png" alt="সুন্দরবন হাট" className="sh-hero-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="sh-hero-tag">{heroSlides[currentSlide].tag}</span>
          <h1 className="sh-hero-heading">{heroSlides[currentSlide].title}</h1>
          <p className="sh-hero-sub">{heroSlides[currentSlide].desc}</p>
          <div className="sh-hero-btns">
            <Link to="/products" className="sh-hero-btn-main">
              🛍️ এখনই কিনুন
            </Link>
            <Link to="/products" className="sh-hero-btn-sec">
              📦 সব পণ্য
            </Link>
          </div>
        </div>

        <div className="sh-hero-dots">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              className={`sh-hero-dot ${currentSlide === idx ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Wave Transition */}
      <div className="wave-divider" style={{ color: 'var(--color-sand)', marginTop: '-60px' }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z"></path>
        </svg>
      </div>



      {/* Alternating Pinterest Magazine Product Section */}
      <section className="section" style={{ backgroundColor: 'var(--color-sand)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">কাঠের ক্রেট সংগ্রহ</span>
            <h2 className="section-title">আমাদের কাঁচা পণ্যসম্ভার</h2>
            <p className="section-desc">জেলেদের কাঠের মাছের বাক্সের আদলে ডিজাইন করা আমাদের প্রিমিয়াম কার্ড।</p>
          </div>

          {/* Filter Chips */}
          <div className="filter-chips-row">
            <button className={`filter-chip-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>সব পণ্য ({products.length})</button>
            <button className={`filter-chip-btn ${activeFilter === 'honey' ? 'active' : ''}`} onClick={() => handleFilter('honey')}>মধু</button>
            <button className={`filter-chip-btn ${activeFilter === 'shrimp' ? 'active' : ''}`} onClick={() => handleFilter('shrimp')}>তাজা চিংড়ি</button>
            <button className={`filter-chip-btn ${activeFilter === 'fruit' ? 'active' : ''}`} onClick={() => handleFilter('fruit')}>ফল</button>
            <button className={`filter-chip-btn ${activeFilter === 'oil' ? 'active' : ''}`} onClick={() => handleFilter('oil')}>খাঁটি তেল</button>
            <button className={`filter-chip-btn ${activeFilter === 'grain' ? 'active' : ''}`} onClick={() => handleFilter('grain')}>দেশি চাল</button>
          </div>

          {/* Pinterest Magazine Layout Grid */}
          <div className="magazine-pinterest-layout">
            {filteredProducts.map((prod, idx) => (
              <div key={prod.id} className="magazine-item-container">
                <div className="wooden-crate-card" style={{ position: 'relative' }}>
                  
                  {/* Wishlist Button Overlay */}
                  <button
                    onClick={() => {
                      if (wishlistItems.some(p => p.id === prod.id)) {
                        removeFromWishlist(prod.id);
                      } else {
                        addToWishlist(prod);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '45px',
                      right: '15px',
                      zIndex: 10,
                      background: 'rgba(252, 250, 245, 0.9)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                      color: wishlistItems.some(p => p.id === prod.id) ? '#e53935' : 'gray'
                    }}
                    title={wishlistItems.some(p => p.id === prod.id) ? 'পছন্দের তালিকা থেকে বাদ দিন' : 'পছন্দের তালিকায় যোগ করুন'}
                  >
                    <Heart size={16} fill={wishlistItems.some(p => p.id === prod.id) ? '#e53935' : 'none'} />
                  </button>

                  <div className="crate-header-bar">
                    <span>CRATE #SH-00{idx + 1}</span>
                    <span style={{ color: prod.status === 'in-stock' ? '#64dd17' : '#F39C12' }}>
                      ● {prod.status === 'in-stock' ? 'ইন স্টক' : 'আসন্ন'}
                    </span>
                  </div>
                  
                  <div className="crate-image-container">
                    <span className="crate-status-tag">{prod.subcategory}</span>
                    <Link to={`/product/${prod.id}`} onClick={() => handleSelectProduct(prod, idx)}>
                      <img src={getImageUrl(prod.img)} alt={prod.title} loading="lazy" />
                    </Link>
                  </div>

                  <div className="crate-body-content">
                    <div className="crate-info-row">
                      <span>📍 {prod.location}</span>
                      <span>📅 {prod.harvest}</span>
                    </div>
                    <h3 className="crate-prod-title">
                      <Link to={`/product/${prod.id}`} onClick={() => handleSelectProduct(prod, idx)}>
                        {prod.title}
                      </Link>
                    </h3>
                    <p className="crate-story-teaser">{prod.story.substring(0, 85)}...</p>
                    
                    <div className="crate-footer-row" style={{ marginBottom: '15px' }}>
                      <div className="crate-price-block">
                        <span style={{ fontSize: '0.75rem', color: 'gray' }}>মূল্য</span>
                        <span className="crate-price-val">{prod.price}</span>
                      </div>
                      <span className="crate-weight-val">{prod.weight}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                      <button 
                        onClick={() => addToCart(prod, 1)}
                        className="btn btn-primary"
                        style={{
                          padding: '8px', 
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <ShoppingCart size={15} /> ঝুড়িতে যোগ করুন
                      </button>
                      <Link 
                        to={`/product/${prod.id}`} 
                        onClick={() => handleSelectProduct(prod, idx)}
                        className="btn btn-outline" 
                        style={{ padding: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        বিস্তারিত
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sundarban to Table Journey Storytelling Section */}
      <SundarbanJourneySection />

      {/* Parallax Village life documentary */}
      <section className="section" style={{ padding: 0, position: 'relative' }}>
        <div style={{
          height: '450px',
          backgroundImage: `linear-gradient(rgba(7, 34, 17, 0.75), rgba(7, 34, 17, 0.85)), url(${getImageUrl('/sundarbanboat.jpg')})`,
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '0 20px'
        }}>
          <div style={{ maxWidth: '750px' }}>
            <span style={{ color: 'var(--color-honey)', fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontSize: '1.2rem' }}>উপকূলের জীবন</span>
            <h2 style={{ color: 'white', fontSize: '2.5rem', margin: '15px 0', fontWeight: 800 }}>শ্যামনগরের মাঠ ও সুন্দরবনের মানুষের পাশে</h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: '1.8' }}>
              আপনার প্রতিটি ক্রয় সাতক্ষীরা উপকূলীয় প্রান্তিক মৌয়াল, মৎস্যজীবী ও কৃষকদের অর্থনৈতিক স্বাবলম্বিতা বৃদ্ধি করে। আমরা সঠিক পারিশ্রমিক ও নিরাপদ কর্মসংস্থান নিশ্চিতে প্রতিশ্রুতিবদ্ধ।
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic statistics section */}
      <section className="section" style={{ backgroundColor: 'var(--color-forest-dark)', color: 'white' }}>
        <div className="container">
          <div className="statistics-grid-row">
            <div className="statistic-stat-block">
              <div className="statistic-num">{stats.clients.toLocaleString()}+</div>
              <div className="statistic-lbl">সন্তুষ্ট গ্রাহক</div>
            </div>
            <div className="statistic-stat-block">
              <div className="statistic-num">{stats.villages}+</div>
              <div className="statistic-lbl">সংগৃহীত গ্রাম</div>
            </div>
            <div className="statistic-stat-block">
              <div className="statistic-num">{stats.districts}</div>
              <div className="statistic-lbl">জেলায় হোম ডেলিভারি</div>
            </div>
            <div className="statistic-stat-block">
              <div className="statistic-num">{stats.purity}%</div>
              <div className="statistic-lbl">প্রাকৃতিক নিশ্চয়তা</div>
            </div>
          </div>
        </div>
      </section>

      {/* SVG Bangladesh Map & Delivery Section */}
      <section className="section" style={{ backgroundColor: 'var(--color-sand)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">ডেলিভারি মানচিত্র</span>
            <h2 className="section-title">সমগ্র বাংলাদেশে দ্রুত ডেলিভারি</h2>
            <p className="section-desc">শ্যামনগর সুন্দরবন হাব থেকে কুরিয়ারের মাধ্যমে আমরা অত্যন্ত দ্রুত আপনার ঠিকানায় পণ্য পৌঁছে দিই।</p>
          </div>

          <div className="delivery-split-row">
            <div className="delivery-map-panel">
              {/* Bangladesh Interactive SVG Map */}
              <svg className="map-bangladesh-svg" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M190 40 L210 30 L230 40 L260 50 L270 70 L265 90 L285 100 L300 120 L290 140 L310 160 L320 180 L350 200 L340 220 L355 250 L380 280 L360 300 L370 330 L390 350 L380 370 L350 360 L345 385 L350 410 L330 430 L320 460 L300 450 L290 420 L280 435 L270 410 L250 415 L230 395 L210 390 L180 380 L160 390 L140 370 L120 375 L100 360 L85 365 L80 340 L95 330 L90 310 L70 290 L75 270 L90 250 L85 220 L100 200 L110 170 L95 150 L115 130 L135 120 L130 100 L145 80 L160 70 L170 50 Z" fill="#E6DFD3" stroke="var(--color-mangrove)" strokeWidth="2" />
                
                {/* Shyamnagar, Satkhira (Pulsing Origin) */}
                <circle cx="120" cy="360" r="8" fill="var(--color-honey)" stroke="var(--color-forest-dark)" strokeWidth="2">
                  <animate attributeName="r" values="8;14;8" dur="2.5s" repeatCount="indefinite" />
                </circle>

                {/* Main Cities */}
                <circle cx="195" cy="220" r="5" fill="var(--color-mangrove)" />
                <circle cx="295" cy="330" r="5" fill="var(--color-mangrove)" />
                <circle cx="300" cy="130" r="5" fill="var(--color-mangrove)" />
                <circle cx="100" cy="175" r="5" fill="var(--color-mangrove)" />

                {/* Animated Routes */}
                <path d="M120 360 Q150 290 195 220" stroke="var(--color-honey)" strokeWidth="2" strokeDasharray="5 5" fill="none">
                  <animate attributeName="stroke-dashoffset" values="50;0" dur="3s" repeatCount="indefinite" />
                </path>
                <path d="M120 360 Q200 360 295 330" stroke="var(--color-honey)" strokeWidth="2" strokeDasharray="5 5" fill="none">
                  <animate attributeName="stroke-dashoffset" values="50;0" dur="4s" repeatCount="indefinite" />
                </path>
                <path d="M120 360 Q210 230 300 130" stroke="var(--color-honey)" strokeWidth="2" strokeDasharray="5 5" fill="none">
                  <animate attributeName="stroke-dashoffset" values="50;0" dur="4.5s" repeatCount="indefinite" />
                </path>
                <path d="M120 360 Q105 270 100 175" stroke="var(--color-honey)" strokeWidth="2" strokeDasharray="5 5" fill="none">
                  <animate attributeName="stroke-dashoffset" values="50;0" dur="3.5s" repeatCount="indefinite" />
                </path>

                <text x="65" y="380" fontSize="10" fontWeight="bold" fill="var(--color-forest-dark)">শ্যামনগর হাব</text>
                <text x="205" y="224" fontSize="10" fontWeight="bold" fill="var(--color-forest-dark)">ঢাকা</text>
                <text x="295" y="348" fontSize="10" fontWeight="bold" fill="var(--color-forest-dark)">চট্টগ্রাম</text>
              </svg>
            </div>

            {/* Delivery Info blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'var(--color-white)', padding: '24px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ color: 'var(--color-forest-dark)', marginBottom: '8px' }}>🚚 ঢাকা সিটিতে হোম ডেলিভারি</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-light)' }}>
                  ঢাকার ভেতরে আমাদের নিজস্ব ডেলিভারি পার্টনারের মাধ্যমে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে সরাসরি আপনার ঘরে পণ্য পৌঁছে দেওয়া হয়।
                </p>
              </div>

              <div style={{ background: 'var(--color-white)', padding: '24px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ color: 'var(--color-forest-dark)', marginBottom: '8px' }}>📦 ঢাকার বাইরে সমগ্র বাংলাদেশ</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-light)' }}>
                  সুন্দরবন কুরিয়ার, কর্ডিশন সার্ভিস অথবা রেডএক্স হোম কুরিয়ারের মাধ্যমে ৩-৪ কার্যদিবসের মধ্যে দেশের ৬৪টি জেলায় ডেলিভারি দেওয়া হয়।
                </p>
              </div>

              <div style={{ background: 'var(--color-white)', padding: '24px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ color: 'var(--color-forest-dark)', marginBottom: '8px' }}>❄️ কোল্ড চেইন ফ্রেশ মাছ পরিবহন</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-light)' }}>
                  চিংড়ি ও মাছগুলো তাজা অবস্থায় প্যাকেট করে কর্কশিট বক্সে পর্যাপ্ত বরফের কুচি দিয়ে সীলগালা করে পাঠানো হয়, যা ৩৬ ঘণ্টার বেশি মাছকে রাখে তাজা।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Postcard Testimonials Section */}
      <section className="section" style={{ backgroundColor: '#F0EAE1', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">আমাদের শুভানুধ্যায়ী</span>
            <h2 className="section-title">গ্রাহকদের পোস্টকার্ড মতামত</h2>
            <p className="section-desc">হাতে লেখা চিঠির ছোঁয়ায় ও পুরনো স্মৃতির আদলে আমাদের সম্মানিত ক্রেতাদের বাস্তব রিভিউসমূহ।</p>
          </div>

          <div className="postcard-grid">
            {reviews.map((rev) => (
              <div key={rev.id} className="postcard-card">
                <div className="postcard-stamp">🐝</div>
                <div className="postcard-divider"></div>
                <div className="postcard-content">
                  <div style={{ color: 'var(--color-honey)', marginBottom: '10px', fontSize: '1.1rem' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                  <p className="postcard-handwritten">"{rev.text}"</p>
                </div>
                <div className="postcard-address-block">
                  <strong>{rev.name}</strong><br />
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>📍 {rev.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordions Section */}
      <section className="section" style={{ backgroundColor: 'var(--color-sand)' }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          <div className="section-header">
            <span className="section-subtitle">জিজ্ঞাসা ও উত্তর</span>
            <h2 className="section-title">সচরাচর জিজ্ঞাসিত প্রশ্নাবলী</h2>
            <p className="section-desc">মধু সংগ্রহ, চিংড়ির সতেজতা ও বুকিং সম্পর্কিত সকল কমন প্রশ্নের উত্তর একনজরে জেনে নিন।</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq) => (
              <div
                key={faq.id}
                style={{
                  background: 'var(--color-white)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--color-forest-dark)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>❓ {faq.question}</span>
                  <span style={{ fontSize: '1.4rem', color: 'var(--color-honey)' }}>
                    {activeFaq === faq.id ? '−' : '+'}
                  </span>
                </button>

                {activeFaq === faq.id && (
                  <div style={{ padding: '0 24px 20px', fontSize: '0.98rem', color: 'var(--color-charcoal-light)', lineHeight: '1.7', borderTop: '1px dashed rgba(0,0,0,0.05)', paddingTop: '15px' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Contact split layout */}
      <section className="section" style={{ backgroundColor: '#FAF5EA', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">আমাদের কার্যালয়</span>
            <h2 className="section-title">যোগাযোগ করুন সরাসরি</h2>
            <p className="section-desc">পণ্য সম্পর্কে জানতে, কাস্টম অর্ডার করতে বা কোনো সমস্যা জানাতে সরাসরি আমাদের সাথে যুক্ত হন।</p>
          </div>

          <div className="delivery-split-row">
            {/* Info lists */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <a href="tel:+8801873520181" style={{ display: 'block' }}>
                <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.8rem' }}>📞</div>
                  <div>
                    <h4 style={{ color: 'var(--color-forest-dark)' }}>মোবাইল হেল্পলাইন</h4>
                    <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.9rem' }}>01873-520181 (কল করুন যেকোনো প্রয়োজনে)</p>
                  </div>
                </div>
              </a>

              <a href="https://wa.me/8801873520181" target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.8rem' }}>💬</div>
                  <div>
                    <h4 style={{ color: 'var(--color-forest-dark)' }}>WhatsApp লাইভ চ্যাট</h4>
                    <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.9rem' }}>01873-520181 (অর্ডার করতে চ্যাট করুন)</p>
                  </div>
                </div>
              </a>

              <div style={{ display: 'flex', gap: '15px', background: 'var(--color-white)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.8rem' }}>📍</div>
                <div>
                  <h4 style={{ color: 'var(--color-forest-dark)' }}>শ্যামনগর শাখা অফিস</h4>
                  <p style={{ color: 'var(--color-charcoal-light)', fontSize: '0.9rem' }}>উপজেলা মোড়, শ্যামনগর, সাতক্ষীরা, বাংলাদেশ</p>
                </div>
              </div>
            </div>

            {/* Google map iframe wrapper */}
            <div style={{ height: '320px', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <iframe
                src="https://maps.google.com/maps?q=Ishwaripur,+Shyamnagar,+Satkhira&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
