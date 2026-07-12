import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, PlusCircle, Package, Save, Trash2, X, MapPin, User2, CreditCard, Truck, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase/supabase';
import { dataService, type DetailedOrderRecord, type Product, type OrderSource } from '../services/dataService';
import { AdminDeleteDialog } from '../components/AdminDeleteDialog';
import {
  formatCurrency,
  formatDateTime,
  formatOrderSource,
  formatOrderStatus,
  formatPaymentStatus,
  orderStatusOptions,
  paymentMethodOptions,
  paymentStatusOptions,
  socialOrderSources,
  sourceTone,
  statusTone,
} from './adminOrderUtils';

interface EditableItem {
  product_id: string | null;
  quantity: number;
  price_num: number;
  products?: Product | null;
}

const toDateTimeLocalValue = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

export const AdminOrderEdit: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<DetailedOrderRecord | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderStatus, setOrderStatus] = useState('pending_payment');
  const [paymentStatus, setPaymentStatus] = useState('pending_payment');
  const [orderSource, setOrderSource] = useState<OrderSource>('Website');
  const [advancePaidAmount, setAdvancePaidAmount] = useState('');
  const [totalPaidAmount, setTotalPaidAmount] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [courierName, setCourierName] = useState('');
  const [courierTrackingNumber, setCourierTrackingNumber] = useState('');
  const [courierCollectionAmount, setCourierCollectionAmount] = useState('');
  const [paymentReceivedBy, setPaymentReceivedBy] = useState('');
  const [paymentReceivedDate, setPaymentReceivedDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);

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
        const [orderResult, productsResult] = await Promise.all([
          dataService.getAdminOrderById(orderId),
          dataService.getProducts()
        ]);

        if (orderResult.error) throw new Error(orderResult.error);
        if (!orderResult.order) throw new Error('Order not found.');

        const loadedOrder = orderResult.order;
        setOrder(loadedOrder);
        setProducts(productsResult || []);
        setCustomerName(loadedOrder.customer_name || '');
        setPhone(loadedOrder.phone || '');
        setEmail(loadedOrder.email || '');
        setAddress(loadedOrder.address || '');
        setCity(loadedOrder.city || '');
        setPostalCode(loadedOrder.postal_code || '');
        setPaymentMethod(String(loadedOrder.payment_method || 'cod'));
        setOrderStatus(loadedOrder.order_status || 'pending_payment');
        setPaymentStatus(loadedOrder.payment_status || 'pending_payment');
        setOrderSource((loadedOrder.order_source || 'Website') as OrderSource);
        setAdvancePaidAmount(String(loadedOrder.advance_paid_amount || 0));
        setTotalPaidAmount(String(loadedOrder.total_paid_amount || 0));
        setShippingCost(String(loadedOrder.shipping_cost || 0));
        setCourierName(loadedOrder.courier_name || '');
        setCourierTrackingNumber(loadedOrder.courier_tracking_number || '');
        setCourierCollectionAmount(String(loadedOrder.courier_collection_amount || 0));
        setPaymentReceivedBy(loadedOrder.payment_received_by || '');
        setPaymentReceivedDate(toDateTimeLocalValue(loadedOrder.payment_received_date));
        setPaymentNotes(loadedOrder.payment_notes || '');
        setInternalNotes(loadedOrder.internal_notes || '');
        setItems((loadedOrder.order_items || []).map((item: any) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity || 1),
          price_num: Number(item.price_num || 0),
          products: item.products || null
        })));
      } catch (err: any) {
        setError(err?.message || 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId]);

  const showToast = (tone: 'success' | 'error', message: string) => {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 2800);
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter(product => product.title.toLowerCase().includes(term) || product.weight.toLowerCase().includes(term) || product.category.toLowerCase().includes(term));
  }, [products, searchTerm]);

  const totalSubtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price_num || 0) * Number(item.quantity || 0), 0), [items]);
  const calculatedShipping = Number(shippingCost || 0);
  const calculatedAdvance = Number(advancePaidAmount || 0);
  const calculatedTotalPaid = Number(totalPaidAmount || 0);
  const calculatedTotal = totalSubtotal + calculatedShipping;
  const calculatedDue = Math.max(0, calculatedTotal - calculatedAdvance - calculatedTotalPaid);
  const sourceBadge = order ? { ...sourceTone(formatOrderSource(orderSource)) } : null;
  const statusBadge = order ? { ...statusTone(orderStatus) } : null;
  const paymentBadge = order ? { ...statusTone(paymentStatus) } : null;
  const isWebsiteOrder = String(orderSource || 'Website') === 'Website';

  const addProduct = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product_id: product.id, quantity: 1, price_num: product.priceNum, products: product }];
    });
    setSearchTerm('');
  };

  const handleSave = async () => {
    if (!order) return;

    setSaving(true);
    try {
      const payload = {
        customer_name: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim(),
        city: city.trim(),
        postal_code: postalCode.trim() || null,
        payment_method: paymentMethod,
        order_status: orderStatus,
        payment_status: paymentStatus,
        order_source: isWebsiteOrder ? 'Website' : orderSource,
        advance_paid_amount: calculatedAdvance,
        total_paid_amount: calculatedTotalPaid,
        due_amount: calculatedDue,
        shipping_cost: calculatedShipping,
        courier_name: courierName.trim() || null,
        courier_tracking_number: courierTrackingNumber.trim() || null,
        courier_collection_amount: Number(courierCollectionAmount || 0),
        payment_received_by: paymentReceivedBy.trim() || null,
        payment_received_date: paymentReceivedDate || null,
        payment_notes: paymentNotes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        total: calculatedTotal
      };

      await dataService.updateAdminOrder(order.id, payload as any);
      await dataService.replaceAdminOrderItems(
        order.id,
        items.map(item => ({ product_id: item.product_id, quantity: Number(item.quantity || 1), price_num: Number(item.price_num || 0) }))
      );

      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: orderStatus,
        notes: `Order updated by admin at ${new Date().toISOString()}`
      });

      showToast('success', 'Order updated successfully.');
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update order.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    await dataService.deleteAdminOrder(order.id);
    showToast('success', `Order ${order.transaction_id} deleted.`);
    navigate('/orders');
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '28px' }}>Loading order editor...</div>;
  }

  if (error || !order) {
    return <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '28px' }}><div style={{ maxWidth: '980px', margin: '0 auto', background: '#fff', border: '1px solid #fecdd3', borderRadius: '18px', padding: '24px', color: '#9f1239' }}>{error || 'Order not found.'}</div></div>;
  }

  return (
    <>
      <Helmet>
        <title>Edit Order - Admin</title>
      </Helmet>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef7f2 100%)', padding: '28px 18px 48px' }}>
        <div className="container" style={{ maxWidth: '1400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <button onClick={() => navigate(`/orders/${order.id}`)} className="btn btn-outline" style={{ borderRadius: '999px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ChevronLeft size={16} /> Back to View
              </button>
              <h1 style={{ margin: 0, color: 'var(--color-forest-dark)', fontSize: '1.9rem' }}>Edit Order #{order.transaction_id}</h1>
              <p style={{ margin: '8px 0 0', color: '#64748b' }}>Edit order details, products, payment, courier data, and source rules.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setDeleteOpen(true)} className="btn btn-outline" style={{ borderRadius: '999px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#9f1239', borderColor: '#fecdd3' }}>
                <Trash2 size={16} /> Delete
              </button>
              <button onClick={handleSave} disabled={saving} className="btn" style={{ background: 'var(--color-mangrove)', color: '#fff', borderRadius: '999px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.75 : 1 }}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
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
                  <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem', ...(sourceBadge || {}) }}>{formatOrderSource(orderSource)}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>ORDER STATUS</div>
                  <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem', ...(statusBadge || {}) }}>{formatOrderStatus(orderStatus)}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>PAYMENT STATUS</div>
                  <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem', ...(paymentBadge || {}) }}>{formatPaymentStatus(paymentStatus)}</span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><User2 size={16} /> Customer Information</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><MapPin size={16} /> Shipping Address</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Address" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / District" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                    <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal code" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><CreditCard size={16} /> Transaction Details</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }}>
                      {paymentMethodOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }}>
                      {orderStatusOptions.map(status => <option key={status} value={status}>{formatOrderStatus(status)}</option>)}
                    </select>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }}>
                      {paymentStatusOptions.map(status => <option key={status} value={status}>{formatPaymentStatus(status)}</option>)}
                    </select>
                    {!isWebsiteOrder && (
                      <select value={orderSource} onChange={(e) => setOrderSource(e.target.value as OrderSource)} style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }}>
                        {socialOrderSources.map(source => <option key={source} value={source}>{source}</option>)}
                      </select>
                    )}
                    <div style={{ color: '#64748b', fontSize: '0.86rem' }}>{isWebsiteOrder ? 'Website source is locked and cannot be changed.' : 'Manual orders can change their social platform source.'}</div>
                  </div>
                </div>
              </div>
            </section>

            <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><Package size={16} /> Product List</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Update quantities or add more products below.</div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {items.map((item, index) => (
                  <div key={`${item.product_id}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-forest-dark)' }}>{item.products?.title || item.product_id || 'Unknown product'}</div>
                      <div style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px' }}>Unit price: {formatCurrency(Number(item.price_num || 0))}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => setItems(prev => prev.map((row, idx) => idx === index ? { ...row, quantity: Math.max(1, row.quantity - 1) } : row))} className="btn btn-outline" style={{ borderRadius: '10px', padding: '7px 10px' }}>-</button>
                      <strong>{item.quantity}</strong>
                      <button onClick={() => setItems(prev => prev.map((row, idx) => idx === index ? { ...row, quantity: row.quantity + 1 } : row))} className="btn btn-outline" style={{ borderRadius: '10px', padding: '7px 10px' }}>+</button>
                      <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== index))} className="btn btn-outline" style={{ borderRadius: '10px', padding: '7px 10px', color: '#9f1239', borderColor: '#fecdd3' }}><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div><label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Search products</label><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Type product name or category" style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} /></div>
                <div><label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Shipping</label><input value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} type="number" min="0" style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} /></div>
                <div><label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Advance paid</label><input value={advancePaidAmount} onChange={(e) => setAdvancePaidAmount(e.target.value)} type="number" min="0" style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} /></div>
                <div><label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Total paid</label><input value={totalPaidAmount} onChange={(e) => setTotalPaidAmount(e.target.value)} type="number" min="0" style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} /></div>
              </div>

              <div style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><strong>{formatCurrency(totalSubtotal)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><strong>{formatCurrency(calculatedShipping)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total</span><strong>{formatCurrency(calculatedTotal)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Due</span><strong>{formatCurrency(calculatedDue)}</strong></div>
              </div>
            </section>

            <section style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><Truck size={16} /> Courier Details</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Courier name" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                    <input value={courierTrackingNumber} onChange={(e) => setCourierTrackingNumber(e.target.value)} placeholder="Tracking number" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                    <input value={courierCollectionAmount} onChange={(e) => setCourierCollectionAmount(e.target.value)} type="number" min="0" placeholder="Courier collection amount" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                    <input value={paymentReceivedBy} onChange={(e) => setPaymentReceivedBy(e.target.value)} placeholder="Payment received by" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                    <input value={paymentReceivedDate} onChange={(e) => setPaymentReceivedDate(e.target.value)} type="datetime-local" style={{ padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><ShieldCheck size={16} /> Internal Notes</div>
                  <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={4} placeholder="Payment notes" style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'inherit', marginBottom: '12px' }} />
                  <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={4} placeholder="Internal notes" style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Add product</label>
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search product to add" style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                  {searchTerm.trim() && (
                    <div style={{ marginTop: '8px', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', maxHeight: '240px', overflowY: 'auto' }}>
                      {filteredProducts.slice(0, 10).map(product => (
                        <button key={product.id} type="button" onClick={() => addProduct(product)} style={{ width: '100%', textAlign: 'left', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', borderBottom: '1px solid #eef2f7', background: '#fff', cursor: 'pointer' }}>
                          <span>
                            <strong style={{ display: 'block', color: 'var(--color-forest-dark)' }}>{product.title}</strong>
                            <span style={{ color: '#64748b', fontSize: '0.84rem' }}>{product.category} | {product.weight}</span>
                          </span>
                          <span style={{ background: 'var(--color-sand)', padding: '4px 10px', borderRadius: '999px', color: 'var(--color-forest-dark)', fontWeight: 800 }}><PlusCircle size={14} /></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={handleSave} disabled={saving} className="btn" style={{ background: 'var(--color-mangrove)', color: '#fff', borderRadius: '999px', padding: '12px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', opacity: saving ? 0.75 : 1 }}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <AdminDeleteDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        description={`You are about to delete order #${order.transaction_id}. This action permanently removes the order and its related records.`}
      />

      {toast && (
        <div style={{ position: 'fixed', right: '18px', bottom: '18px', zIndex: 1250, background: toast.tone === 'success' ? '#ecfdf5' : '#fff1f2', color: toast.tone === 'success' ? '#166534' : '#9f1239', border: `1px solid ${toast.tone === 'success' ? '#bbf7d0' : '#fecdd3'}`, padding: '14px 16px', borderRadius: '14px', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)', maxWidth: '320px' }}>
          {toast.message}
        </div>
      )}
    </>
  );
};
