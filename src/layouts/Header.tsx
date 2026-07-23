import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  Info,
  PhoneCall,
  HelpCircle,
  Search,
  User,
  LayoutDashboard,
  Package,
  Heart,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabase/supabase';

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
}

const useAuthStatus = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const checkUserType = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);

        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id, name')
          .eq('id', session.user.id)
          .maybeSingle();
        setIsAdmin(!!adminData);

        // Fetch customer profile
        const { data: custData } = await supabase
          .from('customers')
          .select('full_name, phone, email')
          .eq('id', session.user.id)
          .maybeSingle();

        let resolvedName = adminData?.name || custData?.full_name || (custData as any)?.name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';

        // If resolvedName is missing, an email address, or numeric phone string, fallback to clean name or 'সম্মানিত গ্রাহক'
        if (!resolvedName || resolvedName.includes('@') || /^\d+$/.test(resolvedName)) {
          const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
          if (metaName && !metaName.includes('@') && !/^\d+$/.test(metaName)) {
            resolvedName = metaName;
          } else {
            resolvedName = 'সম্মানিত গ্রাহক';
          }
        }

        setProfile({
          name: resolvedName,
          email: session.user.email || custData?.email || '',
          phone: session.user.phone || custData?.phone || ''
        });
      } else {
        setIsAdmin(false);
        setUser(null);
        setProfile(null);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    checkUserType();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserType();
    });

    return () => subscription.unsubscribe();
  }, [checkUserType]);

  return { user, isAdmin, profile };
};

export const Header: React.FC = () => {
  const { cartItems, wishlistItems, setCartOpen } = useCart();
  const navigate = useNavigate();
  const { user, isAdmin, profile } = useAuthStatus();

  const [isAccountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems ? wishlistItems.length : 0;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when search bar expands
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    setAccountDropdownOpen(false);
    if (window.confirm('আপনি কি লগআউট করতে চান?')) {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        navigate('/login');
      }
    }
  };

  // User initials for Avatar placeholder
  const getUserInitial = () => {
    if (profile?.name) return profile.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header className="sh-header-wrapper">
      <style>{`
        .sh-header-wrapper {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(20, 74, 38, 0.08);
          box-shadow: 0 4px 20px -4px rgba(7, 34, 17, 0.06);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Desktop Header Layout */
        .sh-desktop-header {
          display: none;
        }

        @media (min-width: 1024px) {
          .sh-mobile-header {
            display: none !important;
          }
          .sh-desktop-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 80px;
            max-width: 1440px;
            margin: 0 auto;
            padding: 0 32px;
          }
        }

        /* Brand Logo */
        .sh-brand-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          transition: transform 0.25s ease;
        }
        .sh-brand-link:hover {
          transform: translateY(-1px);
        }
        .sh-brand-logo {
          height: 48px;
          width: 48px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(20, 74, 38, 0.15);
          border: 2px solid #ffffff;
        }
        .sh-brand-text {
          display: flex;
          flex-direction: column;
        }
        .sh-brand-name {
          font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: #144A26;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .sh-brand-tagline {
          font-size: 0.72rem;
          font-weight: 600;
          color: #5A4325;
          letter-spacing: 0.04em;
        }

        /* Navigation Menu */
        .sh-desktop-nav {
          display: flex;
          align-items: center;
        }
        .sh-nav-list {
          display: flex;
          align-items: center;
          gap: 8px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .sh-nav-item {
          position: relative;
        }
        .sh-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 12px;
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 1.02rem;
          font-weight: 600;
          color: #334155;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          cursor: pointer;
        }
        .sh-nav-link:hover {
          color: #144A26;
          background: rgba(20, 74, 38, 0.05);
          transform: translateY(-1px);
        }
        .sh-nav-link.active {
          color: #144A26;
          font-weight: 700;
          background: rgba(20, 74, 38, 0.08);
        }
        .sh-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          background: #144A26;
          border-radius: 99px;
        }

        /* Right Actions */
        .sh-actions-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Action Buttons */
        .sh-action-btn {
          height: 44px;
          width: 44px;
          border-radius: 12px;
          border: 1px solid rgba(20, 74, 38, 0.12);
          background: #ffffff;
          color: #1e293b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }
        .sh-action-btn:hover {
          background: #f8fafc;
          border-color: #144A26;
          color: #144A26;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(20, 74, 38, 0.1);
        }

        /* Cart Badge */
        .sh-cart-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          min-width: 20px;
          height: 20px;
          border-radius: 99px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
        }

        /* Search Expandable Modal / Input */
        .sh-search-container {
          position: relative;
        }
        .sh-search-input-wrapper {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid #144A26;
          border-radius: 14px;
          padding: 4px 6px 4px 14px;
          box-shadow: 0 8px 24px rgba(20, 74, 38, 0.12);
          width: 320px;
          animation: shSearchExpand 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shSearchExpand {
          from { opacity: 0; width: 120px; transform: scaleX(0.9); }
          to { opacity: 1; width: 320px; transform: scaleX(1); }
        }
        .sh-search-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 0.95rem;
          color: #1e293b;
          padding: 6px 8px;
        }

        /* Profile Button Chip */
        .sh-user-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px 6px 8px;
          border-radius: 14px;
          border: 1px solid rgba(20, 74, 38, 0.12);
          background: #ffffff;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          user-select: none;
        }
        .sh-user-chip:hover, .sh-user-chip.open {
          border-color: #144A26;
          background: #f8fafc;
          box-shadow: 0 6px 18px rgba(20, 74, 38, 0.1);
        }
        .sh-avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #144A26, #072211);
          color: #ffffff;
          font-family: 'Noto Sans Bengali', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(20, 74, 38, 0.2);
        }
        .sh-user-label {
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 0.92rem;
          font-weight: 700;
          color: #1e293b;
          max-width: 110px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* User Dropdown Card */
        .sh-dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 270px;
          background: #ffffff;
          border: 1px solid rgba(20, 74, 38, 0.1);
          border-radius: 16px;
          box-shadow: 0 16px 36px -6px rgba(7, 34, 17, 0.12), 0 6px 16px -4px rgba(0, 0, 0, 0.06);
          padding: 8px;
          z-index: 200;
          transform-origin: top right;
          animation: shDropdownSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shDropdownSlide {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .sh-dropdown-header {
          padding: 12px 14px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sh-dropdown-user-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sh-dropdown-user-name {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sh-dropdown-user-email {
          font-size: 0.78rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sh-dropdown-badge {
          display: inline-block;
          margin-top: 2px;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
          background: rgba(20, 74, 38, 0.1);
          color: #144A26;
        }

        .sh-dropdown-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 6px 0;
        }

        .sh-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          color: #334155;
          text-decoration: none;
          transition: all 0.2s ease;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }
        .sh-dropdown-item:hover {
          background: rgba(20, 74, 38, 0.06);
          color: #144A26;
          transform: translateX(3px);
        }
        .sh-dropdown-item--danger {
          color: #ef4444;
        }
        .sh-dropdown-item--danger:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        /* Mobile Header */
        .sh-mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
        }
      `}</style>

      {/* DESKTOP HEADER */}
      <div className="sh-desktop-header" data-testid="desktop-header">
        {/* Left Section: Company Logo */}
        <Link to="/" className="sh-brand-link" title="সুন্দরবন হাট হোম">
          <img src="/logo.jpg" alt="সুন্দরবন হাট লোগো" className="sh-brand-logo" />
          <div className="sh-brand-text">
            <span className="sh-brand-name">সুন্দরবন হাট</span>
            <span className="sh-brand-tagline">খাঁটি ও প্রাকৃতিক পণ্য</span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="sh-desktop-nav" aria-label="প্রধান নেভিগেশন">
          <ul className="sh-nav-list">
            <li className="sh-nav-item">
              <NavLink to="/" className={({ isActive }) => `sh-nav-link ${isActive ? 'active' : ''}`} end>
                <Home size={18} />
                <span>হোম</span>
              </NavLink>
            </li>
            <li className="sh-nav-item">
              <NavLink to="/products" className={({ isActive }) => `sh-nav-link ${isActive ? 'active' : ''}`}>
                <ShoppingBag size={18} />
                <span>পণ্যসমূহ</span>
              </NavLink>
            </li>
            <li className="sh-nav-item">
              <NavLink to="/about" className={({ isActive }) => `sh-nav-link ${isActive ? 'active' : ''}`}>
                <Info size={18} />
                <span>আমাদের সম্পর্কে</span>
              </NavLink>
            </li>
            <li className="sh-nav-item">
              <NavLink to="/contact" className={({ isActive }) => `sh-nav-link ${isActive ? 'active' : ''}`}>
                <PhoneCall size={18} />
                <span>যোগাযোগ</span>
              </NavLink>
            </li>
            <li className="sh-nav-item">
              <NavLink to="/faq" className={({ isActive }) => `sh-nav-link ${isActive ? 'active' : ''}`}>
                <HelpCircle size={18} />
                <span>জিজ্ঞাসা</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Right Section: Actions (Search, Cart, User) */}
        <div className="sh-actions-group">
          {/* Search Trigger / Input */}
          <div className="sh-search-container">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="sh-search-input-wrapper">
                <Search size={18} style={{ color: '#144A26', flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="পণ্য খুঁজুন (যেমন: মধু, আম)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sh-search-input"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="sh-action-btn"
                onClick={() => setSearchOpen(true)}
                title="পণ্য খুঁজুন"
                aria-label="পণ্য খুঁজুন"
              >
                <Search size={20} />
              </button>
            )}
          </div>

          {/* Wishlist Icon with Badge */}
          <button
            type="button"
            className="sh-action-btn"
            onClick={() => navigate('/account?tab=wishlist')}
            title="পছন্দের তালিকা"
            aria-label="পছন্দের তালিকা"
          >
            <Heart size={20} fill={wishlistCount > 0 ? '#ef4444' : 'none'} style={{ color: wishlistCount > 0 ? '#ef4444' : 'inherit' }} />
            {wishlistCount > 0 && <span className="sh-cart-badge" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>{wishlistCount}</span>}
          </button>

          {/* Cart Icon with Badge */}
          <button
            type="button"
            className="sh-action-btn"
            onClick={() => setCartOpen(true)}
            title="অর্ডার ঝুড়ি"
            aria-label="অর্ডার ঝুড়ি"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="sh-cart-badge">{cartCount}</span>}
          </button>

          {/* User Profile Avatar / Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              className={`sh-user-chip ${isAccountDropdownOpen ? 'open' : ''}`}
              onClick={() => setAccountDropdownOpen(!isAccountDropdownOpen)}
              title="ইউজার প্রোফাইল"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setAccountDropdownOpen(!isAccountDropdownOpen)}
            >
              <div className="sh-avatar-circle">
                {user ? getUserInitial() : <User size={18} />}
              </div>
              <span className="sh-user-label">
                {user ? (isAdmin ? 'অ্যাডমিন' : profile?.name || 'অ্যাকাউন্ট') : 'লগইন'}
              </span>
              <ChevronDown
                size={16}
                style={{
                  color: '#64748b',
                  transition: 'transform 0.2s ease',
                  transform: isAccountDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>

            {/* Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="sh-dropdown-menu">
                {user ? (
                  <>
                    {/* Top User Info Card */}
                    <div className="sh-dropdown-header">
                      <div className="sh-avatar-circle" style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                        {getUserInitial()}
                      </div>
                      <div className="sh-dropdown-user-info">
                        <span className="sh-dropdown-user-name">{profile?.name || 'সম্মানিত গ্রাহক'}</span>
                        <span className="sh-dropdown-badge">{isAdmin ? 'অ্যাডমিন' : 'গ্রাহক'}</span>
                      </div>
                    </div>

                    <div className="sh-dropdown-divider" />

                    {/* Menu Items for Logged In User */}
                    <NavLink
                      to="/account"
                      className="sh-dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <User size={16} />
                      <span>আমার প্রোফাইল</span>
                    </NavLink>

                    <NavLink
                      to={isAdmin ? '/admin/dashboard' : '/account'}
                      className="sh-dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      <span>ড্যাশবোর্ড</span>
                    </NavLink>

                    <NavLink
                      to="/account?tab=orders"
                      className="sh-dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <Package size={16} />
                      <span>আমার অর্ডার</span>
                    </NavLink>

                    <NavLink
                      to="/account?tab=wishlist"
                      className="sh-dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Heart size={16} fill={wishlistCount > 0 ? '#ef4444' : 'none'} style={{ color: wishlistCount > 0 ? '#ef4444' : 'inherit' }} />
                        <span>পছন্দের তালিকা</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                        }}>
                          {wishlistCount}
                        </span>
                      )}
                    </NavLink>

                    <NavLink
                      to="/account?tab=settings"
                      className="sh-dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <Settings size={16} />
                      <span>সেটিংস</span>
                    </NavLink>

                    <div className="sh-dropdown-divider" />

                    <button
                      onClick={handleLogout}
                      className="sh-dropdown-item sh-dropdown-item--danger"
                    >
                      <LogOut size={16} />
                      <span>লগআউট</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Menu Items for Logged Out User */}
                    <NavLink
                      to="/login"
                      className="sh-dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <LogIn size={16} />
                      <span>লগইন</span>
                    </NavLink>

                    <NavLink
                      to="/register"
                      className="sh-dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <UserPlus size={16} />
                      <span>নিবন্ধন করুন</span>
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="sh-mobile-header" data-testid="mobile-header">
        <Link to="/" className="sh-brand-link">
          <img src="/logo.jpg" alt="সুন্দরবন হাট লোগো" className="sh-brand-logo" style={{ height: '40px', width: '40px' }} />
          <span className="sh-brand-name" style={{ fontSize: '1.15rem' }}>সুন্দরবন হাট</span>
        </Link>

        <div className="sh-actions-group" style={{ gap: '8px' }}>
          <button
            type="button"
            className="sh-action-btn"
            onClick={() => navigate('/products')}
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          <button
            type="button"
            className="sh-action-btn"
            onClick={() => setCartOpen(true)}
            title="অর্ডার ঝুড়ি"
            aria-label="অর্ডার ঝুড়ি"
          >
            <ShoppingBag size={19} />
            {cartCount > 0 && <span className="sh-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};

