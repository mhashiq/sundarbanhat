import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeAlert, ChevronLeft, Edit3, Package, ReceiptText, Truck, Trash2, User2, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { dataService, getImageUrl } from '../services/dataService';
import type { DetailedOrderRecord } from '../services/dataService';
import { AdminDeleteDialog } from '../components/AdminDeleteDialog';
import {
  formatCurrency,
  formatDateTime,
  formatOrderSource,
  formatOrderStatus,
  formatPaymentStatus,
  sourceTone,
  statusTone,
} from './adminOrderUtils';

const timelineSteps = ['pending_payment', 'payment_submitted', 'payment_approved', 'processing', 'packed', 'shipped', 'delivered'];

const ProgressBar: React.FC<{ orderStatus: string }> = ({ orderStatus }) => {
  const normalized = String(orderStatus || '').toLowerCase();
  const activeIndex = Math.max(0, timelineSteps.findIndex(step => normalized.includes(step)));
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${timelineSteps.length}, minmax(0, 1fr))`, gap: '10px' }}>
      {timelineSteps.map((step, index) => {
        const completed = index <= safeIndex;
        const tone = completed ? { background: '#2c855a', color: '#fff' } : { background: '#e2e8f0', color: '#475569' };
        return (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'grid', placeItems: 'center', ...tone, fontWeight: 800, fontSize: '0.82rem' }}>{index + 1}</div>
            <div style={{ fontSize: '0.72rem', textAlign: 'center', color: completed ? '#0f172a' : '#64748b', fontWeight: 700 }}>{formatOrderStatus(step)}</div>
          </div>
        );
      })}
    </div>
  );
};

export const AdminOrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<DetailedOrderRecord | null>(null);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        setError('Order not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const result = await dataService.getAdminOrderById(orderId);
        if (result.error) throw new Error(result.error);
        setOrder(result.order);
        if (!result.order) setError('Order not found.');
      } catch (err: any) {
        setError(err?.message || 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId]);

  const statusBadge = useMemo(() => {
    if (!order) return null;
    return { ...statusTone(order.order_status) };
  }, [order]);

  const paymentBadge = useMemo(() => {
    if (!order) return null;
    return { ...statusTone(order.payment_status) };
  }, [order]);

  const sourceBadge = useMemo(() => {
    if (!order) return null;
    return { ...sourceTone(formatOrderSource(order.order_source)) };
  }, [order]);

  const showToast = (tone: 'success' | 'error', message: string) => {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 2800);
  };

  const handleDelete = async () => {
    if (!order) return;
    await dataService.deleteAdminOrder(order.id);
    showToast('success', `Order ${order.transaction_id} deleted.`);
    navigate('/orders');
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '28px' }}>Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '28px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', background: '#fff', border: '1px solid #fecdd3', borderRadius: '18px', padding: '24px', color: '#9f1239' }}>{error || 'Order not found.'}</div>
      </div>
    );
  }

  const totalItems = (order.order_items || []).reduce((sum, item: any) => sum + Number(item.quantity || 0), 0);
  const paymentProof = order.payment_proof_image || order.payments?.[0]?.screenshot_url || '';

  return (
    <>
      <Helmet>
        <title>Order Details - Admin</title>
      </Helmet>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef7f2 100%)', padding: '28px 18px 48px' }}>
        <div className="container" style={{ maxWidth: '1400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <button onClick={() => navigate('/orders')} className="btn btn-outline" style={{ borderRadius: '999px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ChevronLeft size={16} /> Back to Orders
              </button>
              <h1 style={{ margin: 0, color: 'var(--color-forest-dark)', fontSize: '1.9rem' }}>View Order #{order.transaction_id}</h1>
              <p style={{ margin: '8px 0 0', color: '#64748b' }}>Read-only view with the full order lifecycle and operational details.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link to={`/orders/${order.id}/edit`} className="btn" style={{ background: 'var(--color-mangrove)', color: '#fff', borderRadius: '999px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={16} /> Edit Order
              </Link>
              <button onClick={() => setDeleteOpen(true)} className="btn btn-outline" style={{ borderRadius: '999px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#9f1239', borderColor: '#fecdd3' }}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>ORDER NUMBER</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-forest-dark)' }}>#{order.transaction_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>ORDER SOURCE</div>
                  <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem', ...sourceBadge }}>{formatOrderSource(order.order_source)}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>ORDER STATUS</div>
                  <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem', ...statusBadge }}>{formatOrderStatus(order.order_status)}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>PAYMENT STATUS</div>
                  <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem', ...paymentBadge }}>{formatPaymentStatus(order.payment_status)}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>CREATED</div>
                  <div style={{ fontWeight: 700 }}>{formatDateTime(order.created_at)}</div>
                </div>
              </div>
            </section>

            <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><User2 size={16} /> Customer Information</div>
                  <div style={{ lineHeight: 1.8, color: '#334155' }}>
                    <div><strong>Name:</strong> {order.customer_name}</div>
                    <div><strong>Phone:</strong> {order.phone}</div>
                    <div><strong>Email:</strong> {order.email || 'N/A'}</div>
                    <div><strong>Transaction:</strong> {order.transaction_id}</div>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><MapPin size={16} /> Shipping Address</div>
                  <div style={{ lineHeight: 1.8, color: '#334155' }}>
                    <div><strong>Address:</strong> {order.address}</div>
                    <div><strong>City:</strong> {order.city}</div>
                    <div><strong>Postal Code:</strong> {order.postal_code || 'N/A'}</div>
                    <div><strong>Notes:</strong> {order.notes || 'N/A'}</div>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><CreditCard size={16} /> Transaction Details</div>
                  <div style={{ lineHeight: 1.8, color: '#334155' }}>
                    <div><strong>Method:</strong> {order.payment_method}</div>
                    <div><strong>Subtotal:</strong> {formatCurrency(Number(order.subtotal || 0))}</div>
                    <div><strong>Shipping:</strong> {formatCurrency(Number(order.shipping_cost || 0))}</div>
                    <div><strong>Total:</strong> {formatCurrency(Number(order.total || 0))}</div>
                    <div><strong>Paid:</strong> {formatCurrency(Number(order.total_paid_amount || 0))}</div>
                    <div><strong>Due:</strong> {formatCurrency(Number(order.due_amount || 0))}</div>
                  </div>
                </div>
              </div>
            </section>

            <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><Package size={16} /> Product List ({totalItems} items)</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Items are read from the related order_items rows.</div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {(order.order_items || []).map((item: any) => {
                  const product = item.products || {};
                  const subtotal = Number(item.price_num || 0) * Number(item.quantity || 0);
                  return (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: '14px', alignItems: 'center', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                      <img src={getImageUrl(product.img)} alt={product.title || 'Product'} style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--color-forest-dark)' }}>{product.title || 'Unknown product'}</div>
                        <div style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px' }}>Qty: {item.quantity} × {formatCurrency(Number(item.price_num || 0))}</div>
                        <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>{product.category || 'N/A'} | {product.weight || 'N/A'}</div>
                      </div>
                      <div style={{ fontWeight: 900, color: 'var(--color-mangrove)' }}>{formatCurrency(subtotal)}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '16px' }}>
              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><Truck size={16} /> Courier Information</div>
                <div style={{ display: 'grid', gap: '10px', color: '#334155' }}>
                  <div><strong>Courier:</strong> {order.courier_name || 'N/A'}</div>
                  <div><strong>Tracking Number:</strong> {order.courier_tracking_number || 'N/A'}</div>
                  <div><strong>Courier Collection:</strong> {formatCurrency(Number(order.courier_collection_amount || 0))}</div>
                  <div><strong>Payment Received By:</strong> {order.payment_received_by || 'N/A'}</div>
                  <div><strong>Payment Received Date:</strong> {formatDateTime(order.payment_received_date || null)}</div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><ReceiptText size={16} /> Payment Information</div>
                <div style={{ display: 'grid', gap: '10px', color: '#334155' }}>
                  <div><strong>Payment Method:</strong> {order.payment_method}</div>
                  <div><strong>Advance Paid:</strong> {formatCurrency(Number(order.advance_paid_amount || 0))}</div>
                  <div><strong>Due Amount:</strong> {formatCurrency(Number(order.due_amount !== undefined && order.due_amount !== null ? order.due_amount : Math.max(0, Number(order.total || 0) - Number(order.advance_paid_amount || 0))))}</div>
                  <div><strong>Payment Notes:</strong> {order.payment_notes || 'N/A'}</div>
                </div>
                {paymentProof && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontWeight: 800, marginBottom: '10px', color: 'var(--color-forest-dark)' }}>Payment Proof</div>
                    <a href={getImageUrl(paymentProof)} target="_blank" rel="noreferrer">
                      <img src={getImageUrl(paymentProof)} alt="Payment proof" style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }} />
                    </a>
                  </div>
                )}
              </div>
            </section>

            <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><ShieldCheck size={16} /> Timeline & Progress</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Current: {formatOrderStatus(order.order_status)}</div>
              </div>
              <div style={{ marginBottom: '18px' }}><ProgressBar orderStatus={order.order_status} /></div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {(order.order_status_history || []).map((entry: any) => (
                  <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px', alignItems: 'start', padding: '12px 14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDateTime(entry.created_at)}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-forest-dark)' }}>{formatOrderStatus(entry.status)}</div>
                      <div style={{ color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>{entry.notes || 'No notes'}</div>
                    </div>
                  </div>
                ))}
                {(order.order_status_history || []).length === 0 && (
                  <div style={{ color: '#64748b' }}>No status history found.</div>
                )}
              </div>
            </section>

            <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><BadgeAlert size={16} /> Internal Notes</div>
              <div style={{ minHeight: '80px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', color: '#334155', lineHeight: 1.8 }}>{order.internal_notes || 'No internal notes yet.'}</div>
            </section>
          </div>
        </div>
      </div>

      <AdminDeleteDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        description={`You are about to delete order #${order.transaction_id}. This will permanently remove the order and related records.`}
      />

      {toast && (
        <div style={{ position: 'fixed', right: '18px', bottom: '18px', zIndex: 1250, background: toast.tone === 'success' ? '#ecfdf5' : '#fff1f2', color: toast.tone === 'success' ? '#166534' : '#9f1239', border: `1px solid ${toast.tone === 'success' ? '#bbf7d0' : '#fecdd3'}`, padding: '14px 16px', borderRadius: '14px', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)', maxWidth: '320px' }}>
          {toast.message}
        </div>
      )}
    </>
  );
};
