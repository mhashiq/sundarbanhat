import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, Filter, PlusCircle, Eye, Edit3, Trash2, ChevronLeft, ChevronRight, Package, ReceiptText, Truck, Globe2, MessageSquare, CalendarDays, BadgeAlert } from 'lucide-react';
import { supabase } from '../supabase/supabase';
import { dataService, type AdminOrderSummaryRecord } from '../services/dataService';
import { AdminDeleteDialog } from '../components/AdminDeleteDialog';
import {
  buildPagination,
  dateRangeOptions,
  formatCurrency,
  formatDate,
  formatOrderSource,
  formatOrderStatus,
  formatPaymentStatus,
  orderStatusOptions,
  paymentMethodOptions,
  paymentStatusOptions,
  socialOrderSources,
  sourceTone,
  statusTone,
  getRangeBounds
} from './adminOrderUtils';

type SectionScope = 'website' | 'social';
type FilterValue = 'all' | string;

type SectionFilters = {
  search: string;
  status: FilterValue;
  paymentStatus: FilterValue;
  paymentMethod: FilterValue;
  dateRange: FilterValue;
  source: FilterValue;
};

type SectionResult = {
  orders: AdminOrderSummaryRecord[];
  totalCount: number;
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  pageRevenue: number;
  pageProducts: number;
};

const PAGE_SIZE = 5;
const WEBSITE_STORAGE_KEY = 'admin_orders_website_filters_v1';
const SOCIAL_STORAGE_KEY = 'admin_orders_social_filters_v1';

const defaultFilters = (): SectionFilters => ({
  search: '',
  status: 'all',
  paymentStatus: 'all',
  paymentMethod: 'all',
  dateRange: 'all',
  source: 'all'
});

const normalizeSearch = (value: string): string => value.replace(/[%_,]/g, ' ').trim();

const readStoredFilters = (storageKey: string): SectionFilters => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultFilters();
    return { ...defaultFilters(), ...(JSON.parse(raw) as Partial<SectionFilters>) };
  } catch {
    return defaultFilters();
  }
};

const getStatusTone = (value: string) => {
  const tone = statusTone(value);
  return { background: tone.background, color: tone.color };
};

const getSourceBadge = (value: string) => {
  const tone = sourceTone(value);
  return { background: tone.background, color: tone.color };
};

const SectionStatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '16px 18px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
    <div>
      <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>{value}</div>
    </div>
    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(44,133,90,0.12), rgba(45,212,191,0.18))', display: 'grid', placeItems: 'center', color: 'var(--color-mangrove)' }}>{icon}</div>
  </div>
);

const EmptyState: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div style={{ background: '#fff', border: '1px dashed var(--color-border)', borderRadius: '18px', padding: '28px', textAlign: 'center', color: '#475569' }}>
    <div style={{ fontWeight: 800, color: 'var(--color-forest-dark)', fontSize: '1.05rem', marginBottom: '8px' }}>{title}</div>
    <p style={{ margin: 0, lineHeight: 1.7 }}>{message}</p>
  </div>
);

const PaginationBar: React.FC<{ page: number; totalPages: number; onPageChange: (page: number) => void }> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = buildPagination(page, totalPages);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Page {page} of {totalPages}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: '999px' }} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={16} />
        </button>
        {pages.map((value) => (
          <button
            key={value}
            className="btn"
            onClick={() => onPageChange(value)}
            style={{ padding: '8px 13px', borderRadius: '999px', minWidth: '42px', background: value === page ? 'var(--color-mangrove)' : '#fff', color: value === page ? '#fff' : 'var(--color-forest-dark)', border: `1px solid ${value === page ? 'var(--color-mangrove)' : 'var(--color-border)'}` }}
          >
            {value}
          </button>
        ))}
        <button className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: '999px' }} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const OrderActions: React.FC<{ orderId: string; onDelete: () => void }> = ({ orderId, onDelete }) => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    <Link to={`/orders/${orderId}`} className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <Eye size={15} /> View
    </Link>
    <Link to={`/orders/${orderId}/edit`} className="btn" style={{ padding: '8px 12px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-mangrove)', color: '#fff' }}>
      <Edit3 size={15} /> Edit
    </Link>
    <button type="button" onClick={onDelete} className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#9f1239', borderColor: '#fecdd3' }}>
      <Trash2 size={15} /> Delete
    </button>
  </div>
);

export const AdminOrders: React.FC = () => {
  const navigate = useNavigate();
  const [websiteFilters, setWebsiteFilters] = useState<SectionFilters>(() => (typeof window === 'undefined' ? defaultFilters() : readStoredFilters(WEBSITE_STORAGE_KEY)));
  const [socialFilters, setSocialFilters] = useState<SectionFilters>(() => (typeof window === 'undefined' ? defaultFilters() : readStoredFilters(SOCIAL_STORAGE_KEY)));
  const [websitePage, setWebsitePage] = useState(1);
  const [socialPage, setSocialPage] = useState(1);
  const [websiteResult, setWebsiteResult] = useState<SectionResult>({ orders: [], totalCount: 0, loading: true, error: '', page: 1, totalPages: 1, pageRevenue: 0, pageProducts: 0 });
  const [socialResult, setSocialResult] = useState<SectionResult>({ orders: [], totalCount: 0, loading: true, error: '', page: 1, totalPages: 1, pageRevenue: 0, pageProducts: 0 });
  const [refreshTick, setRefreshTick] = useState(0);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrderSummaryRecord | null>(null);
  const websiteRequestId = useRef(0);
  const socialRequestId = useRef(0);

  useEffect(() => {
    window.localStorage.setItem(WEBSITE_STORAGE_KEY, JSON.stringify(websiteFilters));
  }, [websiteFilters]);

  useEffect(() => {
    window.localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(socialFilters));
  }, [socialFilters]);

  const showToast = (tone: 'success' | 'error', message: string) => {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 2800);
  };

  const fetchSection = async (scope: SectionScope, page: number, filters: SectionFilters, requestId: number) => {
    const pageIndex = Math.max(1, page);
    const offset = (pageIndex - 1) * PAGE_SIZE;

    let query = supabase
      .from('orders')
      .select('id, transaction_id, customer_name, phone, subtotal, shipping_cost, total, payment_method, order_status, payment_status, order_source, created_at, updated_at, advance_paid_amount, total_paid_amount, due_amount', { count: 'exact' });

    if (scope === 'website') {
      query = query.eq('order_source', 'Website');
    } else {
      query = query.neq('order_source', 'Website');
      if (filters.source && filters.source !== 'all') query = query.eq('order_source', filters.source);
    }

    if (filters.status && filters.status !== 'all') query = query.eq('order_status', filters.status);
    if (filters.paymentStatus && filters.paymentStatus !== 'all') query = query.eq('payment_status', filters.paymentStatus);
    if (filters.paymentMethod && filters.paymentMethod !== 'all') query = query.eq('payment_method', filters.paymentMethod);

    if (filters.dateRange && filters.dateRange !== 'all') {
      const bounds = getRangeBounds(filters.dateRange, new Date());
      if (bounds.start) query = query.gte('created_at', bounds.start.toISOString());
      if (bounds.end) query = query.lte('created_at', bounds.end.toISOString());
    }

    const search = normalizeSearch(filters.search);
    if (search) {
      query = query.or(`transaction_id.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

    if (requestId === (scope === 'website' ? websiteRequestId.current : socialRequestId.current)) {
      if (error) {
        return { orders: [], totalCount: 0, totalPages: 1, pageRevenue: 0, pageProducts: 0, error: error.message };
      }

      const rows = (data || []) as AdminOrderSummaryRecord[];
      const orderIds = rows.map(row => row.id);
      const productCountMap = new Map<string, number>();

      if (orderIds.length > 0) {
        const { data: items } = await supabase.from('order_items').select('order_id, quantity').in('order_id', orderIds);
        (items || []).forEach((item: { order_id: string; quantity: number }) => {
          productCountMap.set(item.order_id, (productCountMap.get(item.order_id) || 0) + Number(item.quantity || 0));
        });
      }

      const orders = rows.map(order => ({
        ...order,
        products_count: productCountMap.get(order.id) || 0
      }));
      const totalCount = count || 0;
      const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
      const pageRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const pageProducts = orders.reduce((sum, order) => sum + Number(order.products_count || 0), 0);

      return { orders, totalCount, totalPages, pageRevenue, pageProducts, error: '' };
    }

    return { orders: [], totalCount: 0, totalPages: 1, pageRevenue: 0, pageProducts: 0, error: '' };
  };

  useEffect(() => {
    const token = ++websiteRequestId.current;
    setWebsiteResult(prev => ({ ...prev, loading: true, error: '' }));
    fetchSection('website', websitePage, websiteFilters, token)
      .then(result => {
        if (token !== websiteRequestId.current) return;
        setWebsiteResult({ ...result, loading: false, page: websitePage });
      })
      .catch((err: Error) => {
        if (token !== websiteRequestId.current) return;
        setWebsiteResult(prev => ({ ...prev, loading: false, error: err.message }));
      });
  }, [websitePage, websiteFilters, refreshTick]);

  useEffect(() => {
    const token = ++socialRequestId.current;
    setSocialResult(prev => ({ ...prev, loading: true, error: '' }));
    fetchSection('social', socialPage, socialFilters, token)
      .then(result => {
        if (token !== socialRequestId.current) return;
        setSocialResult({ ...result, loading: false, page: socialPage });
      })
      .catch((err: Error) => {
        if (token !== socialRequestId.current) return;
        setSocialResult(prev => ({ ...prev, loading: false, error: err.message }));
      });
  }, [socialPage, socialFilters, refreshTick]);

  useEffect(() => {
    document.title = 'Orders - Admin';
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dataService.deleteAdminOrder(deleteTarget.id);
      setDeleteTarget(null);
      setRefreshTick(value => value + 1);
      showToast('success', `Order ${deleteTarget.transaction_id} deleted successfully.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Delete failed');
      throw err;
    }
  };

  const renderFilters = (scope: SectionScope) => {
    const filters = scope === 'website' ? websiteFilters : socialFilters;
    const setFilters = scope === 'website' ? setWebsiteFilters : setSocialFilters;
    const setPage = scope === 'website' ? setWebsitePage : setSocialPage;
    const isWebsite = scope === 'website';

    const update = (patch: Partial<SectionFilters>) => {
      setPage(1);
      setFilters(prev => ({ ...prev, ...patch }));
    };

    return (
      <details open style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '16px 18px' }}>
        <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Filter size={16} /> Filters & Search</span>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Search In: {isWebsite ? 'Website Orders' : 'Social Media Orders'}</span>
        </summary>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Search</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '12px', background: '#fff' }}>
              <Search size={16} color="#64748b" />
              <input
                value={filters.search}
                onChange={(e) => update({ search: e.target.value })}
                placeholder="Order number, name, phone, transaction ID"
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
              />
            </div>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Status</span>
            <select value={filters.status} onChange={(e) => update({ status: e.target.value })} style={{ padding: '11px 12px', border: '1px solid var(--color-border)', borderRadius: '12px', background: '#fff' }}>
              <option value="all">All</option>
              {orderStatusOptions.map(status => <option key={status} value={status}>{formatOrderStatus(status)}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Payment Status</span>
            <select value={filters.paymentStatus} onChange={(e) => update({ paymentStatus: e.target.value })} style={{ padding: '11px 12px', border: '1px solid var(--color-border)', borderRadius: '12px', background: '#fff' }}>
              <option value="all">All</option>
              {paymentStatusOptions.map(status => <option key={status} value={status}>{formatPaymentStatus(status)}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Date Range</span>
            <select value={filters.dateRange} onChange={(e) => update({ dateRange: e.target.value })} style={{ padding: '11px 12px', border: '1px solid var(--color-border)', borderRadius: '12px', background: '#fff' }}>
              {dateRangeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          {isWebsite ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Payment Method</span>
              <select value={filters.paymentMethod} onChange={(e) => update({ paymentMethod: e.target.value })} style={{ padding: '11px 12px', border: '1px solid var(--color-border)', borderRadius: '12px', background: '#fff' }}>
                <option value="all">All</option>
                {paymentMethodOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Order Source</span>
              <select value={filters.source} onChange={(e) => update({ source: e.target.value })} style={{ padding: '11px 12px', border: '1px solid var(--color-border)', borderRadius: '12px', background: '#fff' }}>
                <option value="all">All</option>
                {socialOrderSources.map(source => <option key={source} value={source}>{source}</option>)}
              </select>
            </label>
          )}
        </div>
      </details>
    );
  };

  const renderTable = (result: SectionResult) => (
    <>
      <div className="orders-table" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '18px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'linear-gradient(135deg, #f8fafc, #eef6f2)' }}>
            <tr>
              {['Order Number', 'Customer', 'Phone', 'Order Source', 'Products', 'Order Total', 'Payment Status', 'Order Status', 'Created Date', 'Actions'].map(label => (
                <th key={label} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.orders.map(order => (
              <tr key={order.id} style={{ borderTop: '1px solid #eef2f7' }}>
                <td style={{ padding: '15px 16px', fontWeight: 800, color: 'var(--color-forest-dark)' }}>#{order.transaction_id}</td>
                <td style={{ padding: '15px 16px' }}>{order.customer_name}</td>
                <td style={{ padding: '15px 16px' }}>{order.phone}</td>
                <td style={{ padding: '15px 16px' }}><span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800, ...getSourceBadge(formatOrderSource(order.order_source)) }}>{formatOrderSource(order.order_source)}</span></td>
                <td style={{ padding: '15px 16px', fontWeight: 700 }}>{order.products_count || 0}</td>
                <td style={{ padding: '15px 16px', fontWeight: 800, color: 'var(--color-mangrove)' }}>{formatCurrency(Number(order.total || 0))}</td>
                <td style={{ padding: '15px 16px' }}><span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800, ...getStatusTone(order.payment_status) }}>{formatPaymentStatus(order.payment_status)}</span></td>
                <td style={{ padding: '15px 16px' }}><span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800, ...getStatusTone(order.order_status) }}>{formatOrderStatus(order.order_status)}</span></td>
                <td style={{ padding: '15px 16px', color: '#475569' }}>{formatDate(order.created_at)}</td>
                <td style={{ padding: '15px 16px' }}><OrderActions orderId={order.id} onDelete={() => setDeleteTarget(order)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="orders-cards" style={{ display: 'none', gap: '14px' }}>
        {result.orders.map(order => (
          <div key={order.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '16px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
              <div>
                <div style={{ fontWeight: 900, color: 'var(--color-forest-dark)', marginBottom: '4px' }}>#{order.transaction_id}</div>
                <div style={{ color: '#475569', fontSize: '0.92rem' }}>{order.customer_name}</div>
                <div style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '2px' }}>{order.phone}</div>
              </div>
              <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800, ...getSourceBadge(formatOrderSource(order.order_source)) }}>{formatOrderSource(order.order_source)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginTop: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Products</div>
                <div style={{ fontWeight: 800 }}>{order.products_count || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Total</div>
                <div style={{ fontWeight: 800, color: 'var(--color-mangrove)' }}>{formatCurrency(Number(order.total || 0))}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Payment</div>
                <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, ...getStatusTone(order.payment_status) }}>{formatPaymentStatus(order.payment_status)}</span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Status</div>
                <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, ...getStatusTone(order.order_status) }}>{formatOrderStatus(order.order_status)}</span>
              </div>
            </div>
            <div style={{ marginTop: '14px', color: '#64748b', fontSize: '0.86rem' }}>{formatDate(order.created_at)}</div>
            <div style={{ marginTop: '14px' }}><OrderActions orderId={order.id} onDelete={() => setDeleteTarget(order)} /></div>
          </div>
        ))}
      </div>
    </>
  );

  const renderSection = (scope: SectionScope, title: string, subtitle: string, icon: React.ReactNode, result: SectionResult, onPageChange: (page: number) => void, onCreateClick?: () => void) => {
    const isWebsite = scope === 'website';
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', alignItems: 'end' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(44,133,90,0.1)', color: 'var(--color-mangrove)', padding: '6px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '10px' }}>{icon} {isWebsite ? 'Website Orders' : 'Social Media Orders'}</div>
            <h2 style={{ margin: 0, color: 'var(--color-forest-dark)', fontSize: '1.6rem' }}>{title}</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', lineHeight: 1.6 }}>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {onCreateClick && (
              <button onClick={onCreateClick} className="btn" style={{ background: 'var(--color-mangrove)', color: '#fff', borderRadius: '999px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={16} /> Create Manual Order
              </button>
            )}
            <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline" style={{ borderRadius: '999px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <SectionStatCard label="Matching Orders" value={String(result.totalCount)} icon={<BadgeAlert size={18} />} />
          <SectionStatCard label="Page Revenue" value={formatCurrency(result.pageRevenue)} icon={<ReceiptText size={18} />} />
          <SectionStatCard label="Products Count" value={String(result.pageProducts)} icon={<Package size={18} />} />
          <SectionStatCard label="Current Page" value={`${result.page}/${result.totalPages}`} icon={<CalendarDays size={18} />} />
        </div>

        {renderFilters(scope)}

        {result.loading ? (
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '24px' }}>Loading orders...</div>
        ) : result.error ? (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', borderRadius: '18px', padding: '18px' }}>{result.error}</div>
        ) : result.orders.length === 0 ? (
          <EmptyState title="No orders found" message={`No ${isWebsite ? 'website' : 'social media'} orders match the current filters.`} />
        ) : (
          <>
            {renderTable(result)}
            <PaginationBar page={result.page} totalPages={result.totalPages} onPageChange={onPageChange} />
          </>
        )}
      </section>
    );
  };

  return (
    <>
      <Helmet>
        <title>Orders - Admin</title>
      </Helmet>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef7f2 100%)', padding: '28px 18px 48px' }}>
        <style>{`
          @media (max-width: 980px) {
            .orders-table { display: none !important; }
            .orders-cards { display: grid !important; }
          }
          @media (min-width: 981px) {
            .orders-cards { display: none !important; }
          }
        `}</style>
        <div className="container" style={{ maxWidth: '1500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(44,133,90,0.1)', color: 'var(--color-mangrove)', padding: '6px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '12px' }}>
                <Truck size={14} /> Order Management
              </div>
              <h1 style={{ margin: 0, color: 'var(--color-forest-dark)', fontSize: '2rem' }}>📦 অর্ডার সমূহ</h1>
              <p style={{ margin: '8px 0 0', color: '#64748b', maxWidth: '920px', lineHeight: 1.6 }}>Separate website orders from social media orders, keep the source immutable for website checkout, and use clean view/edit/delete workflows for every order.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/admin/dashboard?tab=manual-orders')} className="btn btn-outline" style={{ borderRadius: '999px', padding: '11px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={16} /> Open Manual Builder
              </button>
              <button onClick={() => navigate('/admin/dashboard')} className="btn" style={{ background: 'var(--color-mangrove)', color: '#fff', borderRadius: '999px', padding: '11px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <LayoutDashboard size={16} /> Dashboard
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '28px' }}>
            {renderSection('website', '🌐 Website Orders', 'Orders created automatically by the checkout flow. Source is read-only and fixed to Website.', <Globe2 size={15} />, websiteResult, setWebsitePage)}
            {renderSection('social', '📱 Social Media Orders', 'Manual orders from Facebook, Instagram, TikTok, WhatsApp, Messenger, Phone Call, Walk-in Customer, or Other.', <MessageSquare size={15} />, socialResult, setSocialPage, () => navigate('/admin/dashboard?tab=manual-orders'))}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <AdminDeleteDialog
          open={!!deleteTarget}
          onCancel={() => { setDeleteTarget(null); }}
          onConfirm={handleDelete}
          description={`You are about to delete order #${deleteTarget.transaction_id}. Related order items, payments, and history will be removed by database cascade rules.`}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', right: '18px', bottom: '18px', zIndex: 1250, background: toast.tone === 'success' ? '#ecfdf5' : '#fff1f2', color: toast.tone === 'success' ? '#166534' : '#9f1239', border: `1px solid ${toast.tone === 'success' ? '#bbf7d0' : '#fecdd3'}`, padding: '14px 16px', borderRadius: '14px', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)', maxWidth: '320px' }}>
          {toast.message}
        </div>
      )}
    </>
  );
};
