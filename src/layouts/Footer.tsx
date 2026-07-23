import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { 
  LayoutGrid, 
  Search, 
  ShoppingBag, 
  UserCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Truck, 
  Lock, 
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, setCartOpen } = useCart();
  const [settings, setSettings] = useState<Record<string, string>>({
    facebook_url: 'https://facebook.com/sundarbanhat',
    instagram_url: 'https://www.instagram.com/sundarbanhat/',
    phone_number: '+8801873520181',
    email_address: 'sundarbanhat@gmail.com',
    business_address: 'সুন্দরবন হাট, শ্যামনগর, সাতক্ষীরা-৯৪৫০, বাংলাদেশ',
    youtube_url: 'https://youtube.com/@sundarbanhat',
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
      <style>{`
        /* Pre-Footer Trust Bar */
        .pre-footer-trust-bar {
          background: #FFF9F2;
          border-top: 1px solid rgba(46, 107, 62, 0.12);
          border-bottom: 1px solid rgba(46, 107, 62, 0.12);
          padding: 48px 20px;
          color: #072211;
        }

        .pre-footer-container {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        @media (max-width: 900px) {
          .pre-footer-container {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        .pre-footer-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 8px 20px rgba(7, 34, 17, 0.05);
          border: 1px solid rgba(46, 107, 62, 0.08);
          transition: all 0.3s ease;
        }
        .pre-footer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 30px rgba(7, 34, 17, 0.1);
          border-color: #2E6B3E;
        }

        .pre-footer-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: rgba(46, 107, 62, 0.08);
          color: #2E6B3E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .pre-footer-card:hover .pre-footer-icon-box {
          background: #2E6B3E;
          color: #ffffff;
        }

        .pre-footer-card-title {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #072211;
          margin: 0 0 4px;
        }
        .pre-footer-card-desc {
          font-size: 0.92rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Main Footer */
        .premium-footer {
          background: #1F4D36;
          color: #FAF5EA;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          padding: 80px 20px 40px;
          position: relative;
          overflow: hidden;
        }

        .footer-main-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* 4 Columns Grid */
        .footer-cols-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.6fr;
          gap: 48px;
          padding-bottom: 60px;
        }
        @media (max-width: 1100px) {
          .footer-cols-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }
        @media (max-width: 640px) {
          .footer-cols-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
        }

        /* Column Headers */
        .footer-col-title {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 24px;
          position: relative;
          display: inline-block;
        }
        .footer-col-title::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 32px;
          height: 2.5px;
          background: #D4AF37;
          border-radius: 2px;
        }

        /* Column 1 - Brand Story */
        .footer-brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          margin-bottom: 16px;
        }
        .footer-brand-logo img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid #D4AF37;
          object-fit: cover;
        }
        .footer-brand-logo span {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .footer-brand-tagline {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #D4AF37;
          margin: 0 0 10px;
        }

        .footer-brand-story-text {
          font-size: 0.95rem;
          color: rgba(250, 245, 234, 0.82);
          line-height: 1.75;
          margin: 0 0 24px;
        }

        .footer-trust-badges-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .footer-trust-badge-pill {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Column 2 & 3 - Links */
        .footer-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-links-list li a {
          color: rgba(250, 245, 234, 0.85);
          text-decoration: none;
          font-size: 0.96rem;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.25s ease;
          position: relative;
        }
        .footer-links-list li a:hover {
          color: #D4AF37;
          transform: translateX(4px);
        }
        .footer-link-icon {
          color: #22C55E;
          opacity: 0.9;
          font-size: 0.9rem;
        }

        /* Column 4 - Contact */
        .footer-contact-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 0.95rem;
          color: rgba(250, 245, 234, 0.88);
          line-height: 1.6;
        }
        .footer-contact-item a {
          color: rgba(250, 245, 234, 0.95);
          text-decoration: none;
          transition: color 0.25s ease;
        }
        .footer-contact-item a:hover {
          color: #D4AF37;
        }
        .footer-contact-icon {
          color: #D4AF37;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .footer-hours-box {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.88rem;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        /* Premium Branded Payment Gateway Cards */
        .footer-payment-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #D4AF37;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .footer-payments-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }
        .footer-pay-card {
          border-radius: 8px;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 0.76rem;
          font-weight: 800;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.15);
          height: 32px;
          cursor: default;
        }
        .footer-pay-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
        }
        .pay-bkash { background: linear-gradient(135deg, #E2136E, #B00A52); }
        .pay-nagad { background: linear-gradient(135deg, #F7941D, #D87A0C); }
        .pay-rocket { background: linear-gradient(135deg, #8C3494, #6E2376); }
        .pay-visa { background: linear-gradient(135deg, #1A1F71, #0F144D); }
        .pay-mastercard { background: linear-gradient(135deg, #2D3748, #1A202C); }
        .pay-cod { background: linear-gradient(135deg, #16A34A, #0E7490); }

        /* Social Media Icons */
        .footer-social-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .footer-social-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .footer-social-btn:hover {
          background: #D4AF37;
          border-color: #D4AF37;
          color: #072211;
          transform: translateY(-3px);
        }

        /* Bottom Sub-Footer */
        .footer-bottom-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.88rem;
          color: rgba(250, 245, 234, 0.7);
        }
        @media (max-width: 640px) {
          .footer-bottom-divider {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
        .footer-bottom-divider a {
          color: #D4AF37;
          text-decoration: none;
          font-weight: 700;
          transition: color 0.2s ease;
        }
        .footer-bottom-divider a:hover {
          color: #ffffff;
          text-decoration: underline;
        }
      `}</style>

      {/* Pre-Footer 3 Trust Cards Section */}
      <section className="pre-footer-trust-bar">
        <div className="pre-footer-container">
          <div className="pre-footer-card">
            <div className="pre-footer-icon-box">
              <Sparkles size={28} />
            </div>
            <div>
              <h4 className="pre-footer-card-title">🌿 ১০০% খাঁটি পণ্য</h4>
              <p className="pre-footer-card-desc">প্রতিটি পণ্য সরাসরি উৎস থেকে সংগ্রহ করা হয়।</p>
            </div>
          </div>

          <div className="pre-footer-card">
            <div className="pre-footer-icon-box">
              <Truck size={28} />
            </div>
            <div>
              <h4 className="pre-footer-card-title">🚚 সারা দেশে দ্রুত ডেলিভারি</h4>
              <p className="pre-footer-card-desc">নিরাপদ প্যাকেজিং ও দ্রুত হোম ডেলিভারি।</p>
            </div>
          </div>

          <div className="pre-footer-card">
            <div className="pre-footer-icon-box">
              <Lock size={28} />
            </div>
            <div>
              <h4 className="pre-footer-card-title">🛡️ নিরাপদ অনলাইন পেমেন্ট</h4>
              <p className="pre-footer-card-desc">বিশ্বস্ত ও সুরক্ষিত পেমেন্ট সুবিধা।</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Premium Footer */}
      <footer className="premium-footer">
        <div className="footer-main-container">
          {/* 4 Column Layout */}
          <div className="footer-cols-grid">
            {/* Column 1 - Brand Story */}
            <div>
              <Link to="/" className="footer-brand-logo">
                <img src="/logo.jpg" alt="সুন্দরবন হাট" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <span>🌿 সুন্দরবন হাট</span>
              </Link>

              <h4 className="footer-brand-tagline">শুদ্ধতার প্রতিশ্রুতি</h4>

              <p className="footer-brand-story-text">
                সাতক্ষীরা জেলার শ্যামনগরের জল, মাটি ও সুন্দরবনের প্রাকৃতিক সম্পদ থেকে সংগ্রহ করা খাঁটি মধু, লোনা পানির চিংড়ি এবং অন্যান্য জৈব খাদ্যপণ্য সরাসরি মৌয়াল, জেলে ও স্থানীয় উৎপাদকদের কাছ থেকে আপনার পরিবারের কাছে পৌঁছে দেওয়াই আমাদের অঙ্গীকার।
              </p>

              <div className="footer-trust-badges-grid">
                <div className="footer-trust-badge-pill">
                  <span>🌿</span>
                  <span>১০০% প্রাকৃতিক</span>
                </div>
                <div className="footer-trust-badge-pill">
                  <span>🧪</span>
                  <span>ফরমালিনমুক্ত</span>
                </div>
                <div className="footer-trust-badge-pill">
                  <span>🤝</span>
                  <span>সরাসরি সংগ্রহ</span>
                </div>
                <div className="footer-trust-badge-pill">
                  <span>🚚</span>
                  <span>নিরাপদ ডেলিভারি</span>
                </div>
              </div>
            </div>

            {/* Column 2 - Quick Links */}
            <div>
              <h3 className="footer-col-title">দ্রুত লিংক</h3>
              <ul className="footer-links-list">
                <li>
                  <Link to="/">
                    <span className="footer-link-icon">🏠</span>
                    <span>হোম</span>
                  </Link>
                </li>
                <li>
                  <Link to="/products">
                    <span className="footer-link-icon">🛍️</span>
                    <span>পণ্যসমূহ</span>
                  </Link>
                </li>
                <li>
                  <Link to="/products">
                    <span className="footer-link-icon">📂</span>
                    <span>ক্যাটাগরি</span>
                  </Link>
                </li>
                <li>
                  <Link to="/about">
                    <span className="footer-link-icon">🌿</span>
                    <span>আমাদের সম্পর্কে</span>
                  </Link>
                </li>
                <li>
                  <Link to="/contact">
                    <span className="footer-link-icon">📞</span>
                    <span>যোগাযোগ</span>
                  </Link>
                </li>
                <li>
                  <Link to="/faq">
                    <span className="footer-link-icon">❓</span>
                    <span>জিজ্ঞাসা</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3 - Customer Service & Policies */}
            <div>
              <h3 className="footer-col-title">গ্রাহক সহায়তা</h3>
              <ul className="footer-links-list">
                <li>
                  <Link to="/policy/privacy">
                    <span className="footer-link-icon">🔒</span>
                    <span>গোপনীয়তা নীতি</span>
                  </Link>
                </li>
                <li>
                  <Link to="/policy/return">
                    <span className="footer-link-icon">🔄</span>
                    <span>রিটার্ন ও রিফান্ড নীতি</span>
                  </Link>
                </li>
                <li>
                  <Link to="/policy/delivery">
                    <span className="footer-link-icon">🚚</span>
                    <span>ডেলিভারি নীতি</span>
                  </Link>
                </li>
                <li>
                  <Link to="/policy/terms">
                    <span className="footer-link-icon">📜</span>
                    <span>শর্তাবলী ও নিয়মাবলী</span>
                  </Link>
                </li>
                <li>
                  <Link to="/account">
                    <span className="footer-link-icon">📦</span>
                    <span>অর্ডার ট্র্যাক করুন</span>
                  </Link>
                </li>
                <li>
                  <Link to="/account">
                    <span className="footer-link-icon">👤</span>
                    <span>আমার অ্যাকাউন্ট</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4 - Contact Info */}
            <div>
              <h3 className="footer-col-title">যোগাযোগ করুন</h3>
              <ul className="footer-contact-list">
                {settings.phone_number && (
                  <li className="footer-contact-item">
                    <Phone className="footer-contact-icon" size={18} />
                    <a href={`tel:${settings.phone_number}`}>{settings.phone_number}</a>
                  </li>
                )}
                {settings.email_address && (
                  <li className="footer-contact-item">
                    <Mail className="footer-contact-icon" size={18} />
                    <a href={`mailto:${settings.email_address}`}>{settings.email_address}</a>
                  </li>
                )}
                {settings.business_address && (
                  <li className="footer-contact-item">
                    <MapPin className="footer-contact-icon" size={18} />
                    <span>{settings.business_address}</span>
                  </li>
                )}
              </ul>

              {/* Business Hours */}
              <div className="footer-hours-box">
                <Clock size={18} style={{ color: '#D4AF37' }} />
                <span>প্রতিদিন সকাল ৯:০০ – রাত ৯:০০</span>
              </div>

              {/* Payment Methods */}
              <div className="footer-payment-title">পেমেন্ট মেথডসমূহ</div>
              <div className="footer-payments-grid">
                {/* bKash Origami Bird */}
                <div className="footer-pay-card pay-bkash" title="bKash Mobile Banking">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.5 8.5L22 4.5L16.5 12L20.5 21.5L12.5 15L5 20L7.5 12.5L2 9.5L9.5 8L12 2Z"/>
                  </svg>
                  <span>bKash</span>
                </div>

                {/* Nagad Swirling Flame */}
                <div className="footer-pay-card pay-nagad" title="Nagad Mobile Banking">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C9.5 5 6 8.5 6 12.5a6 6 0 0 0 12 0C18 8.5 14.5 5 12 2zm0 14a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>
                  </svg>
                  <span>Nagad</span>
                </div>

                {/* Rocket DBBL Rocket */}
                <div className="footer-pay-card pay-rocket" title="DBBL Rocket">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.13 2.21C12.3 2.2 11.5 2.7 11 3.5L8.5 7.5L5 9C4 9.5 3.5 10.5 4 11.5L6.5 15.5L7.5 19.5C7.7 20.5 8.7 21 9.5 20.5L13.5 18L17.5 15.5C18.5 15 19 14 18.5 13L16 9.5L14.5 4C14.2 3 13.7 2.2 13.13 2.21Z"/>
                  </svg>
                  <span>Rocket</span>
                </div>

                {/* Visa */}
                <div className="footer-pay-card pay-visa" title="Visa Card">
                  <span style={{ fontStyle: 'italic', fontWeight: 900, color: '#F7B600', letterSpacing: '0.05em' }}>VISA</span>
                </div>

                {/* Mastercard */}
                <div className="footer-pay-card pay-mastercard" title="Mastercard">
                  <span style={{ display: 'flex', alignItems: 'center', marginRight: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EB001B', display: 'inline-block' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F79E1B', display: 'inline-block', marginLeft: '-4px', opacity: 0.9 }}></span>
                  </span>
                  <span style={{ fontSize: '0.68rem' }}>Mastercard</span>
                </div>

                {/* COD */}
                <div className="footer-pay-card pay-cod" title="Cash On Delivery">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="2" y="6" width="20" height="12" rx="2"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span>COD</span>
                </div>
              </div>

              {/* Social Media Icons */}
              <div className="footer-social-row">
                {settings.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" title="Facebook" className="footer-social-btn">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                )}
                {settings.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" title="Instagram" className="footer-social-btn">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                )}
                {settings.youtube_url && (
                  <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube" className="footer-social-btn">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.41 19c1.71.46 8.59.46 8.59.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                  </a>
                )}
                {settings.whatsapp_number && (
                  <a href={`https://wa.me/${settings.whatsapp_number.replace(/\+/g, '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="footer-social-btn">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Footer Sub-Bar */}
          <div className="footer-bottom-divider">
            <div>
              © ২০২৬ সুন্দরবন হাট। সর্বস্বত্ব সংরক্ষিত।
            </div>
            <div>
              ভালোবাসার সঙ্গে তৈরি করেছে ❤️ <a href="https://www.authbrain.io" target="_blank" rel="noreferrer">AuthBrain</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Main Navigation">
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

      {/* Translator Widget */}
      <div className="translator-widget">
        <div id="google_translate_element"></div>
      </div>
    </>
  );
};
