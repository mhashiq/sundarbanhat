import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabase/supabase';

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { cartItems, wishlistItems, setCartOpen } = useCart();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);

  // Close mobile menu on page transition
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    const checkUserType = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (adminData) {
          setIsAdmin(true);
          setIsCustomer(false);
        } else {
          setIsAdmin(false);
          setIsCustomer(true);
        }
      } else {
        setIsAdmin(false);
        setIsCustomer(false);
      }
    };
    checkUserType();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUserType();
      } else {
        setIsAdmin(false);
        setIsCustomer(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  return (
    <header className="header" style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px var(--color-shadow)' }}>
      <div className="container">
        <nav className="navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="সুন্দরবন হাট লোগো" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>সুন্দরবন হাট</span>
          </Link>

          {/* Cart & Wishlist Actions (Desktop & Mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', marginRight: '15px' }}>
            {/* Wishlist Button */}
            {wishlistCount > 0 && (
              <Link 
                to="/products?filter=wishlist"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#e53935',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px'
                }}
                title="পছন্দের তালিকা"
              >
                <Heart size={22} fill="#e53935" />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--color-honey-glow)',
                  color: 'var(--color-forest-dark)',
                  borderRadius: '50%',
                  minWidth: '16px',
                  height: '16px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-white)'
                }}>
                  {wishlistCount}
                </span>
              </Link>
            )}

            {/* Cart Button */}
            <button 
              onClick={() => setCartOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-mangrove)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}
              title="অর্ডার ঝুড়ি"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="cart-badge" style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--color-honey-glow)',
                  color: 'var(--color-forest-dark)',
                  borderRadius: '50%',
                  minWidth: '16px',
                  height: '16px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-white)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="মেনু"
            style={{ display: 'none' /* Will be overridden by media query in CSS */ }}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>

          <ul className={`nav-menu ${isOpen ? 'active' : ''}`} style={{ display: 'flex', gap: '20px', margin: 0 }}>
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                হোম
              </NavLink>
            </li>
            <li>
              <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                পণ্যসমূহ
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                আমাদের সম্পর্কে
              </NavLink>
            </li>
            <li>
              <NavLink to="/why-us" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                কেন আমরা
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                যোগাযোগ
              </NavLink>
            </li>
            <li>
              <NavLink to="/faq" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                জিজ্ঞাসা ও ব্লগ
              </NavLink>
            </li>
            {isAdmin ? (
              <>
                <li>
                  <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--color-honey)', fontWeight: 'bold' }}>
                    অ্যাডমিন প্যানেল 🛡️
                  </NavLink>
                </li>
                <li>
                  <span 
                    onClick={async () => {
                      if (window.confirm('আপনি কি লগআউট করতে চান?')) {
                        await supabase.auth.signOut();
                        window.location.hash = '#/login';
                      }
                    }} 
                    className="nav-link" 
                    style={{ color: '#ff6666', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    লগআউট 🚪
                  </span>
                </li>
              </>
            ) : isCustomer ? (
              <>
                <li>
                  <NavLink to="/account" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--color-mangrove)', fontWeight: 'bold' }}>
                    আমার অ্যাকাউন্ট 👤
                  </NavLink>
                </li>
                <li>
                  <span 
                    onClick={async () => {
                      if (window.confirm('আপনি কি লগআউট করতে চান?')) {
                        await supabase.auth.signOut();
                        window.location.hash = '#/login';
                      }
                    }} 
                    className="nav-link" 
                    style={{ color: '#ff6666', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    লগআউট 🚪
                  </span>
                </li>
              </>
            ) : (
              <li>
                <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ fontWeight: 'bold' }}>
                  অ্যাকাউন্ট 👤
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};
