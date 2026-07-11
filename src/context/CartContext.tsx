import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '../services/dataService';
import { 
  trackAddToCart, 
  trackRemoveFromCart, 
  trackAddToWishlist, 
  trackViewCart 
} from '../analytics/analytics';
import type { CartItem } from '../analytics/analytics';

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: Product[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('sh_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlistItems, setWishlistItems] = useState<Product[]>(() => {
    const saved = localStorage.getItem('sh_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [cartOpen, setCartOpenState] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sh_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('sh_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const setCartOpen = (open: boolean) => {
    setCartOpenState(open);
    if (open) {
      // Fire GA4 view_cart when drawer opens
      trackViewCart(cartItems);
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingIdx = prevItems.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prevItems];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prevItems, { product, quantity }];
    });
    // Track GA4 event
    trackAddToCart(product, quantity);
  };

  const removeFromCart = (productId: string, quantity = 1) => {
    const existing = cartItems.find(item => item.product.id === productId);
    if (!existing) return;

    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity - quantity;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });

    // Track GA4 event
    trackRemoveFromCart(existing.product, quantity);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, 99999); // remove all
      return;
    }
    const item = cartItems.find(i => i.product.id === productId);
    if (!item) return;

    const diff = quantity - item.quantity;
    if (diff > 0) {
      trackAddToCart(item.product, diff);
    } else if (diff < 0) {
      trackRemoveFromCart(item.product, Math.abs(diff));
    }

    setCartItems(prevItems => {
      return prevItems.map(i => {
        if (i.product.id === productId) {
          return { ...i, quantity };
        }
        return i;
      });
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const addToWishlist = (product: Product) => {
    setWishlistItems(prev => {
      if (prev.some(p => p.id === product.id)) return prev;
      return [...prev, product];
    });
    // Track GA4 event
    trackAddToWishlist(product);
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistItems(prev => prev.filter(p => p.id !== productId));
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      wishlistItems,
      cartOpen,
      setCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
