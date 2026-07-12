import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, UserCircle, ChevronDown, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabase/supabase';

const useAuthStatus = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUserType = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: adminData } = await supabase.from('admin_users').select('id').eq('id', session.user.id).maybeSingle();
        setIsAdmin(!!adminData);
        setUser(session.user);
      } else {
        setIsAdmin(false);
        setUser(null);
      }
    };

    checkUserType();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserType();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isAdmin };
};

export const Header: React.FC = () => {
  const { cartItems, setCartOpen } = useCart(); // Keep setCartOpen here
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuthStatus();
  
  const [isAccountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = async () => {
    if (window.confirm('আপনি কি লগআউট করতে চান?')) {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        navigate('/login');
      }
    }
  };

  const accountLink = isAdmin ? '/admin/dashboard' : (user ? '/account' : '/login');

  const renderDesktopHeader = useCallback(() => (
    <div className="desktop-header simple-header" data-testid="desktop-header">
      <div className="container">
        <Link to="/" className="nav-brand">
          <img src="/logo.jpg" alt="সুন্দরবন হাট লোগো" />
          <span>সুন্দরবন হাট</span>
        </Link>
        <nav className="desktop-nav-main">
          <ul className="nav-menu">
            <li><NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>হোম</NavLink></li>
            <li><NavLink to="/products" className="nav-link">পণ্যসমূহ</NavLink></li>
            <li><NavLink to="/about" className="nav-link">আমাদের সম্পর্কে</NavLink></li>
            <li><NavLink to="/contact" className="nav-link">যোগাযোগ</NavLink></li>
            <li><NavLink to="/faq" className="nav-link">জিজ্ঞাসা</NavLink></li>
          </ul>
        </nav>
        <div className="header-actions">
          <button type="button" className="header-icon-button" onClick={() => setCartOpen(true)} title="অর্ডার ঝুড়ি" aria-label="অর্ডার ঝুড়ি">
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="header-badge">{cartCount}</span>}
          </button>
          <div className="account-menu" onMouseEnter={() => setAccountDropdownOpen(true)} onMouseLeave={() => setAccountDropdownOpen(false)}>
            <Link to={accountLink} className="header-account-chip">
              {isAdmin ? <LayoutDashboard size={22} /> : <UserCircle size={22} />}
              <span>{user ? (isAdmin ? 'অ্যাডমিন' : 'অ্যাকাউন্ট') : 'লগইন'}</span>
              {user && <ChevronDown size={16} className={`transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />}
            </Link>
            {user && isAccountDropdownOpen && (
              <div className="account-dropdown">
                {isAdmin ? (
                  <>
                    <NavLink to="/admin/dashboard" className="dropdown-item"><LayoutDashboard size={16} /> Dashboard</NavLink>
                    <NavLink to="/admin/orders" className="dropdown-item"><ShoppingBag size={16} /> Orders</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/account" className="dropdown-item"><User size={16} /> Profile</NavLink>
                    <NavLink to="/account/orders" className="dropdown-item"><ShoppingBag size={16} /> Orders</NavLink>
                  </>
                )}
                <NavLink to={isAdmin ? "/admin/settings" : "/account/settings"} className="dropdown-item"><Settings size={16} /> Settings</NavLink>
                <button onClick={handleLogout} className="dropdown-item dropdown-item--logout">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ), [user, isAdmin, cartCount, isAccountDropdownOpen, location.pathname, accountLink, handleLogout]);

  const renderMobileHeader = useCallback(() => (
    <div className="mobile-header" data-testid="mobile-header">
      <div className="container">
        <nav className="navbar">
            <Link to="/" className="nav-brand">
              <img src="/logo.jpg" alt="সুন্দরবন হাট লোগো" />
              <span>সুন্দরবন হাট</span>
            </Link>

            <div className="header-actions">
              <button type="button" className="header-icon-button" onClick={() => navigate('/products')} aria-label="Search">
                <Search size={20} />
              </button>

              <button type="button" className="header-icon-button" onClick={() => setCartOpen(true)} title="অর্ডার ঝুড়ি" aria-label="অর্ডার ঝুড়ি">
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="header-badge">{cartCount}</span>}
              </button>
            </div>
        </nav>
      </div>
    </div>
  ), [cartCount, navigate]);

  return (
    <header className="header">
      {/* 
        This style block handles the responsive swapping between the mobile and desktop headers.
        Ideally, this CSS should be moved to your main stylesheet.
      */}
      <style>{`
        .desktop-header {
          display: none; /* Hidden by default */
          padding: 15px !important; /* Added padding for desktop view */
        }
        @media (min-width: 1024px) {
          .mobile-header {
            display: none; /* Hide mobile header on desktop */
          }
          .desktop-header {
            display: flex;
            align-items: center;
            padding: 0 15px; /* Added padding for desktop view */
            justify-content: space-between;
          }
          .desktop-header .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }
          .desktop-header .desktop-nav-main {
            flex-grow: 1;
            display: flex;
            justify-content: center;
          }
          .desktop-header .desktop-nav-main .nav-menu > li {
            margin: 0 1.25rem; /* Increased spacing for a cleaner look */
          }
        }
      `}</style>
      {renderDesktopHeader()}
      {renderMobileHeader()}
    </header>
  );
};
