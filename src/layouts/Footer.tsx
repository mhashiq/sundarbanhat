import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { LayoutGrid, Search, ShoppingBag, UserCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, setCartOpen } = useCart();
  const [settings, setSettings] = useState<Record<string, string>>({
    facebook_url: 'https://facebook.com/sundarbanhat',
    instagram_url: 'https://instagram.com/sundarbanhat',
    tiktok_url: '',
    youtube_url: '',
    whatsapp_number: '+8801873520181'
  });

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      const data = await dataService.getSettings();
      if (active) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <footer className="footer-mangrove" style={{ position: 'relative' }}>
        {/* SVG Mangrove Roots Illustration */}
        <svg className="footer-mangrove-roots-svg" viewBox="0 0 1440 200" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,120 C180,180 360,100 540,160 C720,220 900,120 1080,150 C1260,180 1380,150 1440,170 L1440,200 L0,200 Z" fill="#031008" />
          <path d="M120,200 C150,150 190,120 220,160 C250,200 280,180 320,130 C360,80 400,140 450,200" stroke="#0d3118" strokeWidth="4" strokeLinecap="round" />
          <path d="M500,200 C530,120 570,160 610,130 C650,100 680,140 730,200" stroke="#0d3118" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M900,200 C930,140 980,110 1010,150 C1040,190 1090,130 1150,200" stroke="#0d3118" strokeWidth="4" strokeLinecap="round" />
          <path d="M1250,200 C1280,160 1320,120 1360,150 C1400,180 1410,140 1440,200" stroke="#0d3118" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <div className="container">
          <div className="footer-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
            <div className="footer-col-about">
              <h3 style={{ color: 'var(--color-honey)', fontSize: '1.4rem', marginBottom: '15px', fontWeight: 800 }}>
                সুন্দরবন হাট
              </h3>
              <p style={{ opacity: 0.85, fontSize: '0.95rem', lineHeight: '1.7' }}>
                সাতক্ষীরা শ্যামনগর উপজেলার জল ও মাটির খাঁটি ও জৈব খাদ্যপণ্য সরাসরি প্রান্তিক মানুষ, জেলে ও মৌয়ালদের থেকে সংগ্রহ করে আপনার দোরগোড়ায় পৌঁছে দেওয়া আমাদের অঙ্গীকার।
              </p>
            </div>

            <div className="footer-col-links">
              <h3 style={{ color: 'var(--color-white)', fontSize: '1.15rem', marginBottom: '15px' }}>
                প্রয়োজনীয় লিংক
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><Link to="/" style={{ opacity: 0.8, fontSize: '0.9rem' }}>হোম</Link></li>
                <li><Link to="/products" style={{ opacity: 0.8, fontSize: '0.9rem' }}>পণ্যসমূহ</Link></li>
                <li><Link to="/about" style={{ opacity: 0.8, fontSize: '0.9rem' }}>আমাদের সম্পর্কে</Link></li>
                <li><Link to="/why-us" style={{ opacity: 0.8, fontSize: '0.9rem' }}>কেন আমরা</Link></li>
                <li><Link to="/faq" style={{ opacity: 0.8, fontSize: '0.9rem' }}>জিজ্ঞাসা ও ব্লগ</Link></li>
              </ul>
            </div>

            <div className="footer-col-policy">
              <h3 style={{ color: 'var(--color-white)', fontSize: '1.15rem', marginBottom: '15px' }}>
                নীতি ও শর্তাবলী
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><Link to="/policy/delivery" style={{ opacity: 0.8, fontSize: '0.9rem' }}>ডেলিভারি নীতি</Link></li>
                <li><Link to="/policy/return" style={{ opacity: 0.8, fontSize: '0.9rem' }}>রিটার্ন ও রিফান্ড নীতি</Link></li>
                <li><Link to="/policy/privacy" style={{ opacity: 0.8, fontSize: '0.9rem' }}>গোপনীয়তা নীতি</Link></li>
                <li><Link to="/policy/terms" style={{ opacity: 0.8, fontSize: '0.9rem' }}>শর্তাবলী ও নিয়মসমূহ</Link></li>
                <li><Link to="/contact" style={{ opacity: 0.8, fontSize: '0.9rem' }}>যোগাযোগ করুন</Link></li>
              </ul>
            </div>

            <div className="footer-col-social">
              <h3 style={{ color: 'var(--color-white)', fontSize: '1.15rem', marginBottom: '15px' }}>
                আমাদের সাথে থাকুন
              </h3>
              <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '15px', lineHeight: '1.5' }}>
                আমাদের নিত্যনতুন আপডেট, অফার এবং সুন্দরবনের কার্যক্রম দেখতে চোখ রাখুন সামাজিক যোগাযোগ মাধ্যমে।
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {settings.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" title="Facebook"
                     style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
                     onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1877f2'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                )}
                {settings.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" title="Instagram"
                     style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
                     onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e1306c'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                )}
                {settings.tiktok_url && (
                  <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" title="TikTok"
                     style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
                     onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                     <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path></svg>
                  </a>
                )}
                {settings.youtube_url && (
                  <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube"
                     style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
                     onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ff0000'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.41 19c1.71.46 8.59.46 8.59.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                  </a>
                )}
                {settings.whatsapp_number && (
                  <a href={`https://wa.me/${settings.whatsapp_number.replace(/\+/g, '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                     style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }}
                     onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#25d366'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                     <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'center', fontSize: '0.85rem', opacity: 0.75, marginTop: '20px' }}>
            &copy; ২০২৬ সুন্দরবন হাট। সর্বস্বত্ব সংরক্ষিত। Managed by <a href="https://www.authbrain.io" target="_blank" rel="noreferrer" style={{ color: 'var(--color-honey)' }}>AuthBrain</a>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Primary">
        <NavLink to="/" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`} end>
          <span className="bottom-nav-icon">🏠</span>
          <span>হোম</span>
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
          <LayoutGrid size={20} />
          <span>ক্যাটাগরি</span>
        </NavLink>
        <button type="button" className="bottom-nav-link bottom-nav-link--button" onClick={() => navigate('/products')}>
          <Search size={20} />
          <span>সার্চ</span>
        </button>
        <button type="button" className="bottom-nav-link bottom-nav-link--button" onClick={() => setCartOpen(true)}>
          <span className="bottom-nav-cart-wrap">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="bottom-nav-badge">{cartCount}</span>}
          </span>
          <span>কার্ট</span>
        </button>
        <NavLink to="/account" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
          <UserCircle size={20} />
          <span>অ্যাকাউন্ট</span>
        </NavLink>
      </nav>

      {/* Optimized Translator Widget */}
      <div className="translator-widget">
        <div id="google_translate_element"></div>
      </div>
    </>
  );
};
