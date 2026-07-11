import React, { useState, useEffect } from 'react';
import { dataService, getImageUrl } from '../services/dataService';
import type { Product } from '../services/dataService';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { Heart, Search, ShoppingCart } from 'lucide-react';
import { 
  trackViewItemList, 
  trackSelectItem, 
  trackSearch 
} from '../analytics/analytics';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [searchParams] = useSearchParams();
  const { addToCart, wishlistItems, addToWishlist, removeFromWishlist } = useCart();

  // 1. Initial product load
  useEffect(() => {
    dataService.getProducts().then(prods => {
      setProducts(prods);
      setFilteredProducts(prods);
      
      // Handle URL filter query (?filter=wishlist)
      const urlFilter = searchParams.get('filter');
      if (urlFilter === 'wishlist') {
        setActiveFilter('wishlist');
      }
    });
  }, [searchParams]);

  // 2. Filter & Search query effect
  useEffect(() => {
    let prods = [...products];
    if (activeFilter === 'wishlist') {
      prods = wishlistItems;
    } else if (activeFilter !== 'all') {
      prods = products.filter(p => p.category === activeFilter);
    }

    if (searchQuery.trim() !== '') {
      prods = prods.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.story.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(prods);
  }, [products, activeFilter, searchQuery, wishlistItems]);

  // 3. Track GA4 Search Event with 800ms debounce
  useEffect(() => {
    if (searchQuery.trim() === '') return;
    const timer = setTimeout(() => {
      trackSearch(searchQuery);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 4. Track GA4 View Item List Event
  useEffect(() => {
    if (filteredProducts.length > 0) {
      const listName = activeFilter === 'wishlist' 
        ? 'Wishlist List' 
        : activeFilter === 'all' 
          ? 'All Products' 
          : `Category: ${activeFilter}`;
      trackViewItemList(filteredProducts, listName);
    }
  }, [filteredProducts, activeFilter]);

  const handleFilter = (category: string) => {
    setActiveFilter(category);
  };

  const openDrawer = (product: Product) => {
    setSelectedProduct(product);
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    setSelectedProduct(null);
    document.body.style.overflow = '';
  };

  // 5. Track GA4 select_item when clicking product details
  const handleSelectProduct = (product: Product, index: number) => {
    const listName = activeFilter === 'wishlist' 
      ? 'Wishlist List' 
      : activeFilter === 'all' 
        ? 'All Products' 
        : `Category: ${activeFilter}`;
    trackSelectItem(product, index + 1, listName);
    openDrawer(product);
  };

  const isWishlisted = (prodId: string) => {
    return wishlistItems.some(p => p.id === prodId);
  };

  const handleWishlistToggle = (prod: Product) => {
    if (isWishlisted(prod.id)) {
      removeFromWishlist(prod.id);
    } else {
      addToWishlist(prod);
    }
  };

  return (
    <>
      <Helmet>
        <title>পণ্যসমূহ - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাটের সেরা খাঁটি খাদ্যপণ্যসমূহ - খলিশা ফুলের কাঁচা মধু, লোনা পানির চিংড়ি, সরিষার তেল এবং দেশি আতপ চালের বিবরণ ও অর্ডার লিংক।" />
        <meta name="keywords" content="সুন্দরবন হাট পণ্য, খাঁটি খলিশা মধু দাম, বাগদা চিংড়ি অর্ডার" />
        <link rel="canonical" href="https://sundarbanhat.com/#/products" />
      </Helmet>

      <section style={{ backgroundColor: 'var(--color-sand-dark)', padding: '40px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', fontWeight: '800' }}>আমাদের উপকূলীয় খাদ্যপণ্য</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-charcoal-light)', marginTop: '8px' }}>
            ১০০% খাঁটি ও প্রাকৃতিকভাবে সংগৃহীত উপকূলের সেরা সব খাদ্যপণ্য একনজরে।
          </p>
        </div>
      </section>

      <section className="section" style={{ backgroundColor: 'var(--color-sand)', paddingTop: '30px' }}>
        <div className="container">
          
          {/* Search Bar & Category Filter Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
            
            {/* Search Input */}
            <div style={{
              position: 'relative',
              maxWidth: '500px',
              width: '100%',
              margin: '0 auto'
            }}>
              <input 
                type="text"
                placeholder="পণ্য খুঁজুন (যেমন: মধু, চিংড়ি...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 20px 12px 45px',
                  borderRadius: 'var(--border-radius-full)',
                  border: '1.5px solid var(--color-border)',
                  backgroundColor: '#fff',
                  fontSize: '0.98rem',
                  color: 'var(--color-charcoal)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                }}
              />
              <Search 
                size={18} 
                style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'gray'
                }}
              />
            </div>

            {/* Category Filter Chips */}
            <div className="filter-chips-row" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <button className={`filter-chip-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>সব পণ্য ({products.length})</button>
              <button className={`filter-chip-btn ${activeFilter === 'honey' ? 'active' : ''}`} onClick={() => handleFilter('honey')}>মধু</button>
              <button className={`filter-chip-btn ${activeFilter === 'shrimp' ? 'active' : ''}`} onClick={() => handleFilter('shrimp')}>তাজা চিংড়ি</button>
              <button className={`filter-chip-btn ${activeFilter === 'fruit' ? 'active' : ''}`} onClick={() => handleFilter('fruit')}>ফল</button>
              <button className={`filter-chip-btn ${activeFilter === 'oil' ? 'active' : ''}`} onClick={() => handleFilter('oil')}>খাঁটি তেল</button>
              <button className={`filter-chip-btn ${activeFilter === 'grain' ? 'active' : ''}`} onClick={() => handleFilter('grain')}>দেশি চাল</button>
              {wishlistItems.length > 0 && (
                <button className={`filter-chip-btn ${activeFilter === 'wishlist' ? 'active' : ''}`} onClick={() => handleFilter('wishlist')} style={{ borderColor: '#e53935', color: activeFilter === 'wishlist' ? '#fff' : '#e53935', backgroundColor: activeFilter === 'wishlist' ? '#e53935' : 'transparent' }}>
                  ❤️ পছন্দের তালিকা ({wishlistItems.length})
                </button>
              )}
            </div>
          </div>

          {/* Pinterest Magazine style layout */}
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'gray' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>কোনো পণ্য খুঁজে পাওয়া যায়নি!</p>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>অনুগ্রহ করে ভিন্ন কিছু লিখে অনুসন্ধান করুন অথবা ক্যাটাগরি পরিবর্তন করুন।</p>
            </div>
          ) : (
            <div className="magazine-pinterest-layout">
              {filteredProducts.map((prod, idx) => (
                <div key={prod.id} className="magazine-item-container">
                  <div className="wooden-crate-card" style={{ position: 'relative' }}>
                    
                    {/* Wishlist Button Overlay */}
                    <button
                      onClick={() => handleWishlistToggle(prod)}
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
                        color: isWishlisted(prod.id) ? '#e53935' : 'gray'
                      }}
                      title={isWishlisted(prod.id) ? 'পছন্দের তালিকা থেকে বাদ দিন' : 'পছন্দের তালিকায় যোগ করুন'}
                    >
                      <Heart size={18} fill={isWishlisted(prod.id) ? '#e53935' : 'none'} />
                    </button>

                    <div className="crate-header-bar">
                      <span>CRATE #SH-00{idx + 1}</span>
                      <span style={{ color: prod.status === 'in-stock' ? '#64dd17' : '#F39C12' }}>
                        ● {prod.status === 'in-stock' ? 'ইন স্টক' : 'আসন্ন'}
                      </span>
                    </div>
                    
                    <div className="crate-image-container" onClick={() => handleSelectProduct(prod, idx)} style={{ cursor: 'pointer' }}>
                      <span className="crate-status-tag">{prod.subcategory}</span>
                      <img src={getImageUrl(prod.img)} alt={prod.title} loading="lazy" />
                    </div>

                    <div className="crate-body-content">
                      <div className="crate-info-row">
                        <span>📍 {prod.location}</span>
                        <span>📅 {prod.harvest}</span>
                      </div>
                      <h3 className="crate-prod-title" onClick={() => handleSelectProduct(prod, idx)} style={{ cursor: 'pointer' }}>{prod.title}</h3>
                      <p className="crate-story-teaser">{prod.story.substring(0, 90)}...</p>
                      
                      <div className="crate-footer-row" style={{ marginBottom: '15px' }}>
                        <div className="crate-price-block">
                          <span style={{ fontSize: '0.75rem', color: 'gray' }}>মূল্য</span>
                          <span className="crate-price-val">{prod.price}</span>
                        </div>
                        <span className="crate-weight-val">{prod.weight}</span>
                      </div>

                      {/* Complete eCommerce actions */}
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
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleSelectProduct(prod, idx)} 
                          style={{ padding: '8px', fontSize: '0.88rem' }}
                        >
                          বিস্তারিত
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Details Drawer/Modal Overlay */}
      {selectedProduct && (
        <div 
          onClick={closeDrawer}
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(7, 34, 17, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--border-radius-lg)',
              border: '4px solid var(--color-mud)',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '240px' }}>
              <img 
                src={getImageUrl(selectedProduct.img)} 
                alt={selectedProduct.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button 
                onClick={closeDrawer}
                style={{
                  position: 'absolute',
                  top: '15px', right: '15px',
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
              <div style={{ position: 'absolute', bottom: '15px', left: '20px', color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                <span style={{ background: 'var(--color-honey)', color: 'var(--color-forest-dark)', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px' }}>
                  {selectedProduct.subcategory}
                </span>
                <h2 style={{ color: 'white', marginTop: '6px', fontSize: '1.6rem' }}>{selectedProduct.title}</h2>
              </div>
            </div>

            <div style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.85rem', color: 'var(--color-charcoal-light)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px' }}>
                <span>📍 {selectedProduct.location}</span>
                <span>📅 সংগ্রহ: {selectedProduct.harvest}</span>
              </div>

              <p style={{ fontSize: '0.98rem', lineHeight: '1.7', color: 'var(--color-charcoal-light)', marginBottom: '20px' }}>
                {selectedProduct.story}
              </p>

              <h4 style={{ color: 'var(--color-forest-dark)', marginBottom: '8px' }}>📋 পণ্যের বিশেষ উপকারিতা:</h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                {selectedProduct.benefits.map((b, idx) => (
                  <li key={idx} style={{ listStyle: 'disc', fontSize: '0.92rem', marginBottom: '6px', color: 'var(--color-charcoal-light)' }}>
                    {b}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-sand)', padding: '15px', borderRadius: 'var(--border-radius-md)', marginBottom: '25px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>মূল্যমান</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mangrove)' }}>{selectedProduct.price}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>প্যাক সাইজ</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedProduct.weight}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
                <button 
                  onClick={() => {
                    addToCart(selectedProduct, 1);
                    closeDrawer();
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <ShoppingCart size={16} /> ঝুড়িতে যোগ করুন
                </button>
                <Link to={`/product/${selectedProduct.id}`} onClick={closeDrawer} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  পূর্ণ বিবরণ পৃষ্ঠা →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
