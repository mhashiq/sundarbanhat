import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabase/supabase';
import { 
  ArrowLeft,
  ShieldCheck,
  Package,
  Truck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShoppingBag,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  trackAddShippingInfo, 
  trackAddPaymentInfo
} from '../analytics/analytics';
import { dataService, getImageUrl, type PaymentMethod } from '../services/dataService';

export const Checkout: React.FC = () => {
  const { cartItems, clearCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  // Accordion Section State: 'delivery' | 'payment' | 'summary'
  const [activeSection, setActiveSection] = useState<'delivery' | 'payment' | 'summary'>('delivery');

  // Auth & Saved Addresses state
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState<'satkhira' | 'dhaka' | 'other'>('satkhira');
  const [thana, setThana] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // Manual payment transaction state
  const [transactionIdInput, setTransactionIdInput] = useState('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculation
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.priceNum * item.quantity, 0);
  const shippingCost = city === 'other' ? 120 : 60;
  const total = Math.max(0, subtotal + shippingCost - appliedDiscount);

  // Redirect if cart empty
  useEffect(() => {
    if (cartItems.length === 0 && !isSubmittingRef.current) {
      navigate('/products');
    }
  }, [cartItems, navigate]);

  // Load user details & saved addresses
  useEffect(() => {
    const loadCustomerData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCustomerId(session.user.id);
        
        // Fetch profile
        const { data: profile } = await supabase
          .from('customers')
          .select('full_name, phone, email')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.full_name) setName(profile.full_name);
          if (profile.phone) setPhone(profile.phone);
        }

        // Fetch saved addresses
        const { data: addrs } = await supabase
          .from('addresses')
          .select('*')
          .eq('customer_id', session.user.id);

        if (addrs && addrs.length > 0) {
          setSavedAddresses(addrs);
          const defAddr = addrs.find(a => a.is_default) || addrs[0];
          setSelectedAddrId(defAddr.id);
          setAddress(defAddr.address_line);
          setCity(defAddr.district.toLowerCase() === 'dhaka' ? 'dhaka' : defAddr.district.toLowerCase().includes('satkhira') ? 'satkhira' : 'other');
          if (defAddr.thana) setThana(defAddr.thana);
        } else {
          setIsAddingNewAddress(true);
        }
      } else {
        setIsAddingNewAddress(true);
      }
    };

    loadCustomerData();
  }, []);

  // Handle saved address select
  const handleAddressSelect = (addrId: string) => {
    setSelectedAddrId(addrId);
    if (addrId === 'new') {
      setIsAddingNewAddress(true);
      setAddress('');
      setThana('');
      setCity('satkhira');
    } else {
      setIsAddingNewAddress(false);
      const selected = savedAddresses.find(a => a.id === addrId);
      if (selected) {
        setAddress(selected.address_line);
        setThana(selected.thana || '');
        setCity(selected.district.toLowerCase() === 'dhaka' ? 'dhaka' : selected.district.toLowerCase().includes('satkhira') ? 'satkhira' : 'other');
      }
    }
  };

  // Payment option change
  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    const paymentTypeMap: Record<PaymentMethod, string> = {
      cod: 'Cash on Delivery',
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      bank_transfer: 'Bank Transfer'
    };
    trackAddPaymentInfo(cartItems, paymentTypeMap[method] || 'Manual Payment');
  };

  // Coupon handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError('কুপন কোড লিখুন');
      return;
    }

    if (code === 'SUNDARBAN10' || code === 'SH10') {
      const discount = Math.round(subtotal * 0.1);
      setAppliedDiscount(discount);
      setCouponSuccess(`১০% ছাড় সফলভাবে প্রযোজ্য হয়েছে! (৳${discount} ছাড়)`);
    } else if (code === 'FREESHIP') {
      setAppliedDiscount(shippingCost);
      setCouponSuccess('ফ্রি ডেলিভারি ডিসকাউন্ট প্রযোজ্য হয়েছে!');
    } else {
      setCouponError('অবৈধ বা মেয়াদোত্তীর্ণ কুপন কোড');
    }
  };

  // Validate step 1
  const validateDelivery = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'আপনার নাম লিখুন';
    if (!phone.trim()) newErrors.phone = 'আপনার সচল মোবাইল নম্বরটি লিখুন';
    else if (!/^01[3-9]\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বরটি লিখুন';
    }
    if (!address.trim()) newErrors.address = 'পূর্ণাঙ্গ ডেলিভারি ঠিকানা লিখুন';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Proceed from delivery to payment
  const handleContinueToPayment = () => {
    if (validateDelivery()) {
      const shippingTier = city === 'other' ? 'Outside District Standard' : 'Local District Standard';
      trackAddShippingInfo(cartItems, shippingTier);
      setActiveSection('payment');
    }
  };

  // Final Order Submit
  const handleSubmitOrder = async () => {
    if (!validateDelivery()) {
      setActiveSection('delivery');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    const transactionId = `SH-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let resolvedCustomerId: string | null = null;
      let userEmail: string | null = null;

      if (session?.user) {
        resolvedCustomerId = customerId || session.user.id;
        userEmail = session.user.email || null;

        try {
          await supabase
            .from('customers')
            .upsert({
              id: session.user.id,
              full_name: name.trim(),
              phone: phone.trim(),
              email: session.user.email || null,
              last_active_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch {
          // Ignore non-critical customer table update error
        }
      }

      const fullAddressString = thana.trim() ? `${address.trim()}, উপজেলা: ${thana.trim()}` : address.trim();

      const orderPayload = {
        transaction_id: transactionId,
        customer_name: name.trim(),
        phone: phone.trim(),
        email: userEmail,
        address: fullAddressString,
        city: city === 'satkhira' ? 'Satkhira' : city === 'dhaka' ? 'Dhaka' : 'Other',
        shipping_cost: shippingCost,
        subtotal: subtotal,
        total: total,
        payment_method: paymentMethod,
        notes: notes.trim(),
        customer_id: resolvedCustomerId
      };

      const orderItems = cartItems.map(item => ({
        product: {
          id: item.product.id,
          priceNum: item.product.priceNum
        },
        quantity: item.quantity
      }));

      // Create Order in DB
      const dbOrderId = await dataService.createOrder(orderPayload, orderItems);

      // Insert status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: dbOrderId,
          status: 'pending_payment',
          notes: 'মোবাইল চেকআউট মাধ্যমে অর্ডার তৈরি করা হয়েছে।'
        });

      // Local receipt cache
      const orderReceiptData = JSON.stringify({
        orderId: transactionId,
        dbOrderId: dbOrderId,
        name: name.trim(),
        phone: phone.trim(),
        address: fullAddressString,
        city: city,
        paymentMethod: paymentMethod,
        total: total,
        shippingCost: shippingCost,
        subtotal: subtotal,
        appliedDiscount: appliedDiscount,
        notes: notes.trim(),
        items: cartItems.map(i => ({
          id: i.product.id,
          title: i.product.title,
          priceNum: i.product.priceNum,
          quantity: i.quantity,
          weight: i.product.weight,
          img: i.product.img
        })),
        date: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
      });

      localStorage.setItem(`sh_order_${transactionId}`, orderReceiptData);
      localStorage.setItem(`sh_order_${dbOrderId}`, orderReceiptData);
      localStorage.setItem('sh_latest_order', orderReceiptData);

      clearCart();
      navigate(`/order-success/${transactionId}`);

    } catch (err: any) {
      isSubmittingRef.current = false;
      console.error(err);
      alert(`অর্ডার সম্পন্ন করতে সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions: Array<{ 
    value: PaymentMethod; 
    title: string; 
    subtitle: string;
    icon: string;
  }> = [
    {
      value: 'cod',
      title: 'ক্যাশ অন ডেলিভারি (Cash on Delivery)',
      subtitle: 'পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ করুন',
      icon: '💵'
    },
    {
      value: 'bkash',
      title: 'bKash (বিকাশ)',
      subtitle: 'বিকাশ মোবাইল ব্যাংকিং পেমেন্ট',
      icon: '💖'
    },
    {
      value: 'nagad',
      title: 'Nagad (নগদ)',
      subtitle: 'নগদ মোবাইল ব্যাংকিং পেমেন্ট',
      icon: '🟠'
    },
    {
      value: 'rocket',
      title: 'Rocket (রকেট)',
      subtitle: 'রকেট মোবাইল ব্যাংকিং পেমেন্ট',
      icon: '💜'
    },
    {
      value: 'bank_transfer',
      title: 'Bank Transfer (ব্যাংক ট্রান্সফার)',
      subtitle: 'ব্যাংক অ্যাকাউন্টে সরাসরি জমা',
      icon: '🏦'
    }
  ];

  return (
    <div className="sh-checkout-page">
      <Helmet>
        <title>চেকআউট - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাট চেকআউট পৃষ্ঠা। আপনার পছন্দের পণ্য অর্ডার করুন নিরাপদ উপায়ে।" />
      </Helmet>

      <style>{`
        .sh-checkout-page {
          background-color: #F8FAF7;
          min-height: 100vh;
          padding-bottom: 40px;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          color: #1F2937;
        }

        /* Top Header Bar */
        .sh-checkout-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          background: #FFFFFF;
          border-bottom: 1px solid #E5E7EB;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }
        .sh-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F1F5F9;
          border: none;
          color: #1F2937;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sh-back-btn:hover {
          background: #E2E8F0;
        }
        .sh-nav-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #144A26;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sh-checkout-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Trust Banner */
        .sh-trust-strip {
          background: linear-gradient(135deg, #144A26, #072211);
          color: #FFFFFF;
          border-radius: 16px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          font-size: 0.82rem;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(20, 74, 38, 0.15);
        }
        .sh-trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Accordion Cards */
        .sh-accordion-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          transition: all 0.25s ease;
        }
        .sh-accordion-card.active {
          border-color: #2E7D32;
          box-shadow: 0 6px 20px rgba(46, 125, 50, 0.08);
        }

        .sh-accordion-header {
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          background: #FFFFFF;
          user-select: none;
        }
        .sh-accordion-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sh-step-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #F0FDF4;
          color: #2E7D32;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: bold;
          flex-shrink: 0;
        }
        .sh-accordion-card.active .sh-step-icon {
          background: #2E7D32;
          color: #FFFFFF;
        }
        .sh-step-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #1F2937;
        }
        .sh-step-subtitle {
          font-size: 0.82rem;
          color: #6B7280;
          margin-top: 2px;
        }

        .sh-accordion-body {
          padding: 0 18px 20px 18px;
          border-top: 1px solid #F3F4F6;
          animation: shAccordionExpand 0.25s ease-out forwards;
        }
        @keyframes shAccordionExpand {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Input Form Elements */
        .sh-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 14px;
        }
        .sh-form-label {
          font-size: 0.88rem;
          font-weight: 700;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sh-form-input, .sh-form-select, .sh-form-textarea {
          width: 100%;
          padding: 13px 14px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          font-size: 0.95rem;
          color: #1F2937;
          background: #FFFFFF;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit;
        }
        .sh-form-input:focus, .sh-form-select:focus, .sh-form-textarea:focus {
          border-color: #2E7D32;
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
        }
        .sh-form-input.error, .sh-form-select.error, .sh-form-textarea.error {
          border-color: #EF4444;
          background: #FEF2F2;
        }
        .sh-error-msg {
          font-size: 0.8rem;
          color: #EF4444;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Saved Address Cards */
        .sh-saved-addrs-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 12px;
        }
        .sh-saved-addr-card {
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          padding: 14px;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .sh-saved-addr-card.selected {
          border-color: #2E7D32;
          background: #F0FDF4;
        }
        .sh-saved-addr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.92rem;
          color: #144A26;
          margin-bottom: 4px;
        }

        /* Payment Selectable Cards */
        .sh-payment-cards-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
        }
        .sh-payment-card {
          border: 2px solid #E5E7EB;
          border-radius: 14px;
          padding: 14px 16px;
          background: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sh-payment-card:hover {
          border-color: #A7F3D0;
          transform: translateY(-1px);
        }
        .sh-payment-card.selected {
          border-color: #2E7D32;
          background: #F0FDF4;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.1);
        }
        .sh-payment-card-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sh-payment-icon {
          font-size: 1.5rem;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #F8FAF7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sh-payment-card.selected .sh-payment-icon {
          background: #FFFFFF;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        .sh-payment-title {
          font-size: 0.98rem;
          font-weight: 700;
          color: #1F2937;
        }
        .sh-payment-subtitle {
          font-size: 0.8rem;
          color: #6B7280;
          margin-top: 2px;
        }
        .sh-check-indicator {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #D1D5DB;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .sh-payment-card.selected .sh-check-indicator {
          border-color: #2E7D32;
          background: #2E7D32;
          color: #FFFFFF;
        }

        /* Order Summary Items */
        .sh-summary-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
        }
        .sh-summary-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px dashed #E5E7EB;
        }
        .sh-item-img {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #E5E7EB;
          flex-shrink: 0;
        }
        .sh-item-details {
          flex-grow: 1;
        }
        .sh-item-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #1F2937;
          line-height: 1.3;
        }
        .sh-item-weight {
          font-size: 0.78rem;
          color: #6B7280;
        }
        .sh-qty-stepper {
          display: inline-flex;
          align-items: center;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 4px;
        }
        .sh-qty-btn {
          border: none;
          background: #F3F4F6;
          color: #1F2937;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: bold;
        }
        .sh-qty-num {
          padding: 0 8px;
          font-size: 0.85rem;
          font-weight: bold;
        }

        /* Price Breakdown Table */
        .sh-price-breakdown {
          background: #F9FAFB;
          border-radius: 12px;
          padding: 14px;
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.9rem;
        }
        .sh-breakdown-row {
          display: flex;
          justify-content: space-between;
          color: #4B5563;
        }
        .sh-breakdown-row.total {
          border-top: 1px solid #E5E7EB;
          padding-top: 8px;
          margin-top: 4px;
          font-size: 1.1rem;
          font-weight: 800;
          color: #144A26;
        }

        /* Sticky Bottom Checkout Bar */
        .sh-sticky-checkout-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-top: 1px solid #E5E7EB;
          padding: 12px 16px;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
          display: flex;
          justify-content: center;
        }
        .sh-submit-btn {
          width: 100%;
          max-width: 680px;
          height: 56px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #2E7D32, #15803D);
          color: #FFFFFF;
          font-size: 1.1rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(46, 125, 50, 0.35);
          transition: all 0.2s ease;
          user-select: none;
        }
        .sh-btn-total-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 1.15rem;
          font-weight: 900;
        }
        .sh-btn-divider {
          opacity: 0.5;
          font-weight: 300;
        }
        .sh-submit-btn:active {
          transform: scale(0.98);
        }
        .sh-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background: #9CA3AF;
          box-shadow: none;
        }

        .sh-btn-secondary {
          background: #F3F4F6;
          color: #1F2937;
          border: none;
          padding: 12px 18px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          margin-top: 14px;
        }
      `}</style>

      {/* Top Header */}
      <header className="sh-checkout-nav">
        <button onClick={() => navigate(-1)} className="sh-back-btn">
          <ArrowLeft size={16} /> ফিরে যান
        </button>
        <div className="sh-nav-title">
          <ShoppingBag size={20} /> চেকআউট
        </div>
        <div style={{ width: '70px' }} /> {/* Spacer */}
      </header>

      <div className="sh-checkout-container">
        
        {/* Trust Badges */}
        <div className="sh-trust-strip">
          <div className="sh-trust-item"><ShieldCheck size={16} color="#A7F3D0" /> ১০০% নিরাপদ</div>
          <div className="sh-trust-item"><Truck size={16} color="#A7F3D0" /> দ্রুত ডেলিভারি</div>
          <div className="sh-trust-item"><Package size={16} color="#A7F3D0" /> তাজা পণ্য</div>
        </div>

        {/* SECTION 1: DELIVERY INFORMATION */}
        <div className={`sh-accordion-card ${activeSection === 'delivery' ? 'active' : ''}`}>
          <div className="sh-accordion-header" onClick={() => setActiveSection(activeSection === 'delivery' ? 'payment' : 'delivery')}>
            <div className="sh-accordion-header-left">
              <div className="sh-step-icon">
                {activeSection !== 'delivery' && name && phone && address ? <CheckCircle2 size={22} color="#16A34A" /> : '১'}
              </div>
              <div>
                <div className="sh-step-title">📍 ১. ডেলিভারি তথ্য</div>
                <div className="sh-step-subtitle">
                  {name && phone ? `${name} • ${phone}` : 'আপনার নাম, ঠিকানা ও মোবাইল নম্বর'}
                </div>
              </div>
            </div>
            {activeSection === 'delivery' ? <ChevronUp size={20} color="#2E7D32" /> : <ChevronDown size={20} color="#6B7280" />}
          </div>

          {activeSection === 'delivery' && (
            <div className="sh-accordion-body">
              {/* Saved Address Selector */}
              {savedAddresses.length > 0 && !isAddingNewAddress && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#6B7280', marginBottom: '8px' }}>
                    সংরক্ষিত ঠিকানা থেকে বেছে নিন:
                  </div>
                  <div className="sh-saved-addrs-row">
                    {savedAddresses.map(addr => (
                      <div
                        key={addr.id}
                        className={`sh-saved-addr-card ${selectedAddrId === addr.id ? 'selected' : ''}`}
                        onClick={() => handleAddressSelect(addr.id)}
                      >
                        <div className="sh-saved-addr-header">
                          <span>📍 {addr.title || 'সংরক্ষিত ঠিকানা'}</span>
                          {selectedAddrId === addr.id && <Check size={16} color="#2E7D32" />}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#374151' }}>{name || 'গ্রাহক'} • {phone || addr.phone}</div>
                        <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '2px' }}>{addr.address_line}, {addr.district}</div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button"
                    className="sh-btn-secondary"
                    onClick={() => handleAddressSelect('new')}
                    style={{ marginTop: '10px' }}
                  >
                    + নতুন ঠিকানা ব্যবহার করুন
                  </button>
                </div>
              )}

              {/* Delivery Input Form */}
              {(isAddingNewAddress || savedAddresses.length === 0) && (
                <form onSubmit={(e) => { e.preventDefault(); handleContinueToPayment(); }}>
                  <div className="sh-form-group">
                    <label className="sh-form-label">👤 আপনার নাম *</label>
                    <input 
                      type="text" 
                      placeholder="যেমন: মেহেদী হাসান" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`sh-form-input ${errors.name ? 'error' : ''}`}
                    />
                    {errors.name && <div className="sh-error-msg"><AlertCircle size={14} /> {errors.name}</div>}
                  </div>

                  <div className="sh-form-group">
                    <label className="sh-form-label">📱 মোবাইল নম্বর (১১ ডিজিট) *</label>
                    <input 
                      type="tel" 
                      inputMode="numeric"
                      placeholder="018XXXXXXXX" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`sh-form-input ${errors.phone ? 'error' : ''}`}
                    />
                    {errors.phone && <div className="sh-error-msg"><AlertCircle size={14} /> {errors.phone}</div>}
                  </div>

                  <div className="sh-form-group">
                    <label className="sh-form-label">📍 জেলা / এলাকা *</label>
                    <select 
                      value={city} 
                      onChange={(e) => setCity(e.target.value as any)}
                      className="sh-form-select"
                    >
                      <option value="satkhira">সাতক্ষীরা / শ্যামনগর এলাকা (ডেলিভারি: ৳৬০)</option>
                      <option value="dhaka">ঢাকা শহর (ডেলিভারি: ৳৬০)</option>
                      <option value="other">অন্যান্য জেলা (ডেলিভারি: ৳১২০)</option>
                    </select>
                  </div>

                  <div className="sh-form-group">
                    <label className="sh-form-label">📍 উপজেলা / থানা (ঐচ্ছিক)</label>
                    <input 
                      type="text" 
                      placeholder="যেমন: শ্যামনগর" 
                      value={thana}
                      onChange={(e) => setThana(e.target.value)}
                      className="sh-form-input"
                    />
                  </div>

                  <div className="sh-form-group">
                    <label className="sh-form-label">🏠 পূর্ণাঙ্গ ঠিকানা *</label>
                    <textarea 
                      rows={2}
                      placeholder="গ্রাম/রোড নম্বর, বাসা নম্বর, বাজারের নাম..." 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`sh-form-textarea ${errors.address ? 'error' : ''}`}
                    />
                    {errors.address && <div className="sh-error-msg"><AlertCircle size={14} /> {errors.address}</div>}
                  </div>

                  <div className="sh-form-group">
                    <label className="sh-form-label">📝 অর্ডার নোট (ঐচ্ছিক)</label>
                    <input 
                      type="text"
                      placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন..." 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="sh-form-input"
                    />
                  </div>
                </form>
              )}

              <button 
                type="button" 
                className="sh-submit-btn" 
                style={{ width: '100%', marginTop: '16px' }}
                onClick={handleContinueToPayment}
              >
                পরবর্তী: পেমেন্ট পদ্ধতি →
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: PAYMENT METHOD */}
        <div className={`sh-accordion-card ${activeSection === 'payment' ? 'active' : ''}`}>
          <div className="sh-accordion-header" onClick={() => setActiveSection(activeSection === 'payment' ? 'summary' : 'payment')}>
            <div className="sh-accordion-header-left">
              <div className="sh-step-icon">
                {activeSection !== 'payment' && paymentMethod ? <CheckCircle2 size={22} color="#16A34A" /> : '২'}
              </div>
              <div>
                <div className="sh-step-title">💳 ২. পেমেন্ট পদ্ধতি</div>
                <div className="sh-step-subtitle">
                  {paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি (COD)' : paymentMethod.toUpperCase()}
                </div>
              </div>
            </div>
            {activeSection === 'payment' ? <ChevronUp size={20} color="#2E7D32" /> : <ChevronDown size={20} color="#6B7280" />}
          </div>

          {activeSection === 'payment' && (
            <div className="sh-accordion-body">
              <div className="sh-payment-cards-grid">
                {paymentOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`sh-payment-card ${paymentMethod === opt.value ? 'selected' : ''}`}
                    onClick={() => handlePaymentSelect(opt.value)}
                  >
                    <div className="sh-payment-card-left">
                      <div className="sh-payment-icon">{opt.icon}</div>
                      <div>
                        <div className="sh-payment-title">{opt.title}</div>
                        <div className="sh-payment-subtitle">{opt.subtitle}</div>
                      </div>
                    </div>
                    <div className="sh-check-indicator">
                      {paymentMethod === opt.value && <Check size={14} color="#FFFFFF" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Conditional Fields */}
              {paymentMethod === 'cod' ? (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px 14px', marginTop: '14px', fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> <span>✓ কোনো অতিরিক্ত তথ্য প্রয়োজন নেই। পণ্য হাতে পাওয়ার পর মূল্য পরিশোধ করবেন।</span>
                </div>
              ) : (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px', marginTop: '14px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#92400E', marginBottom: '8px' }}>
                    📲 পেমেন্ট সংক্রান্ত তথ্য:
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#78350F', marginBottom: '10px' }}>
                    আমাদের নম্বর <strong>01873-520181</strong> (Send Money / Cash In) করে ট্রানজেকশন ID জমা দিতে পারেন।
                  </div>
                  <div className="sh-form-group" style={{ marginTop: '8px' }}>
                    <label className="sh-form-label">Transaction ID (ঐচ্ছিক)</label>
                    <input 
                      type="text" 
                      placeholder="যেমন: 9J8X7Y6Z" 
                      value={transactionIdInput}
                      onChange={(e) => setTransactionIdInput(e.target.value)}
                      className="sh-form-input"
                    />
                  </div>
                </div>
              )}

              <button 
                type="button" 
                className="sh-submit-btn" 
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => setActiveSection('summary')}
              >
                পরবর্তী: অর্ডার সারসংক্ষেপ →
              </button>
            </div>
          )}
        </div>

        {/* SECTION 3: ORDER SUMMARY */}
        <div className={`sh-accordion-card ${activeSection === 'summary' ? 'active' : ''}`}>
          <div className="sh-accordion-header" onClick={() => setActiveSection(activeSection === 'summary' ? 'delivery' : 'summary')}>
            <div className="sh-accordion-header-left">
              <div className="sh-step-icon">
                <ShoppingBag size={20} />
              </div>
              <div>
                <div className="sh-step-title">🛍️ ৩. অর্ডার সারসংক্ষেপ</div>
                <div className="sh-step-subtitle">
                  {cartItems.length}টি পণ্য • সর্বমোট: ৳{total}
                </div>
              </div>
            </div>
            {activeSection === 'summary' ? <ChevronUp size={20} color="#2E7D32" /> : <ChevronDown size={20} color="#6B7280" />}
          </div>

          {activeSection === 'summary' && (
            <div className="sh-accordion-body">
              {/* Product List */}
              <div className="sh-summary-items-list">
                {cartItems.map(item => (
                  <div key={item.product.id} className="sh-summary-item">
                    <img src={getImageUrl(item.product.img)} alt={item.product.title} className="sh-item-img" />
                    <div className="sh-item-details">
                      <div className="sh-item-title">{item.product.title}</div>
                      <div className="sh-item-weight">{item.product.weight}</div>
                      <div className="sh-qty-stepper">
                        <button type="button" className="sh-qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                        <span className="sh-qty-num">{item.quantity}</span>
                        <button type="button" className="sh-qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#144A26' }}>
                      ৳{item.product.priceNum * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="কুপন কোড (যেমন: SUNDARBAN10)" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="sh-form-input"
                  style={{ textTransform: 'uppercase' }}
                />
                <button type="submit" className="sh-btn-secondary" style={{ width: 'auto', marginTop: 0, padding: '0 16px', flexShrink: 0 }}>
                  প্রয়োগ
                </button>
              </form>
              {couponError && <div className="sh-error-msg" style={{ marginTop: '6px' }}><AlertCircle size={14} /> {couponError}</div>}
              {couponSuccess && <div style={{ fontSize: '0.82rem', color: '#16A34A', fontWeight: 'bold', marginTop: '6px' }}>✓ {couponSuccess}</div>}

              {/* Price Breakdown */}
              <div className="sh-price-breakdown">
                <div className="sh-breakdown-row">
                  <span>পণ্যের উপমোট:</span>
                  <span>৳{subtotal}</span>
                </div>
                <div className="sh-breakdown-row">
                  <span>ডেলিভারি চার্জ ({city === 'satkhira' ? 'শ্যামনগর/সাতক্ষীরা' : city === 'dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'}):</span>
                  <span>৳{shippingCost}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="sh-breakdown-row" style={{ color: '#16A34A', fontWeight: 'bold' }}>
                    <span>কুপন ডিসকাউন্ট:</span>
                    <span>-৳{appliedDiscount}</span>
                  </div>
                )}
                <div className="sh-breakdown-row total">
                  <span>সর্বমোট বিল:</span>
                  <span>৳{total}</span>
                </div>
              </div>

              {/* In-Page Submit Order Button below সর্বমোট বিল */}
              <button 
                type="button"
                onClick={handleSubmitOrder}
                disabled={loading || cartItems.length === 0}
                className="sh-submit-btn"
                style={{ marginTop: '20px', width: '100%' }}
              >
                {loading ? (
                  <span>প্রসেস করা হচ্ছে...</span>
                ) : (
                  <>
                    <span className="sh-btn-total-badge">৳{total}</span>
                    <span className="sh-btn-divider">|</span>
                    <span>অর্ডার নিশ্চিত করুন</span>
                    <CheckCircle2 size={20} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
