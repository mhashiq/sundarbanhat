import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { dataService, getImageUrl } from '../services/dataService';

const timelineSteps = [
  'Order Placed',
  'Payment Confirmed',
  'Order Packing',
  'Order Shipping',
  'Order Delivered'
];

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

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const idx = timelineSteps.indexOf(order.order_status);
    return idx >= 0 ? idx : 0;
  }, [order]);

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '85vh', paddingTop: '30px' }}>
      <Helmet>
        <title>অর্ডার ডিটেইলস - সুন্দরবন হাট</title>
      </Helmet>

      <div className="container" style={{ maxWidth: '1050px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, color: 'var(--color-forest-dark)', fontSize: '1.7rem' }}>অর্ডার ডিটেইলস</h2>
          <Link to="/account" className="btn btn-outline" style={{ padding: '8px 14px' }}>আমার অর্ডারে ফিরে যান</Link>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header summary card */}
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '24px', boxShadow: highlightOrder ? '0 0 0 3px rgba(49, 130, 206, 0.18), 0 4px 15px var(--color-shadow)' : '0 4px 15px var(--color-shadow)', transition: 'box-shadow 0.25s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block', marginBottom: '4px' }}>ORDER NUMBER</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)' }}>#{order.transaction_id}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block', marginBottom: '4px' }}>DATE & TIME</span>
                  <strong style={{ fontSize: '1rem' }}>{new Date(order.created_at).toLocaleString('bn-BD')}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block', marginBottom: '4px' }}>ORDER STATUS</span>
                  <span style={{ 
                    display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: 
                      order.order_status === 'Order Delivered' ? '#e8f5e9' : 
                      order.order_status === 'Order Cancelled' ? '#ffebee' : 
                      order.order_status === 'Refunded' ? '#fff3e0' : '#e0f7fa',
                    color: 
                      order.order_status === 'Order Delivered' ? '#2e7d32' : 
                      order.order_status === 'Order Cancelled' ? '#c62828' : 
                      order.order_status === 'Refunded' ? '#e65100' : '#006064'
                  }}>
                    {timelineLabels[order.order_status] || order.order_status}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block', marginBottom: '4px' }}>PAYMENT STATUS</span>
                  <span style={{ 
                    display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'capitalize',
                    backgroundColor: 
                      order.payment_status === 'payment_approved' || order.payment_status === 'paid' ? '#e8f5e9' : 
                      order.payment_status === 'payment_rejected' || order.payment_status === 'failed' ? '#ffebee' : '#fff9c4',
                    color: 
                      order.payment_status === 'payment_approved' || order.payment_status === 'paid' ? '#2e7d32' : 
                      order.payment_status === 'payment_rejected' || order.payment_status === 'failed' ? '#c62828' : '#f57f17'
                  }}>
                    {order.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Stepper */}
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 15px var(--color-shadow)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-forest-dark)', fontSize: '1.1rem', fontWeight: 'bold' }}>📍 Order Tracker Timeline</h3>
              
              {order.order_status === 'Order Cancelled' ? (
                <div style={{ padding: '15px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px', color: '#c62828', fontWeight: 'bold', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span>⚠️ This order has been cancelled (আদেশ বাতিল করা হয়েছে)</span>
                </div>
              ) : order.order_status === 'Refunded' ? (
                <div style={{ padding: '15px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', color: '#e65100', fontWeight: 'bold', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span>🔄 This order has been refunded (অর্থ ফেরত দেওয়া হয়েছে)</span>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflowX: 'auto', padding: '10px 0', gap: '15px' }}>
                  
                  {/* Stepper bar background */}
                  <div style={{ position: 'absolute', top: '24px', left: '8%', right: '8%', height: '4px', background: '#eee', zIndex: 1 }} />
                  
                  {/* Stepper bar active progress */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '24px', 
                    left: '8%', 
                    width: `${(currentStepIndex / (timelineSteps.length - 1)) * 84}%`, 
                    height: '4px', 
                    background: 'linear-gradient(to right, #2c855a, #2b6cb0)', 
                    zIndex: 1, 
                    transition: 'width 0.4s ease-in-out' 
                  }} />

                  {timelineSteps.map((step, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;
                    const isDelivered = order.order_status === 'Order Delivered' && idx === 4;
                    const isCurrentOrCompleted = idx <= currentStepIndex || isDelivered;
                    return (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '95px', position: 'relative', flex: 1, zIndex: 2 }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isActive ? '#3182ce' : (isCompleted || isDelivered ? '#48bb78' : '#eee'),
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          transition: 'all 0.3s ease',
                          boxShadow: isActive ? '0 0 10px rgba(49, 130, 206, 0.5)' : 'none'
                        }}>
                          {isCompleted || isDelivered ? '✓' : idx + 1}
                        </div>
                        <span style={{
                          fontSize: '0.76rem',
                          marginTop: '8px',
                          fontWeight: isCurrentOrCompleted ? 'bold' : 'normal',
                          color: isCurrentOrCompleted ? 'var(--color-forest-dark)' : '#888',
                          whiteSpace: 'nowrap'
                        }}>
                          {timelineLabels[step] || step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Main Details Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
              
              {/* Product List Panel */}
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-forest-dark)', fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '2px solid var(--color-honey-glow)', paddingBottom: '8px', width: 'fit-content' }}>
                  📦 Ordered Products List
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(order.order_items || []).map((item: any) => {
                    const sku = item.products?.sku || item.product_id || item.products?.id || 'N/A';
                    const subtotal = Number(item.price_num || 0) * Number(item.quantity || 0);
                    return (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr auto', alignItems: 'center', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #f0f0f0' }}>
                        <img 
                          src={getImageUrl(item.products?.img)} 
                          alt={item.products?.title || 'Product'} 
                          style={{ width: '72px', height: '72px', objectFit: 'contain', background: 'var(--color-sand)', borderRadius: '8px', border: '1px solid var(--color-border)' }} 
                        />
                        <div>
                          <strong style={{ display: 'block', color: 'var(--color-forest-dark)', fontSize: '1rem' }}>{item.products?.title || 'Unknown Product'}</strong>
                          <span style={{ color: 'gray', fontSize: '0.8rem', display: 'block', marginTop: '3px' }}>
                            Category: {item.products?.category || 'N/A'} | Weight/Size: {item.products?.weight || 'N/A'} | SKU: {sku}
                          </span>
                          <span style={{ fontSize: '0.84rem', color: 'var(--color-charcoal-light)', display: 'block', marginTop: '2px' }}>
                            Qty: {item.quantity} x ৳{item.price_num}
                          </span>
                        </div>
                        <strong style={{ color: 'var(--color-mangrove)', fontSize: '1.05rem' }}>৳{subtotal}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Info Panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Delivery Information */}
                <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--color-forest-dark)', fontSize: '1rem', fontWeight: 'bold' }}>📍 Delivery Address & Courier</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#555' }}>
                    <div><strong>Recipient Name:</strong> {order.customer_name}</div>
                    <div><strong>Phone Number:</strong> {order.phone}</div>
                    <div><strong>Full Address:</strong> {order.address}</div>
                    <div><strong>District:</strong> {order.city}</div>
                    {order.postal_code && <div><strong>Postal Code:</strong> {order.postal_code}</div>}
                    <div><strong>Delivery Notes:</strong> {order.notes || 'N/A'}</div>
                    
                    {order.courier_name && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--color-border)' }}>
                        <div><strong>Courier Company:</strong> <strong style={{ color: 'var(--color-forest-dark)' }}>{order.courier_name}</strong></div>
                        {order.courier_tracking_number && (
                          <div style={{ marginTop: '4px' }}>
                            <strong>Tracking Code:</strong> <span style={{ color: 'var(--color-mangrove)', fontWeight: 'bold', fontSize: '0.92rem' }}>{order.courier_tracking_number}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--color-forest-dark)', fontSize: '1rem', fontWeight: 'bold' }}>💳 Payment Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#555' }}>
                    <div><strong>Payment Method:</strong> <span style={{ textTransform: 'uppercase' }}>{order.payment_method}</span></div>
                    <div><strong>Transaction ID:</strong> <strong style={{ color: 'var(--color-mangrove)' }}>{order.payments?.[0]?.transaction_id || 'N/A'}</strong></div>
                    <div><strong>Payment Date:</strong> {order.payments?.[0]?.payment_date ? new Date(order.payments[0].payment_date).toLocaleString('bn-BD') : 'N/A'}</div>
                    <div><strong>Verification Status:</strong> {order.payments?.[0]?.status || order.payment_status}</div>
                    
                    <div style={{ borderTop: '1px dashed #eee', paddingTop: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Advance Paid:</span>
                        <strong>৳{order.advance_paid_amount || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Paid:</span>
                        <strong>৳{order.total_paid_amount || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4444', fontWeight: 'bold' }}>
                        <span>Outstanding Due:</span>
                        <strong>৳{order.due_amount !== null && order.due_amount !== undefined ? order.due_amount : (order.total - (order.total_paid_amount || 0) - (order.advance_paid_amount || 0))}</strong>
                      </div>
                    </div>

                    {order.payment_notes && (
                      <div style={{ marginTop: '5px', fontSize: '0.82rem', background: 'var(--color-sand)', padding: '8px', borderRadius: '4px', color: 'var(--color-mud)' }}>
                        <strong>Note:</strong> {order.payment_notes}
                      </div>
                    )}
                    
                    {(order.payment_proof_image || order.payments?.[0]?.screenshot_url || order.payments?.[0]?.payment_proofs?.[0]?.screenshot_url) && (
                      <div style={{ marginTop: '8px' }}>
                        <strong style={{ display: 'block', marginBottom: '6px' }}>Payment Screenshot:</strong>
                        <a href={getImageUrl(order.payment_proof_image || order.payments?.[0]?.screenshot_url || order.payments?.[0]?.payment_proofs?.[0]?.screenshot_url)} target="_blank" rel="noreferrer">
                          <img 
                            src={getImageUrl(order.payment_proof_image || order.payments?.[0]?.screenshot_url || order.payments?.[0]?.payment_proofs?.[0]?.screenshot_url)} 
                            alt="Payment screenshot proof" 
                            style={{ width: '100%', maxHeight: '110px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '6px' }}
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Details */}
                <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--color-forest-dark)', fontSize: '1rem', fontWeight: 'bold' }}>💰 Pricing Summary</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: '#555' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><strong>৳{order.subtotal}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery Charge</span><strong>৳{order.shipping_cost}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><strong>৳0</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem', color: 'var(--color-mangrove)', borderTop: '1px dashed var(--color-border)', paddingTop: '10px', marginTop: '5px' }}>
                      <span>Grand Total</span><span>৳{order.total}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline Logs Card */}
                <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--color-forest-dark)', fontSize: '1rem', fontWeight: 'bold' }}>🕒 Order Status Timeline Log</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(!order.order_status_history || order.order_status_history.length === 0) ? (
                      <div style={{ color: 'gray', fontSize: '0.85rem' }}>No status updates logged yet.</div>
                    ) : (
                      order.order_status_history
                        .slice()
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((h: any) => (
                          <div key={h.id} style={{ borderLeft: '3px solid var(--color-mangrove)', paddingLeft: '10px', fontSize: '0.84rem' }}>
                            <strong style={{ display: 'block', color: 'var(--color-forest-dark)' }}>{h.status}</strong>
                            <span style={{ display: 'block', color: 'gray', fontSize: '0.74rem' }}>{new Date(h.created_at).toLocaleString('bn-BD')}</span>
                            {h.notes && <span style={{ display: 'block', color: '#555', marginTop: '3px', fontSize: '0.8rem' }}>{h.notes}</span>}
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}
      </div>
    </section>
  );
};
