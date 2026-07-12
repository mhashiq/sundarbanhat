import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabase/supabase';
import { 
  trackAddShippingInfo, 
  trackAddPaymentInfo
} from '../analytics/analytics';
import { dataService, type PaymentMethod } from '../services/dataService';

export const Checkout: React.FC = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();

  // Auth & Saved Addresses state
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('satkhira'); // satkhira, dhaka, other
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.priceNum * item.quantity, 0);
  const shippingCost = city === 'other' ? 120 : 60;
  const total = subtotal + shippingCost;

  // If cart is empty, redirect back to products list
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/products');
    }
  }, [cartItems, navigate]);

  // Load customer profile and saved addresses on mount if logged in
  useEffect(() => {
    const loadCustomerData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCustomerId(session.user.id);
        
        // 1. Fetch customer details
        const { data: profile } = await supabase
          .from('customers')
          .select('full_name, phone, email')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          setName(profile.full_name);
          setPhone(profile.phone);
        }

        // 2. Fetch saved addresses
        const { data: addrs } = await supabase
          .from('addresses')
          .select('*')
          .eq('customer_id', session.user.id);

        if (addrs && addrs.length > 0) {
          setSavedAddresses(addrs);
          
          // Pre-populate with default address if exists
          const defAddr = addrs.find(a => a.is_default) || addrs[0];
          setSelectedAddrId(defAddr.id);
          setAddress(defAddr.address_line);
          setCity(defAddr.district.toLowerCase());
        }
      }
    };

    loadCustomerData();
  }, []);

  // Handle address dropdown selection changes
  const handleAddressSelect = (addrId: string) => {
    setSelectedAddrId(addrId);
    if (addrId === 'new') {
      setAddress('');
      setCity('satkhira');
    } else {
      const selected = savedAddresses.find(a => a.id === addrId);
      if (selected) {
        setAddress(selected.address_line);
        setCity(selected.district.toLowerCase());
      }
    }
  };

  const handleShippingComplete = () => {
    const shippingTier = city === 'other' ? 'Outside District Standard' : 'Local District Standard';
    trackAddShippingInfo(cartItems, shippingTier);
  };

  const handlePaymentSelect = (method: string) => {
    const selectedMethod = method as PaymentMethod;
    setPaymentMethod(selectedMethod);
    const paymentTypeMap: Record<PaymentMethod, string> = {
      cod: 'Cash on Delivery',
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      bank_transfer: 'Bank Transfer'
    };
    const paymentType = paymentTypeMap[selectedMethod] || 'Manual Payment';
    trackAddPaymentInfo(cartItems, paymentType);
  };

  const validateForm = () => {
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

  const paymentOptions: Array<{ value: PaymentMethod; title: string; description: string }> = [
    {
      value: 'cod',
      title: 'ক্যাশ অন ডেলিভারি (Cash on Delivery)',
      description: 'পণ্য হাতে পেয়ে পরিশোধ করবেন। অর্ডারটি ম্যানুয়াল রিভিউতে যাবে।'
    },
    {
      value: 'bkash',
      title: 'bKash',
      description: 'bKash দিয়ে পেমেন্ট করে পরে ট্রানজেকশন ID জমা দিন।'
    },
    {
      value: 'nagad',
      title: 'Nagad',
      description: 'Nagad দিয়ে পেমেন্ট করে পরে ট্রানজেকশন ID জমা দিন।'
    },
    {
      value: 'rocket',
      title: 'Rocket',
      description: 'Rocket দিয়ে পেমেন্ট করে পরে ট্রানজেকশন ID জমা দিন।'
    },
    {
      value: 'bank_transfer',
      title: 'Bank Transfer',
      description: 'ব্যাংক ট্রান্সফারের রসিদ/স্ক্রিনশট যুক্ত করতে পারবেন।'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const transactionId = `SH-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('অর্ডার করতে আগে লগইন করুন।');
        navigate('/login', { replace: true });
        return;
      }

      const activeCustomerId = session.user.id;
      setCustomerId(activeCustomerId);
      const resolvedCustomerId = customerId || activeCustomerId;

      const { error: customerSyncError } = await supabase
        .from('customers')
        .upsert({
          id: activeCustomerId,
          full_name: name.trim(),
          phone: phone.trim(),
          email: session.user.email || null,
          last_active_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (customerSyncError) {
        throw customerSyncError;
      }

      // 1. Prepare Order database record payload
      const orderPayload = {
        transaction_id: transactionId,
        customer_name: name.trim(),
        phone: phone.trim(),
        email: session.user.email || null,
        address: address.trim(),
        city: city === 'satkhira' ? 'Satkhira' : city === 'dhaka' ? 'Dhaka' : 'Other',
        shipping_cost: shippingCost,
        subtotal: subtotal,
        total: total,
        payment_method: paymentMethod,
        notes: notes.trim(),
        customer_id: resolvedCustomerId
      };

      // Map cart items into OrderItemInput
      const orderItems = cartItems.map(item => ({
        product: {
          id: item.product.id,
          priceNum: item.product.priceNum
        },
        quantity: item.quantity
      }));

      // 2. Write Order and OrderItems to Supabase database
      const dbOrderId = await dataService.createOrder(orderPayload, orderItems);

      if (import.meta.env.DEV) {
        const [orderVerify, itemsVerify, paymentsVerify] = await Promise.all([
          supabase.from('orders').select('id, transaction_id, customer_id, payment_method, payment_status, order_status').eq('id', dbOrderId).maybeSingle(),
          supabase.from('order_items').select('id, order_id, product_id, quantity').eq('order_id', dbOrderId),
          supabase.from('payments').select('id, order_id, status').eq('order_id', dbOrderId)
        ]);

        console.info('[Checkout][DEV] Order placement verification', {
          authUserId: session.user.id,
          dbOrderId,
          transactionId,
          order: orderVerify.data,
          orderReadError: orderVerify.error?.message,
          itemsCount: (itemsVerify.data || []).length,
          itemsReadError: itemsVerify.error?.message,
          paymentsCount: (paymentsVerify.data || []).length,
          paymentsReadError: paymentsVerify.error?.message
        });
      }

      // 3. Log status history tracking entry in database
      await supabase
        .from('order_status_history')
        .insert({
          order_id: dbOrderId,
          status: 'pending_payment',
          notes: 'অর্ডার পেন্ডিং পেমেন্ট স্ট্যাটাসে তৈরি করা হয়েছে।'
        });

      // 4. Save order receipt data locally for Success Screen loading
      localStorage.setItem(`sh_order_${transactionId}`, JSON.stringify({
        orderId: transactionId,
        dbOrderId: dbOrderId,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city,
        paymentMethod: paymentMethod,
        total: total,
        shippingCost: shippingCost,
        subtotal: subtotal,
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
      }));

      // 5. Clear shopping cart
      clearCart();

      // 6. Route to success page
      navigate(`/order-success/${transactionId}`);

    } catch (err: any) {
      console.error(err);
      alert(`অর্ডার সম্পন্ন করতে সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '85vh', paddingTop: '30px' }}>
      <Helmet>
        <title>চেকআউট - সুন্দরবন হাট</title>
        <meta name="description" content="সুন্দরবন হাট চেকআউট পৃষ্ঠা। আপনার পছন্দের পণ্য অর্ডার করুন নিরাপদ উপায়ে।" />
      </Helmet>

      <div className="container" style={{ maxWidth: '1000px' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--color-forest-dark)', marginBottom: '30px', textAlign: 'center', fontWeight: '800' }}>
          🛒 আপনার অর্ডার সম্পন্ন করুন
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
          
          {/* Checkout billing fields */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-mangrove)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '20px' }}>
                📋 ডেলিভারি ও যোগাযোগের তথ্য
              </h3>

              {/* Saved Address Dropdown */}
              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: '20px', backgroundColor: 'var(--color-sand)', padding: '15px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংরক্ষিত ঠিকানা নির্বাচন করুন</label>
                  <select
                    value={selectedAddrId}
                    onChange={(e) => handleAddressSelect(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontSize: '0.9rem' }}
                  >
                    {savedAddresses.map(a => (
                      <option key={a.id} value={a.id}>{a.address_line} ({a.district})</option>
                    ))}
                    <option value="new">+ নতুন ঠিকানা লিখুন</option>
                  </select>
                </div>
              )}

              {/* Name */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>আপনার নাম *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 15px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem' }} 
                  placeholder="যেমন: মোঃ আহসান কবির"
                  disabled={loading}
                />
                {errors.name && <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>⚠️ {errors.name}</span>}
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>মোবাইল নম্বর *</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 15px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem' }} 
                  placeholder="যেমন: 01873520181"
                  disabled={loading}
                />
                {errors.phone && <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>⚠️ {errors.phone}</span>}
              </div>

              {/* District Area select */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>ডেলিভারি এলাকা *</label>
                <select 
                  value={city} 
                  onChange={(e) => {
                    setCity(e.target.value);
                    const shippingTier = e.target.value === 'other' ? 'Outside District Standard' : 'Local District Standard';
                    trackAddShippingInfo(cartItems, shippingTier);
                  }}
                  onBlur={handleShippingComplete}
                  style={{ width: '100%', padding: '10px 15px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem', backgroundColor: '#fff' }}
                  disabled={loading}
                >
                  <option value="satkhira">সাতক্ষীরা জেলা (৳৬০ ডেলিভারি চার্জ)</option>
                  <option value="dhaka">ঢাকা সিটি (৳৬০ ডেলিভারি চার্জ)</option>
                  <option value="other">অন্যান্য জেলা ও এলাকা (৳১২০ ডেলিভারি চার্জ)</option>
                </select>
              </div>

              {/* Address detail */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পূর্ণ ঠিকানা *</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px 15px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem', fontFamily: 'inherit' }} 
                  placeholder="যেমন: গ্রাম/রাস্তা, থানা, জেলা..."
                  disabled={loading}
                />
                {errors.address && <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>⚠️ {errors.address}</span>}
              </div>

              {/* Order Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>অর্ডার নোট (ঐচ্ছিক)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '10px 15px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.95rem', fontFamily: 'inherit' }} 
                  placeholder="ডেলিভারির জন্য বিশেষ নির্দেশনা (যেমন: বিকাশে পেমেন্ট করব)..."
                  disabled={loading}
                />
              </div>

            </div>

            {/* Payment Modes selection */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-mangrove)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '20px' }}>
                💳 পেমেন্ট পদ্ধতি
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {paymentOptions.map(option => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '15px',
                      border: `2px solid ${paymentMethod === option.value ? 'var(--color-mangrove)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: 'pointer',
                      backgroundColor: paymentMethod === option.value ? 'var(--color-sand)' : 'transparent',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === option.value} 
                      onChange={() => handlePaymentSelect(option.value)}
                      style={{ accentColor: 'var(--color-mangrove)', width: '16px', height: '16px', marginTop: '4px' }}
                      disabled={loading}
                    />
                    <div>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-forest-dark)', fontSize: '0.98rem', display: 'block' }}>{option.title}</span>
                      <span style={{ fontSize: '0.78rem', color: 'gray' }}>{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </form>

          {/* Cart Summary Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest-dark)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '20px' }}>
                🛍️ অর্ডার বিবরণী
              </h3>

              {/* Items in summary list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '250px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
                {cartItems.map((item) => (
                  <div key={item.product.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'var(--color-sand)',
                        color: 'var(--color-mangrove)',
                        borderRadius: '50%',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {item.quantity}
                      </span>
                      <div>
                        <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--color-forest-dark)', display: 'block' }}>
                          {item.product.title}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'gray' }}>
                          {item.product.weight}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-mud)' }}>
                      ৳{item.product.priceNum * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Aggregates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'gray' }}>
                  <span>পণ্য সমূহের মূল্য</span>
                  <span>৳{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'gray' }}>
                  <span>ডেলিভারি চার্জ</span>
                  <span>৳{shippingCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '12px', fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-mangrove)' }}>
                  <span>মোট প্রদেয়</span>
                  <span>৳{total}</span>
                </div>
              </div>

              {/* Checkout Trigger */}
              <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 'var(--border-radius-md)' }}
              >
                {loading ? 'অর্ডার হচ্ছে...' : `অর্ডার নিশ্চিত করুন (৳${total})`}
              </button>

              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <Link to="/products" style={{ color: 'var(--color-mud)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                  ← শপে ফিরে যান
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
