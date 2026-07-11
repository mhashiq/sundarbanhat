import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dataService, getImageUrl } from '../services/dataService';
import type { Product } from '../services/dataService';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart, MessageSquare, PhoneCall, Plus, Minus } from 'lucide-react';
import { 
  trackViewItem, 
  trackLead 
} from '../analytics/analytics';

export const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const { addToCart, wishlistItems, addToWishlist, removeFromWishlist } = useCart();

  useEffect(() => {
    if (productId) {
      setLoading(true);
      setQuantity(1); // Reset qty on product change
      dataService.getProductById(productId).then(prod => {
        if (prod) {
          setProduct(prod);
          
          // 1. Track GA4 view_item event on load
          trackViewItem(prod);

          // Fetch related products in same category (excluding current)
          dataService.getProducts().then(allProds => {
            const filtered = allProds.filter(p => p.category === prod.category && p.id !== prod.id);
            setRelatedProducts(filtered.slice(0, 3));
          });
        }
        setLoading(false);
      });
    }
  }, [productId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-mangrove)', fontSize: '1.2rem', fontWeight: 'bold' }}>
        লোড হচ্ছে...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-forest-dark)' }}>পণ্যটি খুঁজে পাওয়া যায়নি!</h2>
        <p style={{ margin: '15px 0 25px' }}>দুঃখিত, অনুরোধকৃত পণ্যের কোনো তথ্য আমাদের ডাটাবেজে নেই।</p>
        <Link to="/products" className="btn btn-primary">পণ্য তালিকা দেখুন</Link>
      </div>
    );
  }

  const isWishlisted = wishlistItems.some(p => p.id === product.id);

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
      // trackAddToWishlist is fired inside context
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleLeadClick = (type: 'whatsapp' | 'call') => {
    trackLead(type, product.id, product.title);
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": `https://sundarbanhat.com${product.img}`,
    "description": product.story,
    "offers": {
      "@type": "Offer",
      "price": product.priceNum,
      "priceCurrency": "BDT",
      "availability": product.status === 'in-stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', paddingTop: '30px' }}>
      <Helmet>
        <title>{product.title} - সুন্দরবন হাট</title>
        <meta name="description" content={`${product.title} - ${product.story.substring(0, 150)}`} />
        <meta name="keywords" content={` सुंदरবন হাট, ${product.title}, ${product.subcategory}`} />
        <link rel="canonical" href={`https://sundarbanhat.com/#/product/${product.id}`} />
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      </Helmet>

      <div className="container">
        
        {/* Documentary Style Top Banner */}
        <div className="details-hero-banner">
          <img src={getImageUrl(product.img)} alt={product.title} className="details-hero-bg" />
          <div className="details-hero-overlay"></div>
          <div className="details-hero-title-box">
            <span style={{ backgroundColor: 'var(--color-honey)', color: 'var(--color-forest-dark)', padding: '4px 10px', fontSize: '0.85rem', fontWeight: 'bold', borderRadius: '4px' }}>
              {product.subcategory}
            </span>
            <h1 style={{ color: 'white', fontSize: '2.5rem', marginTop: '10px', fontWeight: 800 }}>
              {product.title}
            </h1>
          </div>
        </div>

        {/* Dynamic Split Details Grid */}
        <div className="details-split-grid">
          {/* Left Panel: Gallery & ordering */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Visual Box */}
            <div style={{ background: 'var(--color-white)', border: '6px double var(--color-mud)', padding: '20px', borderRadius: '4px', textAlign: 'center', position: 'relative' }}>
              <img src={getImageUrl(product.img)} alt={product.title} style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '4px' }} />
              
              {/* Wishlist Heart */}
              <button
                onClick={handleWishlistToggle}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'rgba(252, 250, 245, 0.9)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  color: isWishlisted ? '#e53935' : 'gray'
                }}
                title={isWishlisted ? 'পছন্দের তালিকা থেকে বাদ দিন' : 'পছন্দের তালিকায় যোগ করুন'}
              >
                <Heart size={22} fill={isWishlisted ? '#e53935' : 'none'} />
              </button>

              <div style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '0.85rem', color: 'gray' }}>
                📸 শ্যামনগর হাব থেকে সরাসরি তোলা পণ্যের বাস্তব ছবি।
              </div>
            </div>

            {/* Complete Ordering System */}
            <div style={{ background: 'var(--color-white)', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <h3 style={{ color: 'var(--color-forest-dark)', marginBottom: '15px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                🛒 অর্ডার বা ঝুড়িতে যোগ করুন
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', background: 'var(--color-sand)', padding: '15px', borderRadius: 'var(--border-radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>প্যাক সাইজ</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--color-forest-dark)' }}>{product.weight}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>মূল্যমান</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-mangrove)' }}>{product.price}</div>
                </div>
              </div>

              {/* Quantity Selection */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-mud)' }}>পরিমাণ নির্বাচন</span>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--border-radius-full)',
                  padding: '4px 12px',
                  backgroundColor: 'var(--color-sand)'
                }}>
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}
                  >
                    <Minus size={16} style={{ color: 'var(--color-mud)' }} />
                  </button>
                  <span style={{ margin: '0 15px', fontSize: '1.05rem', fontWeight: 'bold' }}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}
                  >
                    <Plus size={16} style={{ color: 'var(--color-mud)' }} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. Add to Cart Option */}
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '1.05rem'
                  }}
                >
                  <ShoppingCart size={18} /> ঝুড়িতে যোগ করুন (৳{product.priceNum * quantity})
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', color: 'gray', fontSize: '0.8rem' }}>
                  <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
                  <span style={{ padding: '0 10px' }}>অথবা সরাসরি অর্ডার করুন</span>
                  <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
                </div>

                {/* 2. Direct Lead Call */}
                <a 
                  href={`tel:+8801873520181`} 
                  onClick={() => handleLeadClick('call')}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <PhoneCall size={16} /> কল করে অর্ডার দিন
                </a>

                {/* 3. Direct Lead WhatsApp */}
                <a 
                  href={`https://wa.me/8801873520181?text=আমি ${product.title} (${product.weight}) ${quantity}টি নিতে চাই।`} 
                  onClick={() => handleLeadClick('whatsapp')}
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-whatsapp"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <MessageSquare size={16} /> WhatsApp-এ মেসেজ দিন
                </a>
              </div>
              
              <p style={{ fontSize: '0.8rem', color: 'gray', textAlign: 'center', marginTop: '12px' }}>
                * কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই। সারা দেশে ক্যাশ অন ডেলিভারি সুবিধা।
              </p>
            </div>
          </div>

          {/* Right Panel: Documentary Narrative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
            
            {/* Story block */}
            <div style={{ background: 'var(--color-white)', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <h2 style={{ color: 'var(--color-forest-dark)', fontSize: '1.6rem', marginBottom: '15px' }}>
                🌾 সংগ্রহের পিছনের গল্প ও বিবরণ
              </h2>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--color-charcoal-light)' }}>
                {product.story}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '25px', background: 'var(--color-sand)', padding: '15px', borderRadius: 'var(--border-radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>📍 সংগৃহীত স্থান:</span>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{product.location}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>📅 সংগ্রহের সময়কাল:</span>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{product.harvest}</div>
                </div>
              </div>
            </div>

            {/* Health benefits & trust markers */}
            <div style={{ background: 'var(--color-white)', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.3rem', marginBottom: '15px' }}>
                ❤️ স্বাস্থ্য উপকারিতা ও গুণাবলী
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '15px' }}>
                {product.benefits.map((b, idx) => (
                  <li key={idx} style={{ listStyle: 'none', position: 'relative', paddingLeft: '24px', fontSize: '0.98rem', color: 'var(--color-charcoal-light)' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--color-mangrove)' }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Storage rules */}
            <div style={{ background: 'var(--color-white)', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.3rem', marginBottom: '12px' }}>
                🛡️ সংরক্ষণ পদ্ধতি
              </h3>
              <p style={{ fontSize: '0.96rem', color: 'var(--color-charcoal-light)', lineHeight: '1.7' }}>
                {product.storage}
              </p>
            </div>

            {/* Shipping policy info */}
            <div style={{ background: 'var(--color-white)', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.3rem', marginBottom: '12px' }}>
                🚚 ডেলিভারি ও প্যাকেজিং তথ্য
              </h3>
              <p style={{ fontSize: '0.96rem', color: 'var(--color-charcoal-light)', lineHeight: '1.7' }}>
                আমাদের মাছ ও চিংড়িগুলো থার্মোকল বাক্সে বরফ দিয়ে সিল করে পাঠানো হয়। ঢাকার বাইরে কুরিয়ার বুকিং এর মাধ্যমে পাঠানো হয়। আমরা সঠিক ট্র্যাকিং ও দ্রুত পেমেন্ট সুবিধা নিশ্চিত করি।
              </p>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '70px' }}>
            <h2 style={{ color: 'var(--color-forest-dark)', fontSize: '1.8rem', textAlign: 'center', marginBottom: '40px' }}>
              🌿 অন্যান্য সম্পর্কিত পণ্যসমূহ
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              {relatedProducts.map((prod, idx) => (
                <div key={prod.id} className="wooden-crate-card">
                  <div className="crate-header-bar">
                    <span>CRATE #SH-00{idx + 5}</span>
                    <span style={{ color: prod.status === 'in-stock' ? '#64dd17' : '#F39C12' }}>
                      ● {prod.status === 'in-stock' ? 'ইন স্টক' : 'আসন্ন'}
                    </span>
                  </div>
                  
                  <div className="crate-image-container">
                    <span className="crate-status-tag">{prod.subcategory}</span>
                    <img src={getImageUrl(prod.img)} alt={prod.title} />
                  </div>

                  <div className="crate-body-content">
                    <div className="crate-info-row">
                      <span>📍 {prod.location}</span>
                      <span>📅 {prod.harvest}</span>
                    </div>
                    <h3 className="crate-prod-title">{prod.title}</h3>
                    
                    <div className="crate-footer-row" style={{ marginTop: '15px' }}>
                      <div className="crate-price-block">
                        <span style={{ fontSize: '0.75rem', color: 'gray' }}>মূল্য</span>
                        <span className="crate-price-val">{prod.price}</span>
                      </div>
                      <span className="crate-weight-val">{prod.weight}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '15px' }}>
                      <button 
                        onClick={() => addToCart(prod, 1)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', fontSize: '0.9rem' }}
                      >
                        <ShoppingCart size={14} /> অর্ডার করুন
                      </button>
                      <Link to={`/product/${prod.id}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', fontSize: '0.9rem' }}>বিস্তারিত</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
