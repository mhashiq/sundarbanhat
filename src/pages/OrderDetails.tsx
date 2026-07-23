import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { dataService, getImageUrl } from '../services/dataService';

const timelineLabels: Record<string, string> = {
  'Order Placed': 'Order Placed',
  'Payment Confirmed': 'Payment Confirmed',
  'Order Packing': 'Order Packing',
  'Order Shipping': 'Order Shipping',
  'Order Delivered': 'Order Delivered',
  'Order Cancelled': 'Order Cancelled',
  'Refunded': 'Refunded'
};

export const OrderDetails: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const highlightOrder = new URLSearchParams(location.search).get('highlight') === '1';

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    products: true,
    delivery: true,
    payment: true,
    timeline: true
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const load = async () => {
      if (!transactionId) {
        setError('Order শনাক্ত করা যায়নি।');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const result = await dataService.getOrderByTransactionId(transactionId);
        if (!result) {
          setError('অর্ডার পাওয়া যায়নি।');
          setOrder(null);
        } else {
          setOrder(result);
        }
      } catch (err: any) {
        setError(err?.message || 'অর্ডার তথ্য লোড করা যায়নি।');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [transactionId]);

  useEffect(() => {
    if (highlightOrder) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [highlightOrder]);

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '85vh', paddingTop: '20px', paddingBottom: '80px' }}>
      <Helmet>
        <title>অর্ডার ডিটেইলস - সুন্দরবন হাট</title>
      </Helmet>

      <div className="container" style={{ maxWidth: '850px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, color: 'var(--color-forest-dark)', fontSize: '1.5rem', fontWeight: '800' }}>অর্ডার ডিটেইলস</h2>
          <Link to="/account" className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>← আমার অর্ডারে ফিরে যান</Link>
        </div>

        {loading && (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
            অর্ডার লোড হচ্ছে...
          </div>
        )}

        {!loading && error && (
          <div style={{ background: '#ffebee', color: '#b71c1c', padding: '18px', borderRadius: '12px', border: '1px solid #ef9a9a' }}>
            {error}
          </div>
        )}

        {!loading && !error && order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <style>{`
              .sh-acc-card {
                background: #FFFFFF;
                border: 1px solid #E5E7EB;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.03);
              }
              .sh-acc-header {
                width: 100%;
                padding: 16px 20px;
                background: #FFFFFF;
                border: none;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 1rem;
                font-weight: 800;
                color: #1E293B;
                cursor: pointer;
                text-align: left;
                border-bottom: 1px solid #F1F5F9;
              }
              .sh-acc-header:hover {
                background: #F8FAFC;
              }
              .sh-acc-body {
                padding: 18px 20px;
              }
              .sh-sticky-help-bar {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #FFFFFF;
                border-top: 1px solid #E2E8F0;
                padding: 10px 16px;
                box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
                z-index: 100;
              }
              .sh-sticky-help-title {
                font-size: 0.84rem;
                font-weight: 800;
                color: #334155;
              }
              .sh-sticky-help-actions {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .sh-sticky-help-btn {
                padding: 8px 14px;
                border-radius: 99px;
                font-size: 0.82rem;
                font-weight: 700;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                border: none;
                cursor: pointer;
              }
              .sh-btn-call { background: #E2E8F0; color: #1E293B; }
              .sh-btn-wa { background: #25D366; color: #FFFFFF; }
              .sh-btn-track { background: #2E7D32; color: #FFFFFF; }
            `}</style>

            {/* SECTION 1: Order Summary Accordion */}
            <div className="sh-acc-card">
              <button onClick={() => toggleSection('summary')} className="sh-acc-header">
                <span>🛒 Order Summary (অর্ডার সারসংক্ষেপ)</span>
                <span>{openSections.summary ? '▲' : '▼'}</span>
              </button>
              {openSections.summary && (
                <div className="sh-acc-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>ORDER NUMBER</span>
                      <strong style={{ fontSize: '1.1rem', color: '#144A26' }}>#{order.transaction_id}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>DATE & TIME</span>
                      <strong style={{ fontSize: '0.9rem' }}>{new Date(order.created_at).toLocaleString('bn-BD')}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>GRAND TOTAL</span>
                      <strong style={{ fontSize: '1.2rem', color: '#2E7D32' }}>৳{order.total}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>STATUS</span>
                      <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                        {timelineLabels[order.order_status] || order.order_status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: Products Accordion */}
            <div className="sh-acc-card">
              <button onClick={() => toggleSection('products')} className="sh-acc-header">
                <span>📦 Products (পণ্যসমূহ)</span>
                <span>{openSections.products ? '▲' : '▼'}</span>
              </button>
              {openSections.products && (
                <div className="sh-acc-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(order.order_items || []).map((item: any) => {
                      const sku = item.products?.sku || item.product_id || item.products?.id || 'N/A';
                      const subtotal = Number(item.price_num || 0) * Number(item.quantity || 0);
                      return (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                          <img 
                            src={getImageUrl(item.products?.img)} 
                            alt={item.products?.title || 'Product'} 
                            style={{ width: '56px', height: '56px', objectFit: 'contain', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }} 
                          />
                          <div>
                            <strong style={{ display: 'block', color: '#1E293B', fontSize: '0.92rem' }}>{item.products?.title || 'Unknown Product'}</strong>
                            <span style={{ color: '#64748B', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
                              পরিমাণ: {item.quantity} × ৳{item.price_num} · SKU: {sku}
                            </span>
                          </div>
                          <strong style={{ color: '#2E7D32', fontSize: '0.98rem' }}>৳{subtotal}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Delivery Address Accordion */}
            <div className="sh-acc-card">
              <button onClick={() => toggleSection('delivery')} className="sh-acc-header">
                <span>📍 Delivery Address (ডেলিভারি ঠিকানা)</span>
                <span>{openSections.delivery ? '▲' : '▼'}</span>
              </button>
              {openSections.delivery && (
                <div className="sh-acc-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#475569' }}>
                    <div><strong>প্রাপকের নাম:</strong> {order.customer_name}</div>
                    <div><strong>মোবাইল নম্বর:</strong> {order.phone}</div>
                    <div><strong>ঠিকানা:</strong> {order.address}</div>
                    <div><strong>জেলা/শহর:</strong> {order.city}</div>
                    {order.notes && <div><strong>নোট:</strong> {order.notes}</div>}
                    {order.courier_name && (
                      <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                        <div><strong>কুরিয়ার:</strong> {order.courier_name}</div>
                        {order.courier_tracking_number && <div><strong>ট্র্যাকিং কোড:</strong> {order.courier_tracking_number}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: Payment Information Accordion */}
            <div className="sh-acc-card">
              <button onClick={() => toggleSection('payment')} className="sh-acc-header">
                <span>💳 Payment Information (পেমেন্ট তথ্য)</span>
                <span>{openSections.payment ? '▲' : '▼'}</span>
              </button>
              {openSections.payment && (
                <div className="sh-acc-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#475569' }}>
                    <div><strong>পেমেন্ট মাধ্যম:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{order.payment_method}</span></div>
                    <div><strong>পেমেন্ট স্ট্যাটাস:</strong> {order.payment_status}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E2E8F0', paddingTop: '8px', marginTop: '4px' }}>
                      <span>উপমোট (Subtotal):</span><strong>৳{order.subtotal}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ডেলিভারি চার্জ:</span><strong>৳{order.shipping_cost}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2E7D32', fontWeight: '800', fontSize: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                      <span>সর্বমোট (Grand Total):</span><span>৳{order.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: Timeline Accordion */}
            <div className="sh-acc-card">
              <button onClick={() => toggleSection('timeline')} className="sh-acc-header">
                <span>⏱️ Timeline (টাইমলাইন ও আপডেট)</span>
                <span>{openSections.timeline ? '▲' : '▼'}</span>
              </button>
              {openSections.timeline && (
                <div className="sh-acc-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(!order.order_status_history || order.order_status_history.length === 0) ? (
                      <div style={{ color: '#64748B', fontSize: '0.85rem' }}>অর্ডারের নতুন কোনো স্ট্যাটাস আপডেট নেই।</div>
                    ) : (
                      order.order_status_history
                        .slice()
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((h: any) => (
                          <div key={h.id} style={{ borderLeft: '3px solid #2E7D32', paddingLeft: '10px', fontSize: '0.84rem' }}>
                            <strong style={{ display: 'block', color: '#1E293B' }}>{h.status}</strong>
                            <span style={{ display: 'block', color: '#94A3B8', fontSize: '0.74rem' }}>{new Date(h.created_at).toLocaleString('bn-BD')}</span>
                            {h.notes && <span style={{ display: 'block', color: '#475569', marginTop: '2px', fontSize: '0.8rem' }}>{h.notes}</span>}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Sticky Help & Track Actions Bar */}
        <div className="sh-sticky-help-bar">
          <div className="sh-sticky-help-title">সহযোগিতা প্রয়োজন?</div>
          <div className="sh-sticky-help-actions">
            <a href="tel:+8801873520181" className="sh-sticky-help-btn sh-btn-call">📞 Call</a>
            <a href="https://wa.me/8801873520181" target="_blank" rel="noreferrer" className="sh-sticky-help-btn sh-btn-wa">💬 WhatsApp</a>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="sh-sticky-help-btn sh-btn-track">🚚 Track Order</button>
          </div>
        </div>

      </div>
    </section>
  );
};
