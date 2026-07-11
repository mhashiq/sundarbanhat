import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/supabase';
import { Helmet } from 'react-helmet-async';
import { 
  User, 
  MapPin, 
  History, 
  LogOut, 
  Edit3, 
  Plus, 
  Trash2, 
  DollarSign, 
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getImageUrl } from '../services/dataService';
import type { Product } from '../services/dataService';
import { trackPurchase } from '../analytics/analytics';

export const Account: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('orders');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const navigate = useNavigate();

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Address Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('Satkhira');

  // Manual Payment Form state
  const [submittingPaymentOrderId, setSubmittingPaymentOrderId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState('bKash');
  const [payTxId, setPayTxId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payFile, setPayFile] = useState<File | null>(null);
  const [payUploading, setPayUploading] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  useEffect(() => {
    fetchCustomerDashboard();
  }, []);

  const fetchCustomerDashboard = async () => {
    setLoading(true);
    try {
      // 1. Get active session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      // 2. Fetch customer profile info
      const { data: custProfile, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (custError || !custProfile) {
        // Fallback or Admin checking redirect
        const { data: isAdminUser } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (isAdminUser) {
          navigate('/admin/dashboard', { replace: true });
          return;
        }

        // If neither, force out
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
        return;
      }

      setCustomer(custProfile);
      setFullName(custProfile.full_name);

      // 3. Fetch addresses
      const { data: addrList } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', session.user.id)
        .order('is_default', { ascending: false });
      setAddresses(addrList || []);

      // 4. Fetch orders
      const { data: ordList } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false });

      const fetchedOrders = ordList || [];
      setOrders(fetchedOrders);

      // 5. GA4 Purchase Triggering Logic for Newly Approved Orders
      triggerGA4Purchases(fetchedOrders);

    } catch (err) {
      console.error('Error loading account dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Triggers GA4 purchase event only once when admin approves the payment
  const triggerGA4Purchases = (fetchedOrders: any[]) => {
    try {
      const trackedPurchases = JSON.parse(localStorage.getItem('tracked_purchases') || '[]');
      let updatedTracked = [...trackedPurchases];
      let hasUpdates = false;

      fetchedOrders.forEach(order => {
        // Approve status indicates completed purchase tracking stage
        const isApproved = order.order_status === 'payment_approved' || order.order_status === 'processing' || order.order_status === 'packed' || order.order_status === 'shipped' || order.order_status === 'delivered';
        
        if (isApproved && !trackedPurchases.includes(order.id)) {
          // Map DB items list structure back to GA4 items list format
          const mappedItems = (order.order_items || []).map((item: any) => {
            const dbProd = item.products;
            const mappedProd: Product = {
              id: dbProd.id,
              title: dbProd.title,
              subcategory: dbProd.subcategory,
              category: dbProd.category,
              price: dbProd.price,
              priceNum: Number(dbProd.price_num),
              weight: dbProd.weight,
              location: dbProd.location,
              harvest: dbProd.harvest,
              status: dbProd.status as any,
              story: dbProd.story,
              benefits: dbProd.benefits || [],
              storage: dbProd.storage,
              img: dbProd.img
            };

            return {
              product: mappedProd,
              quantity: item.quantity
            };
          });

          // Trigger central analytics event
          trackPurchase({
            transaction_id: order.transaction_id,
            value: Number(order.total),
            currency: 'BDT',
            shipping: Number(order.shipping_cost),
            payment_type: order.payment_method === 'cod' ? 'Cash on Delivery' : 'Mobile Banking',
            items: mappedItems
          });

          updatedTracked.push(order.id);
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        localStorage.setItem('tracked_purchases', JSON.stringify(updatedTracked));
      }
    } catch (err) {
      console.error('GA4 purchase tracking failed:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!fullName.trim()) {
      setProfileError('আপনার নামটি খালি রাখা যাবে না।');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Update full_name in public.customers profile table
      const { error: dbError } = await supabase
        .from('customers')
        .update({ full_name: fullName.trim() })
        .eq('id', session.user.id);

      if (dbError) throw dbError;

      // Update password if fields are populated
      if (password) {
        if (password.length < 6) {
          setProfileError('পাসওয়ার্ডটি অবশ্যই ৬ অক্ষরের বেশি হতে হবে।');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setProfileError('পাসওয়ার্ড দুটি মেলেনি।');
          setLoading(false);
          return;
        }

        const { error: passError } = await supabase.auth.updateUser({
          password: password
        });

        if (passError) throw passError;
        setPassword('');
        setConfirmPassword('');
      }

      setProfileSuccess('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
      fetchCustomerDashboard();
    } catch (err: any) {
      setProfileError(`আপডেট ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim() || !city.trim()) {
      alert('সব তথ্য প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // If address book is empty, set this new address as default automatically
      const isDefault = addresses.length === 0;

      const { error } = await supabase
        .from('addresses')
        .insert({
          customer_id: session.user.id,
          address_line: addressLine.trim(),
          city: city.trim(),
          district: district,
          is_default: isDefault
        });

      if (error) throw error;

      setAddressLine('');
      setCity('');
      setShowAddressForm(false);
      fetchCustomerDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!window.confirm('আপনি কি এই ঠিকানাটি মুছে ফেলতে চান?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', addrId);
      if (error) throw error;
      fetchCustomerDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');

    if (!payTxId.trim() || !payAmount) {
      setPayError('ট্রানজেকশন আইডি এবং পরিশোধিত টাকার পরিমাণ উল্লেখ করুন।');
      return;
    }

    if (!submittingPaymentOrderId) return;

    setPayUploading(true);

    try {
      let fileUrl = '';

      // Upload screenshot to storage if selected
      if (payFile) {
        const fileExt = payFile.name.split('.').pop();
        const fileName = `${submittingPaymentOrderId}-${Date.now()}.${fileExt}`;
        const filePath = `payments/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, payFile);

        if (uploadErr) throw uploadErr;
        fileUrl = `storage/payment-proofs/${filePath}`;
      }

      // 1. Insert transaction info into public.payments table
      const { error: paymentErr } = await supabase
        .from('payments')
        .insert({
          order_id: submittingPaymentOrderId,
          payment_method: payMethod,
          transaction_id: payTxId.trim(),
          amount: payAmount,
          screenshot_url: fileUrl || null,
          status: 'pending'
        });

      if (paymentErr) throw paymentErr;

      // 2. Update order status to payment_submitted
      const { error: orderStatusErr } = await supabase
        .from('orders')
        .update({ order_status: 'payment_submitted' })
        .eq('id', submittingPaymentOrderId);

      if (orderStatusErr) throw orderStatusErr;

      // 3. Log status history tracking entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: submittingPaymentOrderId,
          status: 'payment_submitted',
          notes: `পেমেন্ট দাখিল করা হয়েছে। মেথড: ${payMethod}, ট্রানজেকশন ID: ${payTxId}`
        });

      // 4. Push custom event to GTM Data Layer
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'payment_submitted',
          payment: {
            order_id: submittingPaymentOrderId,
            method: payMethod,
            transaction_id: payTxId.trim(),
            amount: payAmount
          }
        });
      }

      setPaySuccess('আপনার পেমেন্টের তথ্য সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন প্যানেল এটি দ্রুত যাচাই করবে।');
      setPayTxId('');
      setPayAmount(0);
      setPayFile(null);
      
      setTimeout(() => {
        setSubmittingPaymentOrderId(null);
        fetchCustomerDashboard();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setPayError(`পেমেন্ট দাখিল ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setPayUploading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('আপনি কি লগআউট করতে চান?')) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  // Stepper helper to show order lifecycle statuses in Bengali
  const getStatusStepperHtml = (status: string) => {
    const statuses = [
      { code: 'pending_payment', label: 'পেমেন্ট পেন্ডিং', desc: 'অর্ডারটি পেমেন্ট দাখিলের অপেক্ষায় রয়েছে।' },
      { code: 'payment_submitted', label: 'পেমেন্ট সাবমিট', desc: 'পেমেন্টের তথ্য জমা দেওয়া হয়েছে।' },
      { code: 'payment_verification', label: 'পেমেন্ট ভেরিফিকেশন', desc: 'অ্যাডমিন পেমেন্ট যাচাই করছেন।' },
      { code: 'payment_approved', label: 'পেমেন্ট অ্যাপ্রুভ', desc: 'পেমেন্ট নিশ্চিত করা হয়েছে!' },
      { code: 'processing', label: 'প্রসেসিং', desc: 'আপনার পার্সেল প্রস্তুত করা হচ্ছে।' },
      { code: 'packed', label: 'প্যাকড', desc: 'পণ্য প্যাকেটজাত করা সম্পন্ন হয়েছে।' },
      { code: 'shipped', label: 'শিপড', desc: 'পার্সেলটি কুরিয়ারে বুকিং করা হয়েছে।' },
      { code: 'delivered', label: 'ডেলিভার্ড', desc: 'আপনি পণ্যটি হাতে পেয়েছেন।' }
    ];

    if (status === 'cancelled') {
      return (
        <div style={{ backgroundColor: '#ffebee', padding: '15px', borderRadius: '8px', border: '1px solid #ffcdd2', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertCircle color="#c62828" size={20} />
          <div>
            <strong style={{ color: '#c62828', display: 'block' }}>অর্ডার বাতিল (Cancelled)</strong>
            <span style={{ fontSize: '0.85rem', color: '#555' }}>এই অর্ডারটি কোনো কারণে বাতিল করা হয়েছে। অনুসন্ধানের জন্য কল করুন।</span>
          </div>
        </div>
      );
    }

    const currentIndex = statuses.findIndex(s => s.code === status);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
        
        {/* Status text */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--color-sand)', padding: '12px 15px', borderRadius: '6px' }}>
          <CheckCircle color="var(--color-mangrove)" size={18} />
          <span style={{ fontSize: '0.92rem', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>
            বর্তমান অবস্থা: {statuses[currentIndex]?.label || 'পেন্ডিং'}
          </span>
        </div>

        {/* Stepper bubbles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '10px 0', overflowX: 'auto', gap: '15px' }}>
          {statuses.map((s, idx) => {
            const isCompleted = idx <= currentIndex;
            const isActive = idx === currentIndex;
            
            return (
              <div key={s.code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', textAlign: 'center', opacity: isCompleted ? 1 : 0.45 }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isActive ? 'var(--color-honey-glow)' : (isCompleted ? 'var(--color-mangrove)' : '#ccc'),
                  color: isActive ? 'var(--color-forest-dark)' : '#fff',
                  border: isActive ? '2px solid var(--color-mangrove)' : 'none'
                }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: isCompleted ? 'bold' : 'normal', color: 'var(--color-forest-dark)' }}>{s.label}</span>
              </div>
            );
          })}
        </div>

      </div>
    );
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '90vh', padding: '0px' }}>
      <Helmet>
        <title>আমার অ্যাকাউন্ট - সুন্দরবন হাট</title>
      </Helmet>

      {/* Grid Dashboard Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '90vh' }}>
        
        {/* Sidebar Nav */}
        <div style={{
          backgroundColor: 'var(--color-forest-dark)',
          color: '#fff',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '5px double var(--color-mud)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '15px' }}>
              <span style={{ fontSize: '1.8rem' }}>🍃</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-honey)' }}>আমার অ্যাকাউন্ট</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Order history */}
              <button 
                onClick={() => setActiveTab('orders')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'orders' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'orders' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'orders' ? 'bold' : 'normal'
                }}
              >
                <History size={18} /> অর্ডার ইতিহাস
              </button>

              {/* Saved addresses */}
              <button 
                onClick={() => setActiveTab('addresses')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'addresses' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'addresses' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'addresses' ? 'bold' : 'normal'
                }}
              >
                <MapPin size={18} /> ঠিকানা বই
              </button>

              {/* Profile Details */}
              <button 
                onClick={() => setActiveTab('profile')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'profile' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'profile' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'profile' ? 'bold' : 'normal'
                }}
              >
                <User size={18} /> প্রোফাইল তথ্য
              </button>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
              backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff6666'
            }}
          >
            <LogOut size={18} /> লগআউট
          </button>
        </div>

        {/* Dynamic Display Area */}
        <div style={{ padding: '40px', overflowY: 'auto', maxHeight: '90vh' }}>
          {loading && (
            <div style={{ color: 'var(--color-mangrove)', fontWeight: 'bold', marginBottom: '20px', padding: '10px 15px', backgroundColor: 'var(--color-sand-dark)', borderRadius: '4px', border: '1px dashed var(--color-mangrove)', fontSize: '0.9rem' }}>
              ⏳ লোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন
            </div>
          )}
          
          {/* TAB 1: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>🧾 আমার অর্ডার সমূহ</h2>

              {/* Manual Payment Verification Modal */}
              {submittingPaymentOrderId && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(7, 34, 17, 0.6)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px'
                }}>
                  <div style={{
                    background: '#fff', borderRadius: 'var(--border-radius-lg)', border: '3px solid var(--color-mud)',
                    width: '100%', maxWidth: '520px', padding: '30px', position: 'relative'
                  }}>
                    <button 
                      onClick={() => setSubmittingPaymentOrderId(null)}
                      style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                    >✕</button>

                    <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.25rem', marginBottom: '15px', marginTop: 0 }}>
                      💳 পেমেন্ট সম্পন্ন নিশ্চিতকরণ ফরম
                    </h3>
                    
                    {paySuccess && (
                      <div style={{ display: 'flex', gap: '8px', backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', padding: '10px 12px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '15px' }}>
                        <CheckCircle size={18} /> <span>{paySuccess}</span>
                      </div>
                    )}

                    {payError && (
                      <div style={{ display: 'flex', gap: '8px', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', padding: '10px 12px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '15px' }}>
                        <AlertCircle size={18} /> <span>{payError}</span>
                      </div>
                    )}

                    <form onSubmit={handleManualPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {/* Payment Method */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পেমেন্ট মাধ্যম *</label>
                        <select 
                          value={payMethod} 
                          onChange={(e) => setPayMethod(e.target.value)}
                          style={{ width: '100%', padding: '10px', border: '1.5px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                        >
                          <option value="bKash">bKash (বিকাশ)</option>
                          <option value="Nagad">Nagad (নগদ)</option>
                          <option value="Rocket">Rocket (রকেট)</option>
                          <option value="Bank">Bank Transfer (ব্যাংক ট্রান্সফার)</option>
                        </select>
                      </div>

                      {/* Transaction ID */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>ট্রানজেকশন আইডি (TrxID) *</label>
                        <input 
                          type="text" 
                          value={payTxId}
                          onChange={(e) => setPayTxId(e.target.value)}
                          placeholder="যেমন: BK8735201"
                          style={{ width: '100%', padding: '10px', border: '1.5px solid var(--color-border)', borderRadius: '4px' }}
                        />
                      </div>

                      {/* Payment Amount */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পরিশোধিত টাকার পরিমাণ (৳) *</label>
                        <input 
                          type="number" 
                          value={payAmount || ''}
                          onChange={(e) => setPayAmount(Number(e.target.value))}
                          placeholder="যেমন: ১৭৬০"
                          style={{ width: '100%', padding: '10px', border: '1.5px solid var(--color-border)', borderRadius: '4px' }}
                        />
                      </div>

                      {/* Screenshot upload */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setPayFile(e.target.files?.[0] || null)}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={payUploading}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontWeight: 'bold', marginTop: '10px' }}
                      >
                        <Upload size={18} /> {payUploading ? 'জমা হচ্ছে...' : 'পেমেন্ট ইনফো সাবমিট করুন'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Order logs card list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {orders.length === 0 ? (
                  <div style={{ background: '#fff', padding: '40px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', color: 'gray', border: '1px solid var(--color-border)' }}>
                    আপনি এখনও কোনো অর্ডার করেননি। পণ্য কিনতে আমাদের <Link to="/products" style={{ color: 'var(--color-mangrove)', fontWeight: 'bold', textDecoration: 'underline' }}>শপে যান</Link>।
                  </div>
                ) : (
                  orders.map(order => (
                    <div 
                      key={order.id} 
                      style={{ 
                        background: '#fff', 
                        borderRadius: 'var(--border-radius-lg)', 
                        border: '1.5px solid var(--color-border)', 
                        boxShadow: '0 6px 15px var(--color-shadow)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Order main bar */}
                      <div style={{ 
                        backgroundColor: 'var(--color-sand)', 
                        padding: '15px 25px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderBottom: '1px solid var(--color-border)',
                        flexWrap: 'wrap',
                        gap: '15px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: 'gray', display: 'block' }}>অর্ডার তারিখ:</span>
                          <strong style={{ fontSize: '0.9rem' }}>{new Date(order.created_at).toLocaleDateString('bn-BD')}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: 'gray', display: 'block' }}>অর্ডার নম্বর:</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--color-forest-dark)' }}>#{order.transaction_id}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: 'gray', display: 'block' }}>মোট মূল্য:</span>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-mangrove)' }}>৳{order.total}</strong>
                        </div>
                        <div>
                          {order.order_status === 'pending_payment' && (
                            <button 
                              onClick={() => {
                                setSubmittingPaymentOrderId(order.id);
                                setPayAmount(Number(order.total));
                              }}
                              className="btn btn-primary" 
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', fontSize: '0.85rem' }}
                            >
                              <DollarSign size={15} /> পেমেন্ট করুন
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Details & Roadmap stepper */}
                      <div style={{ padding: '25px' }}>
                        
                        {/* Order Status Stepper */}
                        {getStatusStepperHtml(order.order_status)}

                        {/* Items list detail preview */}
                        <div style={{ marginTop: '25px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                          <h4 style={{ fontSize: '0.95rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '15px' }}>📦 পণ্যের তালিকা:</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {(order.order_items || []).map((item: any) => (
                              <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid var(--color-sand)', paddingBottom: '10px' }}>
                                <img src={getImageUrl(item.products?.img)} alt="" style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: 'var(--color-sand)', borderRadius: '4px' }} />
                                <div style={{ flexGrow: 1 }}>
                                  <strong style={{ fontSize: '0.92rem', color: 'var(--color-forest-dark)', display: 'block' }}>{item.products?.title}</strong>
                                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>ওজন: {item.products?.weight} | পরিমাণ: {item.quantity}টি</span>
                                </div>
                                <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>৳{item.price_num * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESS BOOK */}
          {activeTab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', fontWeight: '800', margin: 0 }}>📍 ঠিকানা বই</h2>
                {!showAddressForm && (
                  <button onClick={() => setShowAddressForm(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
                    <Plus size={16} /> নতুন ঠিকানা যোগ করুন
                  </button>
                )}
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1.5px solid var(--color-mud)', boxShadow: '0 4px 15px var(--color-shadow)', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', marginBottom: '15px', marginTop: 0 }}>➕ নতুন শিপিং ঠিকানা</h3>
                  
                  <form onSubmit={handleAddAddress} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পূর্ণ ঠিকানা (গ্রাম/রোড, পোস্ট অফিস, থানা) *</label>
                      <input 
                        type="text" 
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="যেমন: উপজেলা মোড়, শ্যামনগর"
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>শহর/উপজেলা *</label>
                      <input 
                        type="text" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="যেমন: শ্যামনগর"
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>জেলা *</label>
                      <select 
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                      >
                        <option value="Satkhira">সাতক্ষীরা (Satkhira)</option>
                        <option value="Dhaka">ঢাকা (Dhaka)</option>
                        <option value="Other">অন্যান্য জেলা (Other District)</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="button" onClick={() => setShowAddressForm(false)} className="btn btn-outline" style={{ padding: '8px 15px' }}>বাতিল</button>
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>ঠিকানা সংরক্ষণ করুন</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Address list */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {addresses.length === 0 ? (
                  <div style={{ gridColumn: 'span 3', background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-md)', textAlign: 'center', color: 'gray', border: '1px solid var(--color-border)' }}>
                    কোনো সংরক্ষিত ঠিকানা পাওয়া যায়নি।
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div 
                      key={addr.id} 
                      style={{ 
                        background: '#fff', 
                        padding: '25px', 
                        borderRadius: 'var(--border-radius-lg)', 
                        border: addr.is_default ? '2px solid var(--color-mangrove)' : '1px solid var(--color-border)', 
                        boxShadow: '0 4px 15px var(--color-shadow)',
                        position: 'relative'
                      }}
                    >
                      {addr.is_default && (
                        <span style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'var(--color-sand-dark)', color: 'var(--color-mangrove)', fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                          ডিফল্ট ঠিকানা
                        </span>
                      )}
                      
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '10px' }}>
                        <MapPin size={18} style={{ color: 'var(--color-mangrove)', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.92rem' }}>
                          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-forest-dark)', marginBottom: '5px' }}>{addr.address_line}</p>
                          <p style={{ margin: 0, color: 'gray' }}>শহর: {addr.city} | জেলা: {addr.district === 'Satkhira' ? 'সাতক্ষীরা' : addr.district === 'Dhaka' ? 'ঢাকা' : 'অন্যান্য'}</p>
                        </div>
                      </div>

                      <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleDeleteAddress(addr.id)}
                          style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
                        >
                          <Trash2 size={14} /> ঠিকানা মুছুন
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE INFO */}
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>👤 প্রোফাইল তথ্য</h2>

              <div style={{ maxWidth: '520px', background: '#fff', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                
                {profileSuccess && (
                  <div style={{ display: 'flex', gap: '8px', backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', padding: '10px 12px', borderRadius: '4px', fontSize: '0.88rem', marginBottom: '20px' }}>
                    <CheckCircle size={18} /> <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div style={{ display: 'flex', gap: '8px', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', padding: '10px 12px', borderRadius: '4px', fontSize: '0.88rem', marginBottom: '20px' }}>
                    <AlertCircle size={18} /> <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>আপনার নাম *</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1.5px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)</label>
                    <input 
                      type="text" 
                      value={customer?.phone || ''}
                      disabled
                      style={{ width: '100%', padding: '10px', border: '1.5px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#f5f5f5', color: 'gray' }}
                    />
                  </div>

                  <h3 style={{ fontSize: '1rem', color: 'var(--color-mud)', borderTop: '1px dashed var(--color-border)', paddingTop: '20px', marginTop: '10px', marginBottom: '5px', fontWeight: 'bold' }}>
                    🔑 পাসওয়ার্ড পরিবর্তন করুন (ঐচ্ছিক)
                  </h3>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', marginBottom: '6px' }}>নতুন পাসওয়ার্ড</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর লিখুন..."
                      style={{ width: '100%', padding: '10px', border: '1.5px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', marginBottom: '6px' }}>পাসওয়ার্ড নিশ্চিত করুন</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="আবার লিখুন..."
                      style={{ width: '100%', padding: '10px', border: '1.5px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontWeight: 'bold', marginTop: '10px' }}
                  >
                    <Edit3 size={16} /> পরিবর্তন সংরক্ষণ করুন
                  </button>
                </form>

              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
