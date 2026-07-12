import React, { useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { getImageUrl } from '../services/dataService';
import { trackBeginCheckout } from '../analytics/analytics';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const { cartItems, cartOpen, setCartOpen, updateQuantity, removeFromCart } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cartOpen) {
        setCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartOpen, setCartOpen]);

  // Click outside fallback for light dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cartOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [cartOpen, setCartOpen]);

  // Auto-close timer: remains open for 4 seconds, resets on item addition/changes
  useEffect(() => {
    if (cartOpen && cartItems.length > 0) {
      const timer = setTimeout(() => {
        setCartOpen(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [cartOpen, cartItems, setCartOpen]);

  if (!cartOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.priceNum * item.quantity,
    0
  );

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutClick = () => {
    trackBeginCheckout(cartItems);
    setCartOpen(false);
    onOpenCheckout();
  };

  const handleViewCartClick = () => {
    setCartOpen(false);
    navigate('/products');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(7, 34, 17, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-start',
      transition: 'opacity 0.3s ease'
    }}>
      <div 
        ref={drawerRef}
        style={{
          width: '100%',
          maxWidth: '450px',
          height: '100%',
          backgroundColor: 'var(--color-white)',
          borderRight: '5px double var(--color-mud)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '10px 0 30px rgba(0,0,0,0.15)',
          animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-sand)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag style={{ color: 'var(--color-mangrove)' }} size={24} />
            <h3 style={{ margin: 0, color: 'var(--color-forest-dark)', fontSize: '1.25rem', fontWeight: 'bold' }}>
              অর্ডার ঝুড়ি ({totalItemsCount}টি পণ্য)
            </h3>
          </div>
          <button 
            onClick={() => setCartOpen(false)}
            aria-label="Close Cart Drawer"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-mud)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(90, 67, 37, 0.08)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {cartItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80%',
              textAlign: 'center',
              color: 'gray'
            }}>
              <ShoppingBag size={64} style={{ strokeWidth: 1, marginBottom: '15px', color: 'var(--color-sand-dark)' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--color-mud)' }}>আপনার ঝুড়িটি খালি!</p>
              <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>সুন্দরবনের তাজা ও খাঁটি পণ্যগুলো অর্ডার করতে পণ্য তালিকা দেখুন।</p>
              <button 
                onClick={handleViewCartClick}
                className="btn btn-outline"
                style={{ marginTop: '20px', padding: '8px 20px' }}
              >
                পণ্য তালিকা দেখুন
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.map((item) => (
                <div 
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    gap: '15px',
                    padding: '15px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: '#fff',
                    position: 'relative'
                  }}
                >
                  <img 
                    src={getImageUrl(item.product.img)} 
                    alt={item.product.title} 
                    style={{
                      width: '70px',
                      height: '70px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-sand)'
                    }}
                  />
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>
                        {item.product.title}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-mud)', fontWeight: 'bold' }}>
                        ওজন/সাইজ: {item.product.weight || 'সাধারণ'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      {/* Quantity Selector */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--border-radius-full)',
                        padding: '2px 8px',
                        backgroundColor: 'var(--color-sand)'
                      }}>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}
                        >
                          <Minus size={14} style={{ color: 'var(--color-mud)' }} />
                        </button>
                        <span style={{ margin: '0 10px', fontSize: '0.9rem', fontWeight: 'bold' }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}
                        >
                          <Plus size={14} style={{ color: 'var(--color-mud)' }} />
                        </button>
                      </div>

                      {/* Prices */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'gray' }}>৳{item.product.priceNum} × {item.quantity}</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-mangrove)', fontSize: '1.05rem' }}>
                          ৳{item.product.priceNum * item.quantity}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(item.product.id, item.quantity)}
                    style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#e53935',
                      padding: '4px'
                    }}
                    title="পণ্যটি বাদ দিন"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & Actions */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '24px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-sand)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '1.05rem', color: 'var(--color-mud)', fontWeight: '500' }}>উপমোট মূল্য (Subtotal):</span>
              <span style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--color-mangrove)' }}>৳{totalAmount}</span>
            </div>

            {/* Action Buttons */}
            <button 
              onClick={handleCheckoutClick}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                borderRadius: 'var(--border-radius-md)'
              }}
            >
              চেকআউট করুন (Checkout) 🛒
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleViewCartClick}
                className="btn btn-outline"
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer'
                }}
              >
                পণ্য দেখুন (View Cart)
              </button>
              
              <button 
                onClick={() => setCartOpen(false)}
                className="btn btn-outline"
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer'
                }}
              >
                শপিং চালিয়ে যান
              </button>
            </div>

            <p style={{
              fontSize: '0.75rem',
              color: 'gray',
              textAlign: 'center',
              marginTop: '4px',
              margin: '0'
            }}>
              * ঢাকা ও সাতক্ষীরায় ডেলিভারি চার্জ ৳৬০, অন্যান্য জেলায় ৳১২০। ক্যাশ অন ডেলিভারি প্রযোজ্য।
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
