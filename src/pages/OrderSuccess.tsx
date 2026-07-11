import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, ArrowRight, DollarSign, Upload, AlertCircle } from 'lucide-react';
import { getImageUrl } from '../services/dataService';
import { supabase } from '../supabase/supabase';

interface SavedOrder {
  orderId: string;
  dbOrderId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: string;
  total: number;
  shippingCost: number;
  subtotal: number;
  items: Array<{
    id: string;
    title: string;
    priceNum: number;
    quantity: number;
    weight: string;
    img: string;
  }>;
  date: string;
}

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<SavedOrder | null>(null);
  
  // Manual Payment Form state
  const [showPayForm, setShowPayForm] = useState(false);
  const [payMethod, setPayMethod] = useState('bKash');
  const [payTxId, setPayTxId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payFile, setPayFile] = useState<File | null>(null);
  const [payUploading, setPayUploading] = useState(false);
  const [payError, setPayError] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (orderId) {
      const saved = localStorage.getItem(`sh_order_${orderId}`);
      if (saved) {
        const orderData = JSON.parse(saved) as SavedOrder;
        setOrder(orderData);
        setPayAmount(orderData.total);
        
        // Check if payment was already submitted for this order ID in the database
        const checkExistingPayment = async () => {
          if (orderData.dbOrderId) {
            const { data } = await supabase
              .from('payments')
              .select('id')
              .eq('order_id', orderData.dbOrderId)
              .maybeSingle();
            
            if (data) {
              setAlreadySubmitted(true);
            }
          }
        };
        checkExistingPayment();
      }
    }
  }, [orderId]);

  if (!order) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-forest-dark)' }}>অর্ডার পাওয়া যায়নি</h2>
        <p style={{ margin: '15px 0 25px' }}>দুঃখিত, অনুরোধকৃত অর্ডারের কোনো তথ্য নেই।</p>
        <Link to="/products" className="btn btn-primary">পণ্য তালিকা দেখুন</Link>
      </div>
    );
  }

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    if (!payTxId.trim() || !payAmount) {
      setPayError('ট্রানজেকশন আইডি এবং পরিশোধিত টাকার পরিমাণ উল্লেখ করুন।');
      return;
    }

    setPayUploading(true);

    try {
      let fileUrl = '';

      // Upload screenshot to storage if selected
      if (payFile) {
        const fileExt = payFile.name.split('.').pop();
        const fileName = `${order.dbOrderId}-${Date.now()}.${fileExt}`;
        const filePath = `payments/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, payFile);

        if (uploadErr) throw uploadErr;
        fileUrl = `storage/payment-proofs/${filePath}`;
      }

      // 1. Insert payment record into database
      const { error: paymentErr } = await supabase
        .from('payments')
        .insert({
          order_id: order.dbOrderId,
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
        .eq('id', order.dbOrderId);

      if (orderStatusErr) throw orderStatusErr;

      // 3. Log status history tracking entry in database
      await supabase
        .from('order_status_history')
        .insert({
          order_id: order.dbOrderId,
          status: 'payment_submitted',
          notes: `সরাসরি রসিদ পাতা থেকে পেমেন্ট জমা দেওয়া হয়েছে। মেথড: ${payMethod}, TrxID: ${payTxId}`
        });

      // 4. Push custom event to GTM Data Layer
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'payment_submitted',
          payment: {
            order_id: order.dbOrderId,
            method: payMethod,
            transaction_id: payTxId.trim(),
            amount: payAmount
          }
        });
      }

      setAlreadySubmitted(true);
      setShowPayForm(false);
    } catch (err: any) {
      console.error(err);
      setPayError(`পেমেন্ট জমা দিতে সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setPayUploading(false);
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '80vh', paddingTop: '40px' }}>
      <Helmet>
        <title>ধন্যবাদ - আপনার অর্ডার সফল হয়েছে</title>
        <meta name="description" content="সুন্দরবন হাট থেকে আপনার কেনাকাটা সম্পন্ন হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ।" />
      </Helmet>

      <div className="container" style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        {/* Receipt wrapper card */}
        <div style={{
          background: '#fff',
          padding: '40px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 10px 25px var(--color-shadow)',
          marginBottom: '30px'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <CheckCircle size={64} style={{ color: 'var(--color-mangrove)', marginBottom: '15px' }} />
            <h2 style={{ color: 'var(--color-forest-dark)', fontSize: '2rem', fontWeight: '800', margin: '0 0 10px' }}>
              অর্ডারটি সফলভাবে গৃহীত হয়েছে!
            </h2>
            <p style={{ color: 'gray', fontSize: '1.02rem', margin: 0 }}>
              আপনার অর্ডারটি সফলভাবে সুন্দরবন হাটে রেজিস্টার করা হয়েছে।
            </p>
          </div>

          {/* Quick Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px 20px',
            background: 'var(--color-sand)',
            padding: '20px',
            borderRadius: 'var(--border-radius-md)',
            textAlign: 'left',
            marginBottom: '30px',
            border: '1px solid var(--color-border)'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block' }}>অর্ডার নম্বর (Order Number)</span>
              <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>#{order.orderId}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block' }}>অর্ডারের তারিখ</span>
              <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>{order.date}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block' }}>গ্রাহকের নাম</span>
              <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>{order.name}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block' }}>মোবাইল নম্বর</span>
              <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>{order.phone}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block' }}>ডেলিভারি ঠিকানা</span>
              <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>{order.address}</strong>
            </div>
          </div>

          {/* MANUAL PAYMENT INSTRUCTIONS & SUBMISSION (Only if checkout was NOT Cash on Delivery) */}
          {order.paymentMethod === 'bkash' && (
            <div style={{
              backgroundColor: '#fffcf4',
              border: '2px dashed var(--color-honey)',
              padding: '25px',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', fontWeight: 'bold', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💳 মোবাইল ব্যাংকিং পেমেন্ট নির্দেশিকা:
              </h3>
              
              <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: '1.6', margin: '0 0 15px 0' }}>
                অর্ডারটি কনফার্ম করতে অনুগ্রহ করে নিচের যেকোনো একটি পার্সোনাল নম্বরে সর্বমোট <strong style={{ color: 'var(--color-mangrove)', fontSize: '1.05rem' }}>৳{order.total}</strong> টাকা <strong>সেন্ডমানি (Send Money)</strong> করুন:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                  <span>📱 <strong>bKash (বিকাশ)</strong>:</span>
                  <strong style={{ color: 'var(--color-mangrove)' }}>০১৮৭৩ ৫২০১৮১ (Personal)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                  <span>📱 <strong>Nagad (নগদ)</strong>:</span>
                  <strong style={{ color: 'var(--color-mangrove)' }}>০১৮৭৩ ৫২০১৮১ (Personal)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                  <span>📱 <strong>Rocket (রকেট)</strong>:</span>
                  <strong style={{ color: 'var(--color-mangrove)' }}>০১৮৭৩ ৫২০১৮১-২ (Personal)</strong>
                </div>
              </div>

              {alreadySubmitted ? (
                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', padding: '12px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <CheckCircle size={18} /> <span>আপনার পেমেন্ট আইডি দাখিল করা হয়েছে। অ্যাডমিন ভেরিফিকেশনের জন্য অপেক্ষা করুন।</span>
                </div>
              ) : (
                <div>
                  {!showPayForm ? (
                    <button 
                      onClick={() => setShowPayForm(true)}
                      className="btn btn-primary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontWeight: 'bold' }}
                    >
                      <DollarSign size={18} /> আমি পেমেন্ট সম্পন্ন করেছি (Confirm Payment)
                    </button>
                  ) : (
                    <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '6px', marginTop: '10px' }}>
                      <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>পেমেন্ট প্রমাণ দাখিল করুন:</h4>
                      
                      {payError && (
                        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', padding: '8px 10px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '15px' }}>
                          <AlertCircle size={16} /> <span>{payError}</span>
                        </div>
                      )}

                      <form onSubmit={handleManualPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '4px' }}>পেমেন্ট মাধ্যম *</label>
                          <select 
                            value={payMethod} 
                            onChange={(e) => setPayMethod(e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontSize: '0.88rem' }}
                          >
                            <option value="bKash">bKash (বিকাশ)</option>
                            <option value="Nagad">Nagad (নগদ)</option>
                            <option value="Rocket">Rocket (রকেট)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '4px' }}>ট্রানজেকশন আইডি (TrxID) *</label>
                          <input 
                            type="text" 
                            value={payTxId}
                            onChange={(e) => setPayTxId(e.target.value)}
                            placeholder="যেমন: BK8735201"
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.88rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '4px' }}>পরিশোধিত টাকার পরিমাণ (৳) *</label>
                          <input 
                            type="number" 
                            value={payAmount || ''}
                            onChange={(e) => setPayAmount(Number(e.target.value))}
                            placeholder="যেমন: ১৭৬০"
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.88rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '4px' }}>পেমেন্ট রসিদ/স্ক্রিনশট (ঐচ্ছিক)</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setPayFile(e.target.files?.[0] || null)}
                            style={{ fontSize: '0.8rem' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="button" onClick={() => setShowPayForm(false)} className="btn btn-outline" style={{ padding: '8px 15px', fontSize: '0.85rem' }}>বাতিল</button>
                          <button 
                            type="submit" 
                            disabled={payUploading}
                            className="btn btn-primary"
                            style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px', fontSize: '0.88rem', fontWeight: 'bold' }}
                          >
                            <Upload size={16} /> {payUploading ? 'আপলোড হচ্ছে...' : 'পেমেন্ট সাবমিট করুন'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Items Purchased Preview */}
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', textAlign: 'left', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px', marginBottom: '15px' }}>
            📦 অর্ডারকৃত পণ্য সমূহ:
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--color-sand)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={getImageUrl(item.img)} 
                    alt={item.title} 
                    style={{ width: '45px', height: '45px', objectFit: 'contain', backgroundColor: 'var(--color-sand)', borderRadius: '4px' }}
                  />
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-forest-dark)', display: 'block' }}>{item.title}</span>
                    <span style={{ fontSize: '0.78rem', color: 'gray' }}>{item.weight} x {item.quantity}</span>
                  </div>
                </div>
                <span style={{ fontWeight: 'bold', color: 'var(--color-mud)', fontSize: '0.92rem' }}>৳{item.priceNum * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Total Cost Display */}
          <div style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            textAlign: 'right',
            alignItems: 'flex-end',
            marginBottom: '35px'
          }}>
            <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', fontSize: '0.88rem', color: 'gray' }}>
              <span>উপমোট মূল্য</span>
              <span>৳{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', fontSize: '0.88rem', color: 'gray' }}>
              <span>ডেলিভারি চার্জ</span>
              <span>৳{order.shippingCost}</span>
            </div>
            <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-mangrove)', marginTop: '5px', borderTop: '1px dashed var(--color-border)', paddingTop: '8px' }}>
              <span>সর্বমোট</span>
              <span>৳{order.total}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link to="/products" className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.95rem' }}>
              আরো কেনাকাটা করুন
            </Link>
            <Link to="/account" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              আমার অ্যাকাউন্ট ট্র্যাক করুন <ArrowRight size={16} />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
