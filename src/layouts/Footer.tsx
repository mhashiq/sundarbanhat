import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <>
      <footer className="footer-mangrove">
        {/* SVG Mangrove Roots Illustration */}
        <svg className="footer-mangrove-roots-svg" viewBox="0 0 1440 200" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,120 C180,180 360,100 540,160 C720,220 900,120 1080,150 C1260,180 1380,150 1440,170 L1440,200 L0,200 Z" fill="#031008" />
          <path d="M120,200 C150,150 190,120 220,160 C250,200 280,180 320,130 C360,80 400,140 450,200" stroke="#0d3118" strokeWidth="4" strokeLinecap="round" />
          <path d="M500,200 C530,120 570,160 610,130 C650,100 680,140 730,200" stroke="#0d3118" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M900,200 C930,140 980,110 1010,150 C1040,190 1090,130 1150,200" stroke="#0d3118" strokeWidth="4" strokeLinecap="round" />
          <path d="M1250,200 C1280,160 1320,120 1360,150 C1400,180 1410,140 1440,200" stroke="#0d3118" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <div className="container">
          <div className="footer-content-grid">
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
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'center', fontSize: '0.85rem', opacity: 0.75 }}>
            &copy; ২০২৬ সুন্দরবন হাট। সর্বস্বত্ব সংরক্ষিত। Managed by <a href="https://www.authbrain.io" target="_blank" rel="noreferrer" style={{ color: 'var(--color-honey)' }}>AuthBrain</a>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Navigation */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`} end>
          <span className="icon">🏠</span>
          <span>হোম</span>
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
          <span className="icon">🛒</span>
          <span>পণ্য</span>
        </NavLink>
        <a href="tel:+8801873520181">
          <span className="icon">📞</span>
          <span>কল করুন</span>
        </a>
        <a href="https://wa.me/8801873520181" target="_blank" rel="noreferrer">
          <span className="icon">💬</span>
          <span>WhatsApp</span>
        </a>
      </nav>

      {/* Optimized Translator Widget */}
      <div className="translator-widget">
        <div id="google_translate_element"></div>
      </div>
    </>
  );
};
