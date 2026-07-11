import type { Product } from '../services/dataService';

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

// Ensure dataLayer is initialized
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// GA4 Item Specification Type
export interface GA4Item {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  currency?: string;
  discount?: number;
  coupon?: string;
  index?: number;
  affiliation?: string;
}

// Cart Item Type
export interface CartItem {
  product: Product;
  quantity: number;
}

// Order Specifications
export interface Order {
  transaction_id: string;
  value: number;
  currency: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  payment_type?: string;
  shipping_tier?: string;
  items: CartItem[];
}

/**
 * Maps a local Product object to standard GA4 Item object.
 */
export const mapProductToGA4Item = (product: Product, quantity = 1, index?: number): GA4Item => {
  return {
    item_id: product.id,
    item_name: product.title,
    item_brand: 'Sundarban Hat', // Brand name
    item_category: product.category, // e.g. honey, shrimp
    item_category2: product.subcategory, // e.g. সুন্দরবনের খাঁটি মধু
    item_variant: product.weight, // e.g. ৫০০ গ্রাম
    price: product.priceNum,
    quantity: quantity,
    currency: 'BDT',
    index: index,
    affiliation: 'Sundarban Hat Main Store'
  };
};

/**
 * Pushes data to the GTM dataLayer securely.
 */
export const pushToDataLayer = (payload: object) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(payload);
  }
};

/**
 * Safely pushes an ecommerce event after clearing the previous ecommerce state.
 */
export const pushEcommerceEvent = (eventName: string, ecommerceData: object) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // 1. Clear previous ecommerce state to avoid object pollution (Google GA4 Recommendation)
    window.dataLayer.push({ ecommerce: null });
    // 2. Push the new event with the ecommerce payload
    window.dataLayer.push({
      event: eventName,
      ecommerce: ecommerceData
    });
  }
};

/**
 * 1. Page View tracking (SPA navigation helper)
 */
export const trackPageView = (path: string) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: path,
    page_title: document.title,
    page_location: window.location.href
  });
};

/**
 * 2. View Item List (Category/Product list views)
 */
export const trackViewItemList = (products: Product[], listName = 'Product List') => {
  const items = products.map((prod, idx) => mapProductToGA4Item(prod, 1, idx + 1));
  pushEcommerceEvent('view_item_list', {
    item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
    item_list_name: listName,
    items: items
  });
};

/**
 * 3. Select Item (Clicking a product)
 */
export const trackSelectItem = (product: Product, index?: number, listName = 'Product List') => {
  pushEcommerceEvent('select_item', {
    item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
    item_list_name: listName,
    items: [mapProductToGA4Item(product, 1, index)]
  });
};

/**
 * 4. View Item (Product Detail Page)
 */
export const trackViewItem = (product: Product) => {
  pushEcommerceEvent('view_item', {
    currency: 'BDT',
    value: product.priceNum,
    items: [mapProductToGA4Item(product, 1, 1)]
  });
};

/**
 * 5. Add to Cart
 */
export const trackAddToCart = (product: Product, quantity = 1) => {
  pushEcommerceEvent('add_to_cart', {
    currency: 'BDT',
    value: product.priceNum * quantity,
    items: [mapProductToGA4Item(product, quantity)]
  });
};

/**
 * 6. Remove from Cart
 */
export const trackRemoveFromCart = (product: Product, quantity = 1) => {
  pushEcommerceEvent('remove_from_cart', {
    currency: 'BDT',
    value: product.priceNum * quantity,
    items: [mapProductToGA4Item(product, quantity)]
  });
};

/**
 * 7. View Cart
 */
export const trackViewCart = (cartItems: CartItem[]) => {
  const value = cartItems.reduce((acc, curr) => acc + (curr.product.priceNum * curr.quantity), 0);
  pushEcommerceEvent('view_cart', {
    currency: 'BDT',
    value: value,
    items: cartItems.map((item, idx) => mapProductToGA4Item(item.product, item.quantity, idx + 1))
  });
};

/**
 * 8. Begin Checkout
 */
export const trackBeginCheckout = (cartItems: CartItem[]) => {
  const value = cartItems.reduce((acc, curr) => acc + (curr.product.priceNum * curr.quantity), 0);
  pushEcommerceEvent('begin_checkout', {
    currency: 'BDT',
    value: value,
    items: cartItems.map((item, idx) => mapProductToGA4Item(item.product, item.quantity, idx + 1))
  });
};

/**
 * 9. Add Shipping Info
 */
export const trackAddShippingInfo = (cartItems: CartItem[], shippingTier: string) => {
  const value = cartItems.reduce((acc, curr) => acc + (curr.product.priceNum * curr.quantity), 0);
  pushEcommerceEvent('add_shipping_info', {
    currency: 'BDT',
    value: value,
    shipping_tier: shippingTier,
    items: cartItems.map((item, idx) => mapProductToGA4Item(item.product, item.quantity, idx + 1))
  });
};

/**
 * 10. Add Payment Info
 */
export const trackAddPaymentInfo = (cartItems: CartItem[], paymentType: string) => {
  const value = cartItems.reduce((acc, curr) => acc + (curr.product.priceNum * curr.quantity), 0);
  pushEcommerceEvent('add_payment_info', {
    currency: 'BDT',
    value: value,
    payment_type: paymentType,
    items: cartItems.map((item, idx) => mapProductToGA4Item(item.product, item.quantity, idx + 1))
  });
};

/**
 * 11. Purchase Event
 */
export const trackPurchase = (order: Order) => {
  pushEcommerceEvent('purchase', {
    transaction_id: order.transaction_id,
    value: order.value,
    tax: order.tax || 0,
    shipping: order.shipping || 0,
    currency: order.currency,
    coupon: order.coupon || '',
    payment_type: order.payment_type || 'Cash on Delivery',
    shipping_tier: order.shipping_tier || 'Standard',
    items: order.items.map((item, idx) => mapProductToGA4Item(item.product, item.quantity, idx + 1))
  });
};

/**
 * 12. Refund Event
 */
export const trackRefund = (order: Order) => {
  pushEcommerceEvent('refund', {
    transaction_id: order.transaction_id,
    value: order.value,
    currency: order.currency,
    items: order.items.map((item, idx) => mapProductToGA4Item(item.product, item.quantity, idx + 1))
  });
};

/**
 * 13. Add to Wishlist
 */
export const trackAddToWishlist = (product: Product) => {
  pushEcommerceEvent('add_to_wishlist', {
    currency: 'BDT',
    value: product.priceNum,
    items: [mapProductToGA4Item(product, 1, 1)]
  });
};

/**
 * 14. Search Event
 */
export const trackSearch = (searchTerm: string) => {
  pushToDataLayer({
    event: 'search',
    search_term: searchTerm
  });
};

/**
 * 15. Login Event
 */
export const trackLogin = (method: string) => {
  pushToDataLayer({
    event: 'login',
    method: method
  });
};

/**
 * 16. Sign Up Event
 */
export const trackSignUp = (method: string) => {
  pushToDataLayer({
    event: 'sign_up',
    method: method
  });
};

/**
 * Custom Lead Tracking (WhatsApp or Call clicks)
 */
export const trackLead = (type: 'whatsapp' | 'call', productId: string, productName: string) => {
  pushToDataLayer({
    event: 'lead_generation',
    lead_type: type,
    product_id: productId,
    product_name: productName,
    value: 0,
    currency: 'BDT'
  });
};
