import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, ArrowRight, DollarSign, Upload, AlertCircle } from 'lucide-react';
import { dataService, getImageUrl } from '../services/dataService';
import type { PaymentMethod } from '../services/dataService';

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

interface ConfirmationOrderView {
  orderId: string;
  dbOrderId: string;
  transactionId: string;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  items: Array<{
    id: string;
    title: string;
    category: string;
    weight: string;
    priceNum: number;
    quantity: number;
    img: string;
  }>;
  payments: Array<{
    id: string;
    payment_method: string;
    transaction_id: string;
    amount: number;
    status: string;
    payment_date?: string;
    rejection_reason?: string | null;
    screenshot_url?: string | null;
    payment_proofs?: Array<{ screenshot_url?: string | null }>;
  }>;
  history: Array<{ id: string; status: string; notes?: string | null; created_at?: string }>;
}

const PAYMENT_INSTRUCTIONS: Record<PaymentMethod, {
  title: string;
  accountName: string;
  accountNumber: string;
  merchantNumber: string;
  steps: string[];
}> = {
  cod: {
    title: 'Cash on Delivery',
    accountName: 'N/A',
    accountNumber: 'N/A',
    merchantNumber: 'N/A',
    steps: [
      'আপনার অর্ডারটি ম্যানুয়াল রিভিউতে গেছে।',
      'অ্যাডমিন আপনার অর্ডার যাচাই করে নিশ্চিত করবে।',
      'অনুমোদনের পর প্রসেসিং শুরু হবে।'
    ]
  },
  bkash: {
    title: 'bKash',
    accountName: 'Sundarban Hat',
    accountNumber: '01873520181',
    merchantNumber: '01873520181',
    steps: [
      'সঠিক মোট অঙ্কটি merchant account-এ পাঠান।',
      'Transaction ID নিন।',
      'Transaction ID, amount এবং screenshot সাবমিট করুন।',
      'অ্যাডমিন যাচাই করে order confirm করবে।'
    ]
  },
  nagad: {
    title: 'Nagad',
    accountName: 'Sundarban Hat',
    accountNumber: '01873520181',
    merchantNumber: '01873520181',
    steps: [
      'সঠিক মোট অঙ্কটি Nagad merchant account-এ পাঠান।',
      'Transaction ID সংগ্রহ করুন।',
      'Transaction ID, amount এবং screenshot সাবমিট করুন।',
      'অ্যাডমিন যাচাই করে order confirm করবে।'
    ]
  },
  rocket: {
    title: 'Rocket',
    accountName: 'Sundarban Hat',
    accountNumber: '01873520181-2',
    merchantNumber: '01873520181-2',
    steps: [
      'সঠিক মোট অঙ্কটি Rocket account-এ পাঠান।',
      'Transaction ID সংগ্রহ করুন।',
      'Transaction ID, amount এবং screenshot সাবমিট করুন।',
      'অ্যাডমিন যাচাই করে order confirm করবে।'
    ]
  },
  bank_transfer: {
    title: 'Bank Transfer',
    accountName: 'Sundarban Hat',
    accountNumber: 'To be provided by admin',
    merchantNumber: 'N/A',
    steps: [
      'আপনার ব্যাংক অ্যাকাউন্ট থেকে সঠিক পরিমাণ ট্রান্সফার করুন।',
      'Receipt বা Transaction ID সংগ্রহ করুন।',
      'Transaction ID, amount এবং receipt screenshot আপলোড করুন।',
      'অ্যাডমিন যাচাই করে order confirm করবে।'
    ]
  }
};

import { OrderSuccessNotification } from '../components/OrderSuccessNotification';

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<ConfirmationOrderView | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(true);
  
  // Manual Payment Form state
  const [showPayForm, setShowPayForm] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('bkash');
  const [payTxId, setPayTxId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payFile, setPayFile] = useState<File | null>(null);
  const [payUploading, setPayUploading] = useState(false);
  const [payError, setPayError] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;

      setLoadingOrder(true);
      setLoadError('');

      const saved = localStorage.getItem(`sh_order_${orderId}`) || localStorage.getItem('sh_latest_order');
      if (saved) {
        try {
          const orderData = JSON.parse(saved) as SavedOrder;
          setPayAmount(orderData.total);
          setPayMethod((orderData.paymentMethod as PaymentMethod) || 'bkash');
          setOrder({
            orderId: orderData.orderId || orderId,
            dbOrderId: orderData.dbOrderId || orderId,
            transactionId: orderData.orderId || orderId,
            customerName: orderData.name || 'গ্রাহক',
            phone: orderData.phone || '',
            address: orderData.address || '',
            district: orderData.city || '',
            createdAt: orderData.date || new Date().toISOString(),
            paymentMethod: (orderData.paymentMethod as PaymentMethod) || 'bkash',
            paymentStatus: 'pending_payment',
            orderStatus: 'pending_payment',
            subtotal: orderData.subtotal || 0,
            shippingCost: orderData.shippingCost || 0,
            discount: 0,
            total: orderData.total || 0,
            items: (orderData.items || []).map(item => ({
              ...item,
              category: '',
              priceNum: item.priceNum
            })),
            payments: [],
            history: []
          });
          setLoadingOrder(false);
        } catch {
          // Ignore fallback parse errors; DB fetch below will decide the page state.
        }
      }

      const dbOrder = await dataService.getOrderByTransactionId(orderId);
      if (!dbOrder) {
        if (!saved) {
          setLoadError('অর্ডার খুঁজে পাওয়া যায়নি।');
        }
        setLoadingOrder(false);
        return;
      }

      const dbItemRows = dbOrder.order_items || [];
      const dbPayment = dbOrder.payments?.[0];
      setAlreadySubmitted(Boolean(dbPayment));
      setPayAmount(Number(dbOrder.total));
      setPayMethod((dbOrder.payment_method as PaymentMethod) || 'bkash');

      setOrder({
        orderId: dbOrder.transaction_id,
        dbOrderId: dbOrder.id,
        transactionId: dbOrder.transaction_id,
        customerName: dbOrder.customer_name,
        phone: dbOrder.phone,
        address: dbOrder.address,
        district: dbOrder.city,
        createdAt: dbOrder.created_at,
        paymentMethod: (dbOrder.payment_method as PaymentMethod) || 'bkash',
        paymentStatus: dbOrder.payment_status,
        orderStatus: dbOrder.order_status,
        subtotal: Number(dbOrder.subtotal),
        shippingCost: Number(dbOrder.shipping_cost),
        discount: 0,
        total: Number(dbOrder.total),
        items: dbItemRows.map((item: any) => ({
          id: item.id,
          title: item.products?.title || item.product_id || 'Unknown Product',
          category: item.products?.category || item.products?.subcategory || '',
          weight: item.products?.weight || '',
          priceNum: Number(item.price_num),
          quantity: Number(item.quantity),
          img: item.products?.img || ''
        })),
        payments: (dbOrder.payments || []) as any,
        history: (dbOrder.order_status_history || []) as any
      });

      setLoadingOrder(false);
    };

    loadOrder();
  }, [orderId]);

  if (loadingOrder) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '999px', background: 'var(--color-sand)', color: 'var(--color-forest-dark)', border: '1px solid var(--color-border)' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-mangrove)', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
          অর্ডার লোড হচ্ছে...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-forest-dark)' }}>অর্ডার পাওয়া যায়নি</h2>
        <p style={{ margin: '15px 0 25px' }}>{loadError || 'দুঃখিত, অনুরোধকৃত অর্ডারের কোনো তথ্য নেই।'}</p>
        <Link to="/products" className="btn btn-primary">পণ্য তালিকা দেখুন</Link>
      </div>
    );
  }

  const currentPaymentMethod = ((order.paymentMethod || 'bkash').toLowerCase() as PaymentMethod);
  const isCashOnDelivery = currentPaymentMethod === 'cod';
  const paymentConfig = PAYMENT_INSTRUCTIONS[currentPaymentMethod] || PAYMENT_INSTRUCTIONS.bkash;

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    if (!payTxId.trim() || !payAmount) {
      setPayError('ট্রানজেকশন আইডি এবং পরিশোধিত টাকার পরিমাণ উল্লেখ করুন।');
      return;
    }

    setPayUploading(true);

    try {
      await dataService.submitPaymentRecord({
        orderId: order.dbOrderId,
        paymentMethod: payMethod,
        transactionId: payTxId.trim(),
        amount: payAmount,
        proofFile: payFile,
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
    <>
      <OrderSuccessNotification
        orderId={order.orderId}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '80vh', paddingTop: '40px' }}>
        <Helmet>
          <title>ধন্যবাদ - আপনার অর্ডার সফল হয়েছে</title>
          <meta name="description" content="সুন্দরবন হাট থেকে আপনার কেনাকাটা সম্পন্ন হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ।" />
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
                🎉 আপনার অর্ডারের জন্য ধন্যবাদ!
              </h2>
              <p style={{ color: 'gray', fontSize: '1.02rem', margin: 0 }}>
                আপনার অর্ডারটি সফলভাবে আমাদের সিস্টেমে যুক্ত হয়েছে। আমাদের টিম খুব শীঘ্রই আপনার অর্ডার যাচাই করে আপনার সঙ্গে যোগাযোগ করবে।
              </p>
            </div>

          {/* Order Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {[
              { label: 'Order ID', value: order.orderId },
              { label: 'Order Date & Time', value: new Date(order.createdAt).toLocaleString('bn-BD') },
              { label: 'Customer Name', value: order.customerName },
              { label: 'Phone Number', value: order.phone },
              { label: 'Delivery Address', value: order.address },
              { label: 'District', value: order.district },
              { label: 'Payment Method', value: paymentConfig.title },
              { label: 'Payment Status', value: order.paymentStatus },
              { label: 'Order Status', value: order.orderStatus }
            ].map((field) => (
              <div key={field.label} style={{ background: 'var(--color-sand)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <span style={{ display: 'block', fontSize: '0.76rem', color: 'gray', marginBottom: '4px' }}>{field.label}</span>
                <strong style={{ color: 'var(--color-forest-dark)', fontSize: '0.96rem', lineHeight: 1.45 }}>{field.value}</strong>
              </div>
            ))}
          </div>

          {/* Ordered Products */}
          <div style={{ background: '#fffdf8', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', margin: '0 0 15px', fontWeight: '800' }}>Ordered Products</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '12px', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <img src={getImageUrl(item.img)} alt={item.title} style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', background: 'var(--color-sand)' }} />
                  <div>
                    <strong style={{ display: 'block', color: 'var(--color-forest-dark)', marginBottom: '3px' }}>{item.title}</strong>
                    <span style={{ display: 'block', color: 'gray', fontSize: '0.82rem' }}>{item.category || 'Product'} · {item.weight || 'N/A'} · Qty {item.quantity}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'gray' }}>৳{item.priceNum.toFixed(2)}</span>
                    <strong style={{ color: 'var(--color-mangrove)' }}>৳{(item.priceNum * item.quantity).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div style={{ background: 'linear-gradient(180deg, #fff, #fff8e7)', border: '1px solid #e8d9a6', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', margin: '0 0 15px', fontWeight: '800' }}>Price Summary</h3>
            {[
              { label: 'Subtotal', value: order.subtotal },
              { label: 'Delivery Charge', value: order.shippingCost },
              { label: 'Discount', value: order.discount || 0 },
              { label: 'Total Amount', value: order.total, strong: true }
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: row.strong ? 'none' : '1px dashed rgba(0,0,0,0.08)', color: row.strong ? 'var(--color-forest-dark)' : 'gray', fontWeight: row.strong ? '800' : 'normal', fontSize: row.strong ? '1.1rem' : '0.94rem' }}>
                <span>{row.label}</span>
                <span>৳{Number(row.value).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Delivery / Payment details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '18px' }}>
              <h3 style={{ margin: '0 0 12px', color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>Payment Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.92rem' }}>
                <div><strong>Method:</strong> {paymentConfig.title}</div>
                <div><strong>Status:</strong> {order.paymentStatus}</div>
                <div><strong>Transaction ID:</strong> {order.payments?.[0]?.transaction_id || 'Not submitted yet'}</div>
                <div><strong>Payment Date:</strong> {order.payments?.[0]?.payment_date ? new Date(order.payments[0].payment_date).toLocaleString('bn-BD') : 'N/A'}</div>
                <div><strong>Admin Verification:</strong> {order.payments?.[0]?.status || 'Pending review'}</div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '18px' }}>
              <h3 style={{ margin: '0 0 12px', color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>Order Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(order.history?.length ? order.history : [
                  { status: 'pending_payment', notes: 'Order placed' },
                  { status: order.paymentStatus, notes: 'Current status' },
                  { status: order.orderStatus, notes: 'Order progress' }
                ]).map((step, idx) => {
                  const timeline = [
                    'Order Placed',
                    'Pending Payment',
                    'Payment Submitted',
                    'Payment Under Review',
                    'Payment Approved',
                    'Order Confirmed',
                    'Processing',
                    'Packed',
                    'Shipped',
                    'Delivered'
                  ];
                  const current = String(step.status).toLowerCase();
                  const label = timeline.find(t => t.toLowerCase().replace(/\s+/g, '_') === current) || step.status;
                  return (
                    <div key={`${step.status}-${idx}`} style={{ display: 'flex', gap: '10px', alignItems: 'center', opacity: idx === (order.history?.length ? order.history.length - 1 : 2) ? 1 : 0.75 }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: idx === (order.history?.length ? order.history.length - 1 : 2) ? 'var(--color-mangrove)' : '#d9c48b', flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem' }}>{label}</strong>
                        <span style={{ color: 'gray', fontSize: '0.76rem' }}>{step.notes || ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
              <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>{new Date(order.createdAt).toLocaleString('bn-BD')}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block' }}>গ্রাহকের নাম</span>
              <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>{order.customerName}</strong>
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

          {/* MANUAL PAYMENT INSTRUCTIONS & SUBMISSION */}
          {isCashOnDelivery ? (
            <div style={{
              backgroundColor: '#fffcf4',
              border: '2px dashed var(--color-honey)',
              padding: '25px',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                📝 অর্ডার রিভিউতে রয়েছে
              </h3>
              <p style={{ margin: 0, lineHeight: '1.7', color: '#555' }}>
                ধন্যবাদ। আপনার অর্ডারটি ম্যানুয়াল রিভিউয়ের জন্য জমা হয়েছে। আমাদের টিম শিগগিরই অর্ডারটি যাচাই করে কনফার্ম করবে।
              </p>
              <ol style={{ margin: '15px 0 0 18px', color: '#555', lineHeight: '1.7', paddingLeft: '10px' }}>
                {paymentConfig.steps.map(step => <li key={step}>{step}</li>)}
              </ol>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#fffcf4',
              border: '2px dashed var(--color-honey)',
              padding: '25px',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', fontWeight: 'bold', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💳 {paymentConfig.title} পেমেন্ট নির্দেশিকা:
              </h3>
              
              <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: '1.6', margin: '0 0 15px 0' }}>
                অর্ডারটি কনফার্ম করতে অনুগ্রহ করে নিচের তথ্য অনুযায়ী সর্বমোট <strong style={{ color: 'var(--color-mangrove)', fontSize: '1.05rem' }}>৳{order.total}</strong> টাকা পাঠান। এরপর Transaction ID, amount এবং screenshot জমা দিন:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                  <span>📱 <strong>Payment Method</strong>:</span>
                  <strong style={{ color: 'var(--color-mangrove)' }}>{paymentConfig.title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                  <span>👤 <strong>Account Name</strong>:</span>
                  <strong style={{ color: 'var(--color-mangrove)' }}>{paymentConfig.accountName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                  <span>🔢 <strong>Merchant / Account Number</strong>:</span>
                  <strong style={{ color: 'var(--color-mangrove)' }}>{paymentConfig.accountNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                  <span>🧾 <strong>Order ID</strong>:</span>
                  <strong style={{ color: 'var(--color-mangrove)' }}>#{order.orderId}</strong>
                </div>
              </div>

              <ol style={{ margin: '0 0 20px 18px', color: '#555', lineHeight: '1.7', paddingLeft: '10px' }}>
                {paymentConfig.steps.map(step => <li key={step}>{step}</li>)}
              </ol>

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
                            onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontSize: '0.88rem' }}
                          >
                            <option value="bkash">bKash (বিকাশ)</option>
                            <option value="nagad">Nagad (নগদ)</option>
                            <option value="rocket">Rocket (রকেট)</option>
                            <option value="bank_transfer">Bank Transfer</option>
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
    </>
  );
};
