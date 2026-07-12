import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabase/supabase';
import { dataService } from '../services/dataService';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  MessageSquarePlus,
  Phone,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  UserCircle2,
  Users,
  Wallet,
  X,
  ArrowRight,
  Route,
  BadgeAlert
} from 'lucide-react';

type SortKey = 'most_orders' | 'highest_spending' | 'recently_registered' | 'last_order' | 'alphabetical';
type FilterKey = 'all' | 'new' | 'returning' | 'vip' | 'pending_orders' | 'due_payments';
type DateKey = 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year' | 'custom';
type DetailTab = 'summary' | 'orders' | 'insights';

interface CustomerProfileRow {
  id: string;
  full_name: string;
  phone: string;
  created_at?: string;
}

interface AddressRow {
  id: string;
  customer_id: string;
  address_line: string;
  city: string;
  district: string;
  is_default: boolean;
  created_at: string;
}

interface OrderRow {
  id: string;
  transaction_id: string;
  customer_id?: string | null;
  customer_name: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  total: number;
  subtotal: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  payment_method: string;
  due_amount?: number | null;
  advance_paid_amount?: number | null;
  total_paid_amount?: number | null;
  courier_name?: string | null;
  courier_tracking_number?: string | null;
  order_items?: Array<{ products?: { id: string; title: string; category?: string; subcategory?: string }; quantity: number; price_num: number }>;
  payments?: Array<{ payment_method: string; transaction_id: string; amount: number; status: string; payment_date: string; rejection_reason?: string | null; screenshot_url?: string | null }>;
}

interface CustomerSummary {
  key: string;
  id: string | null;
  fullName: string;
  phone: string;
  email: string;
  avatar: string;
  registrationDate: string;
  lastOrderDate: string;
  lastActiveDate: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  activeStatus: 'active' | 'inactive';
  badge: 'New Customer' | 'Returning Customer' | 'VIP Customer' | 'Inactive Customer';
  isVip: boolean;
  isInactive: boolean;
  hasDuePayments: boolean;
  hasPendingOrders: boolean;
  orderIds: string[];
  transactionIds: string[];
  address: string;
  notes: string;
  source: 'registered' | 'guest';
  paymentMethods: string[];
  courierNames: string[];
  statusCounts: Record<string, number>;
  firstSeenAt: string;
}

interface CustomerInsightBundle {
  lifetimeSpending: number;
  averagePurchaseValue: number;
  mostPurchasedCategory: string;
  mostPurchasedProduct: string;
  preferredPaymentMethod: string;
  preferredCourier: string;
  orderFrequency: string;
  lastActiveDate: string;
  categoryCounts: Array<{ label: string; value: number }>;
  productCounts: Array<{ label: string; value: number }>;
}

const money = (value: number) => `৳${Math.round(value).toLocaleString('bn-BD')}`;
const compact = (value: number) => value.toLocaleString('bn-BD');
const normalize = (value: string | null | undefined) => (value || '').trim().toLowerCase();

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const statusColors: Record<string, { bg: string; fg: string }> = {
  'Order Placed': { bg: '#e3f2fd', fg: '#1565c0' },
  'Payment Confirmed': { bg: '#e0f2f1', fg: '#00796b' },
  'Order Packing': { bg: '#fff3e0', fg: '#ef6c00' },
  'Order Shipping': { bg: '#f3e5f5', fg: '#6a1b9a' },
  'Order Delivered': { bg: '#e8f5e9', fg: '#2e7d32' },
  'Order Cancelled': { bg: '#ffebee', fg: '#c62828' },
  'Refunded': { bg: '#eceff1', fg: '#546e7a' }
};

const scoreBadge = (score: number, totalOrders: number, isVip: boolean, isInactive: boolean): CustomerSummary['badge'] => {
  if (isInactive) return 'Inactive Customer';
  if (isVip) return 'VIP Customer';
  if (totalOrders <= 1 || score < 12000) return 'New Customer';
  return 'Returning Customer';
};

export const AdminCustomers: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [detailOrders, setDetailOrders] = useState<OrderRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('summary');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortKey, setSortKey] = useState<SortKey>('highest_spending');
  const [dateKey, setDateKey] = useState<DateKey>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [editing, setEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [profileDraft, setProfileDraft] = useState({ fullName: '', phone: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [customerRes, orderRes, addressRes] = await Promise.all([
        supabase.from('customers').select('id, full_name, phone, created_at').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, transaction_id, customer_id, customer_name, phone, email, address, city, total, subtotal, payment_status, order_status, created_at, payment_method, due_amount, advance_paid_amount, total_paid_amount, courier_name, courier_tracking_number').order('created_at', { ascending: false }),
        supabase.from('addresses').select('id, customer_id, address_line, city, district, is_default, created_at').order('created_at', { ascending: false })
      ]);

      if (customerRes.error) throw customerRes.error;
      if (orderRes.error) throw orderRes.error;
      if (addressRes.error) throw addressRes.error;

      const customerRows = (customerRes.data || []) as CustomerProfileRow[];
      const orderRows = (orderRes.data || []) as OrderRow[];
      const addressRows = (addressRes.data || []) as AddressRow[];

      const byId = new Map<string, CustomerProfileRow>();
      const byPhone = new Map<string, CustomerProfileRow>();
      customerRows.forEach(row => {
        byId.set(row.id, row);
        const phoneKey = normalize(row.phone);
        if (phoneKey) byPhone.set(phoneKey, row);
      });

      const buckets = new Map<string, CustomerSummary & { firstSeenDate: Date; lastOrderDateObj: Date; lastActiveDateObj: Date }>();

      const upsertBucket = (key: string, seed: Partial<CustomerSummary> & { firstSeenDate?: Date; lastOrderDateObj?: Date; lastActiveDateObj?: Date }) => {
        const base: CustomerSummary & { firstSeenDate: Date; lastOrderDateObj: Date; lastActiveDateObj: Date } = buckets.get(key) || {
          key,
          id: seed.id ?? null,
          fullName: seed.fullName || 'Guest Customer',
          phone: seed.phone || '',
          email: seed.email || '',
          avatar: (seed.fullName || 'G').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase(),
          registrationDate: seed.registrationDate || new Date().toISOString(),
          lastOrderDate: seed.lastOrderDate || '',
          lastActiveDate: seed.lastActiveDate || '',
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          activeStatus: 'active',
          badge: 'New Customer',
          isVip: false,
          isInactive: false,
          hasDuePayments: false,
          hasPendingOrders: false,
          orderIds: [],
          transactionIds: [],
          address: seed.address || '',
          notes: seed.notes || '',
          source: seed.source || 'guest',
          paymentMethods: [],
          courierNames: [],
          statusCounts: {},
          firstSeenAt: seed.firstSeenAt || new Date().toISOString(),
          firstSeenDate: seed.firstSeenDate || new Date(),
          lastOrderDateObj: seed.lastOrderDateObj || new Date(0),
          lastActiveDateObj: seed.lastActiveDateObj || new Date(0)
        };

        if (seed.id !== undefined) base.id = seed.id ?? null;
        if (seed.fullName) base.fullName = seed.fullName;
        if (seed.phone) base.phone = seed.phone;
        if (seed.email) base.email = seed.email;
        if (seed.address) base.address = seed.address;
        if (seed.notes !== undefined) base.notes = seed.notes;
        if (seed.source) base.source = seed.source;
        if (seed.firstSeenDate) base.firstSeenDate = seed.firstSeenDate;
        if (seed.lastOrderDateObj) base.lastOrderDateObj = seed.lastOrderDateObj;
        if (seed.lastActiveDateObj) base.lastActiveDateObj = seed.lastActiveDateObj;

        buckets.set(key, base);
        return base;
      };

      orderRows.forEach(order => {
        const candidateProfile = order.customer_id ? byId.get(order.customer_id) : undefined;
        const candidatePhone = byPhone.get(normalize(order.phone));
        const profile = candidateProfile || candidatePhone || null;
        const key = profile ? profile.id : `guest:${normalize(order.phone) || normalize(order.email) || order.transaction_id}`;

        const bucket = upsertBucket(key, {
          id: profile?.id || null,
          fullName: profile?.full_name || order.customer_name || 'Guest Customer',
          phone: profile?.phone || order.phone || '',
          email: order.email || '',
          registrationDate: profile?.created_at || order.created_at,
          firstSeenAt: profile?.created_at || order.created_at,
          firstSeenDate: new Date(profile?.created_at || order.created_at),
          lastOrderDateObj: new Date(order.created_at),
          lastActiveDateObj: new Date(order.created_at),
          source: profile ? 'registered' : 'guest'
        });

        bucket.totalOrders += 1;
        bucket.totalSpent += Number(order.total || 0);
        bucket.averageOrderValue = bucket.totalSpent / bucket.totalOrders;
        bucket.orderIds.push(order.id);
        bucket.transactionIds.push(order.transaction_id);
        bucket.lastOrderDateObj = new Date(order.created_at);
        bucket.lastOrderDate = bucket.lastOrderDateObj.toISOString();
        bucket.lastActiveDateObj = new Date(order.created_at);
        bucket.lastActiveDate = bucket.lastActiveDateObj.toISOString();
        bucket.paymentMethods = Array.from(new Set([...bucket.paymentMethods, order.payment_method].filter(Boolean)));
        if (order.courier_name) bucket.courierNames = Array.from(new Set([...bucket.courierNames, order.courier_name].filter(Boolean)));
        const normalizedStatus = dataService.normalizeOrderStatus(order.order_status);
        bucket.statusCounts[normalizedStatus] = (bucket.statusCounts[normalizedStatus] || 0) + 1;
        bucket.hasDuePayments = bucket.hasDuePayments || Number(order.due_amount || 0) > 0;
        bucket.hasPendingOrders = bucket.hasPendingOrders || ['pending', 'pending_payment', 'payment_submitted', 'payment_verification', 'payment_rejected', 'under_review'].includes(order.payment_status) || ['pending', 'pending_payment', 'payment_submitted', 'payment_verification', 'correction_requested'].includes(order.order_status);
        if (['Order Delivered'].includes(normalizedStatus)) bucket.deliveredOrders += 1;
        if (['Order Cancelled'].includes(normalizedStatus)) bucket.cancelledOrders += 1;
        if (['Order Placed', 'Payment Confirmed', 'Order Packing', 'Order Shipping'].includes(normalizedStatus)) bucket.pendingOrders += 1;
        if (['Order Delivered'].includes(normalizedStatus) || order.payment_status === 'paid') bucket.completedOrders += 1;
        if (!bucket.firstSeenDate || new Date(order.created_at) < bucket.firstSeenDate) bucket.firstSeenDate = new Date(order.created_at);
        if (!bucket.registrationDate || new Date(order.created_at) < new Date(bucket.registrationDate)) bucket.registrationDate = order.created_at;
      });

      addressRows.forEach(addr => {
        const bucket = addr.customer_id ? buckets.get(addr.customer_id) : undefined;
        if (bucket) {
          const display = `${addr.address_line}, ${addr.district}, ${addr.city}`;
          if (!bucket.address || addr.is_default) bucket.address = display;
        }
      });

      customerRows.forEach(row => {
        if (!buckets.has(row.id)) {
          const created = row.created_at ? new Date(row.created_at) : new Date();
          buckets.set(row.id, {
            key: row.id,
            id: row.id,
            fullName: row.full_name,
            phone: row.phone,
            email: '',
            avatar: row.full_name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase(),
            registrationDate: row.created_at || new Date().toISOString(),
            lastOrderDate: row.created_at || new Date().toISOString(),
            lastActiveDate: row.created_at || new Date().toISOString(),
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            pendingOrders: 0,
            deliveredOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            activeStatus: 'inactive',
            badge: 'Inactive Customer',
            isVip: false,
            isInactive: true,
            hasDuePayments: false,
            hasPendingOrders: false,
            orderIds: [],
            transactionIds: [],
            address: '',
            notes: localStorage.getItem(`customer_note_${row.id}`) || '',
            source: 'registered',
            paymentMethods: [],
            courierNames: [],
            statusCounts: {},
            firstSeenAt: row.created_at || new Date().toISOString(),
            firstSeenDate: created,
            lastOrderDateObj: created,
            lastActiveDateObj: created
          });
        }
      });

      const decorated = Array.from(buckets.values()).map(bucket => {
        const firstSeen = bucket.firstSeenDate || new Date(bucket.registrationDate || bucket.lastOrderDate || new Date().toISOString());
        const lastSeen = bucket.lastOrderDateObj || new Date(bucket.lastOrderDate || bucket.registrationDate || new Date().toISOString());
        const isVip = bucket.totalSpent >= 25000 || bucket.totalOrders >= 8;
        const inactive = bucket.totalOrders > 0 ? (Date.now() - lastSeen.getTime()) > 1000 * 60 * 60 * 24 * 90 : true;
        const badge = scoreBadge(bucket.totalSpent, bucket.totalOrders, isVip, inactive);
        const avatar = bucket.fullName
          .split(' ')
          .filter(Boolean)
          .map(part => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'G';
        return {
          ...bucket,
          avatar,
          isVip,
          isInactive: inactive,
          activeStatus: inactive ? 'inactive' : 'active',
          badge,
          registrationDate: firstSeen.toISOString(),
          lastOrderDate: (bucket.totalOrders > 0 ? lastSeen : firstSeen).toISOString(),
          lastActiveDate: lastSeen.toISOString(),
          averageOrderValue: bucket.totalOrders ? bucket.totalSpent / bucket.totalOrders : 0
        } satisfies CustomerSummary;
      });

      setCustomers(decorated.sort((a, b) => b.totalSpent - a.totalSpent));
      if (!selectedKey && decorated[0]) setSelectedKey(decorated[0].key);
    } catch (error) {
      console.error('Failed to load customer CRM data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('admin-customers-crm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'addresses' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const currentDateBounds = useMemo(() => {
    const now = new Date();
    switch (dateKey) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday': return { start: startOfDay(addDays(now, -1)), end: endOfDay(addDays(now, -1)) };
      case 'last_7_days': return { start: startOfDay(addDays(now, -6)), end: endOfDay(now) };
      case 'last_30_days': return { start: startOfDay(addDays(now, -29)), end: endOfDay(now) };
      case 'this_month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
      case 'last_month': {
        const prevLast = addDays(new Date(now.getFullYear(), now.getMonth(), 1), -1);
        return { start: new Date(prevLast.getFullYear(), prevLast.getMonth(), 1), end: endOfDay(prevLast) };
      }
      case 'this_year': return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
      case 'custom': return {
        start: customStart ? startOfDay(new Date(customStart)) : startOfDay(addDays(now, -29)),
        end: customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now)
      };
      case 'all':
      default:
        return null;
    }
  }, [dateKey, customStart, customEnd]);

  const filteredCustomers = useMemo(() => {
    const q = normalize(search);
    const data = customers.filter(customer => {
      const createdAt = new Date(customer.registrationDate);
      const lastOrderAt = new Date(customer.lastOrderDate);
      const inRange = !currentDateBounds || ((createdAt >= currentDateBounds.start && createdAt <= currentDateBounds.end) || (lastOrderAt >= currentDateBounds.start && lastOrderAt <= currentDateBounds.end));
      if (!inRange) return false;

      const matchesSearch = !q || [customer.fullName, customer.phone, customer.email, ...customer.transactionIds].some(value => normalize(String(value)).includes(q));
      if (!matchesSearch) return false;

      switch (filter) {
        case 'new': return customer.badge === 'New Customer';
        case 'returning': return customer.badge === 'Returning Customer';
        case 'vip': return customer.badge === 'VIP Customer';
        case 'pending_orders': return customer.hasPendingOrders;
        case 'due_payments': return customer.hasDuePayments;
        case 'all':
        default: return true;
      }
    });

    data.sort((a, b) => {
      switch (sortKey) {
        case 'most_orders': return b.totalOrders - a.totalOrders;
        case 'highest_spending': return b.totalSpent - a.totalSpent;
        case 'recently_registered': return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
        case 'last_order': return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        case 'alphabetical':
        default: return a.fullName.localeCompare(b.fullName);
      }
    });

    return data;
  }, [customers, search, filter, sortKey, currentDateBounds]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, sortKey, dateKey, customStart, customEnd]);

  useEffect(() => {
    if (!selectedKey && filteredCustomers[0]) setSelectedKey(filteredCustomers[0].key);
    if (selectedKey && !filteredCustomers.find(customer => customer.key === selectedKey) && filteredCustomers[0]) {
      setSelectedKey(filteredCustomers[0].key);
    }
  }, [filteredCustomers, selectedKey]);

  const selectedCustomer = filteredCustomers.find(customer => customer.key === selectedKey) || null;
  const visibleCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));

  useEffect(() => {
    const run = async () => {
      if (!selectedCustomer) {
        setDetailOrders([]);
        return;
      }
      setDetailLoading(true);
      setEditing(false);
      setNoteDraft(selectedCustomer.notes || '');
      setProfileDraft({ fullName: selectedCustomer.fullName, phone: selectedCustomer.phone });
      try {
        const ids = selectedCustomer.orderIds.slice(0, 300);
        if (ids.length === 0) {
          setDetailOrders([]);
          return;
        }
        const { data, error } = await supabase
          .from('orders')
          .select('id, transaction_id, customer_id, customer_name, phone, email, address, city, total, subtotal, payment_status, order_status, created_at, payment_method, due_amount, advance_paid_amount, total_paid_amount, courier_name, courier_tracking_number, order_items(*, products(*)), payments(*)')
          .in('id', ids)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setDetailOrders((data || []) as OrderRow[]);
      } catch (error) {
        console.error('Failed to load customer detail orders:', error);
        setDetailOrders([]);
      } finally {
        setDetailLoading(false);
      }
    };

    run();
  }, [selectedCustomer?.key]);

  const detailInsights = useMemo<CustomerInsightBundle>(() => {
    const ordersForCustomer = detailOrders;
    const totalOrders = ordersForCustomer.length;
    const lifetimeSpending = ordersForCustomer.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const averagePurchaseValue = totalOrders ? lifetimeSpending / totalOrders : 0;
    const lastActiveDate = ordersForCustomer[0]?.created_at || selectedCustomer?.lastActiveDate || selectedCustomer?.registrationDate || '';

    const categoryCountsMap = new Map<string, number>();
    const productCountsMap = new Map<string, number>();
    const paymentCountsMap = new Map<string, number>();
    const courierCountsMap = new Map<string, number>();

    ordersForCustomer.forEach(order => {
      paymentCountsMap.set(order.payment_method, (paymentCountsMap.get(order.payment_method) || 0) + 1);
      if (order.courier_name) courierCountsMap.set(order.courier_name, (courierCountsMap.get(order.courier_name) || 0) + 1);
      (order.order_items || []).forEach(item => {
        const category = item.products?.category || item.products?.subcategory || 'Uncategorized';
        const product = item.products?.title || item.products?.id || 'Unknown Product';
        categoryCountsMap.set(category, (categoryCountsMap.get(category) || 0) + Number(item.quantity || 0));
        productCountsMap.set(product, (productCountsMap.get(product) || 0) + Number(item.quantity || 0));
      });
    });

    const mostPurchasedCategory = Array.from(categoryCountsMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const mostPurchasedProduct = Array.from(productCountsMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const preferredPaymentMethod = Array.from(paymentCountsMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const preferredCourier = Array.from(courierCountsMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const orderFrequency = totalOrders ? `${(totalOrders / Math.max(1, Math.ceil((Date.now() - new Date(selectedCustomer?.registrationDate || lastActiveDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30)))).toFixed(1)} orders / month` : '0 orders / month';

    return {
      lifetimeSpending,
      averagePurchaseValue,
      mostPurchasedCategory,
      mostPurchasedProduct,
      preferredPaymentMethod,
      preferredCourier,
      orderFrequency,
      lastActiveDate,
      categoryCounts: Array.from(categoryCountsMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      productCounts: Array.from(productCountsMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    };
  }, [detailOrders, selectedCustomer]);

  const stats = useMemo(() => {
    const monthStart = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const newThisMonth = customers.filter(customer => new Date(customer.registrationDate) >= monthStart).length;
    const vipCustomers = customers.filter(customer => customer.isVip).length;
    const returningCustomers = customers.filter(customer => customer.totalOrders > 1).length;
    const pendingOrders = customers.filter(customer => customer.hasPendingOrders).length;
    const duePayments = customers.filter(customer => customer.hasDuePayments).length;
    const averageSpending = customers.length ? customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / customers.length : 0;
    const highestSpender = customers[0];

    return {
      totalCustomers: customers.length,
      newThisMonth,
      vipCustomers,
      returningCustomers,
      pendingOrders,
      duePayments,
      averageSpending,
      highestSpender
    };
  }, [customers, filteredCustomers]);

  const openCustomerOrders = () => setDetailTab('orders');

  const copyPhone = async () => {
    if (!selectedCustomer?.phone) return;
    await navigator.clipboard.writeText(selectedCustomer.phone);
  };

  const sendWhatsApp = () => {
    if (!selectedCustomer?.phone) return;
    const phone = selectedCustomer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  };

  const callCustomer = () => {
    if (!selectedCustomer?.phone) return;
    window.location.href = `tel:${selectedCustomer.phone}`;
  };

  const updateNotes = async () => {
    if (!selectedCustomer?.id) return;
    localStorage.setItem(`customer_note_${selectedCustomer.id}`, noteDraft.trim());
    await loadData();
  };

  const saveCustomerProfile = async () => {
    if (!selectedCustomer?.id) return;
    const { error } = await supabase.from('customers').update({
      full_name: profileDraft.fullName.trim(),
      phone: profileDraft.phone.trim()
    }).eq('id', selectedCustomer.id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadData();
    setEditing(false);
  };

  const exportSelectedCustomer = () => {
    if (!selectedCustomer) return;
    const payload = {
      customer: selectedCustomer,
      insights: detailInsights,
      orders: detailOrders
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customer-${selectedCustomer.phone || selectedCustomer.fullName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, #f4f7f4 0%, #eef3ef 100%)', minHeight: '100vh', padding: '24px' }}>
      <Helmet>
        <title>Customer Management - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div style={{ display: 'grid', gap: '18px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #123024, #1f5a43)',
          color: '#fff',
          borderRadius: '24px',
          padding: '26px',
          boxShadow: '0 18px 40px rgba(18,48,36,0.16)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', padding: '7px 12px', marginBottom: '12px' }}><Sparkles size={14} /> Customer CRM</div>
              <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.1 }}>Customer Management</h1>
              <p style={{ margin: '10px 0 0 0', maxWidth: '820px', color: 'rgba(255,255,255,0.86)' }}>
                Search, segment, and act on every customer from one Shopify-style CRM surface.
              </p>
            </div>
            <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.28)', borderRadius: '999px', padding: '11px 16px' }}>
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
          </div>
        </div>

        <div style={{
          position: 'sticky', top: '12px', zIndex: 12, backdropFilter: 'blur(16px)',
          background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(209,220,212,0.9)',
          borderRadius: '22px', padding: '16px', boxShadow: '0 10px 24px rgba(18,48,36,0.06)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr repeat(4, minmax(0, 1fr))', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email, or order number" style={{ width: '100%', padding: '12px 14px 12px 38px', border: '1px solid var(--color-border)', borderRadius: '14px', background: '#fff' }} />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value as FilterKey)} style={{ padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--color-border)', background: '#fff' }}>
              <option value="all">All Customers</option>
              <option value="new">New Customers</option>
              <option value="returning">Returning Customers</option>
              <option value="vip">VIP Customers</option>
              <option value="pending_orders">Pending Orders</option>
              <option value="due_payments">Due Payments</option>
            </select>
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} style={{ padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--color-border)', background: '#fff' }}>
              <option value="highest_spending">Highest Spending</option>
              <option value="most_orders">Most Orders</option>
              <option value="recently_registered">Recently Registered</option>
              <option value="last_order">Last Order</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
            <select value={dateKey} onChange={e => setDateKey(e.target.value as DateKey)} style={{ padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--color-border)', background: '#fff' }}>
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <button onClick={() => setPage(1)} className="btn btn-primary" style={{ borderRadius: '14px', padding: '12px 14px' }}><Filter size={16} /> Apply</button>
          </div>
          {dateKey === 'custom' && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--color-border)' }} />
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--color-border)' }} />
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {Array.from({ length: 8 }).map((_, index) => <div key={index} style={{ height: '110px', borderRadius: '20px', background: '#fff', border: '1px solid var(--color-border)', opacity: 0.75 }} />)}
            </div>
            <div style={{ height: '640px', borderRadius: '24px', background: '#fff', border: '1px solid var(--color-border)', opacity: 0.78 }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Total Customers', value: stats.totalCustomers, icon: <Users size={18} />, tone: '#1e88e5' },
                { label: 'New This Month', value: stats.newThisMonth, icon: <CalendarDays size={18} />, tone: '#7c3aed' },
                { label: 'Returning', value: stats.returningCustomers, icon: <ArrowRight size={18} />, tone: '#14b8a6' },
                { label: 'VIP Customers', value: stats.vipCustomers, icon: <Star size={18} />, tone: '#d97706' },
                { label: 'Pending Orders', value: stats.pendingOrders, icon: <BadgeAlert size={18} />, tone: '#f59e0b' },
                { label: 'Due Payments', value: stats.duePayments, icon: <Wallet size={18} />, tone: '#c026d3' },
                { label: 'Avg Spending', value: stats.averageSpending, icon: <TrendingUp size={18} />, tone: '#2e7d32', money: true },
                { label: 'Highest Spender', value: stats.highestSpender?.totalSpent || 0, icon: <UserCircle2 size={18} />, tone: '#0f766e', money: true, subtitle: stats.highestSpender?.fullName || 'N/A' }
              ].map(card => (
                <button key={card.label} type="button" onClick={() => card.label.includes('Pending') ? setFilter('pending_orders') : card.label.includes('Due') ? setFilter('due_payments') : setFilter('all')} style={{
                  textAlign: 'left', border: 'none', borderRadius: '20px', padding: '18px', background: 'linear-gradient(135deg, #fff, #f7faf8)', boxShadow: '0 12px 26px rgba(18,48,36,0.06)', cursor: 'pointer', borderTop: `4px solid ${card.tone}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'gray', fontWeight: 700 }}>{card.label}</span>
                    <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: `${card.tone}18`, color: card.tone, display: 'grid', placeItems: 'center' }}>{card.icon}</div>
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--color-forest-dark)', marginTop: '12px' }}>{card.money ? money(card.value as number) : compact(card.value as number)}</div>
                  {card.subtitle && <div style={{ marginTop: '4px', color: 'gray', fontSize: '0.82rem' }}>{card.subtitle}</div>}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid var(--color-border)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 14px 32px rgba(18,48,36,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--color-border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,248,0.92))' }}>
                  <div>
                    <h2 style={{ margin: 0, color: 'var(--color-forest-dark)' }}>Customer List</h2>
                    <div style={{ color: 'gray', fontSize: '0.88rem' }}>{filteredCustomers.length} customers match the current filters</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '999px' }} onClick={() => navigate('/admin/dashboard')}><ChevronLeft size={16} /> Dashboard</button>
                    <button className="btn btn-outline" style={{ borderRadius: '999px' }} onClick={() => setFilter('all')}><X size={16} /> Reset</button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                      <tr style={{ color: 'gray', fontSize: '0.82rem', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '14px 20px' }}>Customer</th>
                        <th style={{ padding: '14px 20px' }}>Orders</th>
                        <th style={{ padding: '14px 20px' }}>Spent</th>
                        <th style={{ padding: '14px 20px' }}>Last Order</th>
                        <th style={{ padding: '14px 20px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCustomers.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: '44px 20px', textAlign: 'center', color: 'gray' }}>No customers found for the current filters.</td></tr>
                      ) : visibleCustomers.map(customer => (
                        <tr key={customer.key} onClick={() => setSelectedKey(customer.key)} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: selectedKey === customer.key ? '#f8fbf8' : '#fff' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '16px', background: 'linear-gradient(135deg, #1f5a43, #5cb85c)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900 }}>{customer.avatar}</div>
                              <div>
                                <div style={{ fontWeight: 900, color: 'var(--color-forest-dark)' }}>{customer.fullName}</div>
                                <div style={{ color: 'gray', fontSize: '0.82rem' }}>{customer.phone}{customer.email ? ` • ${customer.email}` : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 800 }}>{customer.totalOrders}</div>
                            <div style={{ color: 'gray', fontSize: '0.82rem' }}>{customer.completedOrders} completed</div>
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 900, color: 'var(--color-mangrove)' }}>{money(customer.totalSpent)}</td>
                          <td style={{ padding: '16px 20px' }}>{new Date(customer.lastOrderDate).toLocaleDateString('bn-BD')}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content', padding: '6px 10px', borderRadius: '999px', background: customer.badge === 'VIP Customer' ? '#fff7ed' : customer.badge === 'Inactive Customer' ? '#f1f5f9' : '#eef6ff', color: customer.badge === 'VIP Customer' ? '#c2410c' : customer.badge === 'Inactive Customer' ? '#64748b' : '#1d4ed8', fontSize: '0.78rem', fontWeight: 800 }}>
                                {customer.badge}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content', padding: '6px 10px', borderRadius: '999px', background: customer.isInactive ? '#f1f5f9' : customer.totalOrders > 1 ? '#e0f2f1' : '#ede9fe', color: customer.isInactive ? '#64748b' : customer.totalOrders > 1 ? '#00695c' : '#6d28d9', fontSize: '0.78rem', fontWeight: 800 }}>
                                {customer.activeStatus === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--color-border)', background: '#fff' }}>
                  <div style={{ color: 'gray', fontSize: '0.88rem' }}>Page {page} of {totalPages}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '999px' }} disabled={page <= 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}><ChevronLeft size={16} /></button>
                    <button className="btn btn-outline" style={{ borderRadius: '999px' }} disabled={page >= totalPages} onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>

              <div style={{ position: 'sticky', top: '122px', alignSelf: 'start' }}>
                <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: '24px', border: '1px solid var(--color-border)', boxShadow: '0 14px 32px rgba(18,48,36,0.08)', overflow: 'hidden' }}>
                  {selectedCustomer ? (
                    <>
                      <div style={{ padding: '22px', background: 'linear-gradient(135deg, #123024, #1f5a43)', color: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '1.1rem' }}>{selectedCustomer.avatar}</div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{selectedCustomer.fullName}</h3>
                              <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem' }}>{selectedCustomer.phone}{selectedCustomer.email ? ` • ${selectedCustomer.email}` : ''}</div>
                            </div>
                          </div>
                          <button onClick={() => setEditing(!editing)} className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}><Edit3 size={16} /> Edit Customer</button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                          <span style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', fontSize: '0.78rem', fontWeight: 800 }}>Orders: {selectedCustomer.totalOrders}</span>
                          <span style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', fontSize: '0.78rem', fontWeight: 800 }}>{selectedCustomer.badge}</span>
                        </div>
                      </div>

                      <div style={{ padding: '18px', display: 'grid', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            ['summary', 'Summary'], ['orders', 'Orders'], ['insights', 'Insights']
                          ].map(([key, label]) => (
                            <button key={key} onClick={() => setDetailTab(key as DetailTab)} className="btn btn-outline" style={{ borderRadius: '999px', background: detailTab === key ? 'var(--color-mangrove)' : '#fff', color: detailTab === key ? '#fff' : 'var(--color-forest-dark)' }}>
                              {label}
                            </button>
                          ))}
                        </div>

                        {detailTab === 'summary' && (
                          <>
                            {editing ? (
                              <div style={{ display: 'grid', gap: '12px' }}>
                                <input value={profileDraft.fullName} onChange={e => setProfileDraft(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Full name" style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--color-border)' }} />
                                <input value={profileDraft.phone} onChange={e => setProfileDraft(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone number" style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--color-border)' }} />
                                <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={4} placeholder="Internal note" style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--color-border)', fontFamily: 'inherit' }} />
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                  <button onClick={saveCustomerProfile} className="btn btn-primary">Save Profile</button>
                                  <button onClick={updateNotes} className="btn btn-outline">Save Note</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#f8faf8' }}><strong>Name:</strong> {selectedCustomer.fullName}</div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#f8faf8' }}><strong>Phone:</strong> {selectedCustomer.phone}</div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#f8faf8' }}><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#f8faf8' }}><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#f8faf8' }}><strong>Registration:</strong> {new Date(selectedCustomer.registrationDate).toLocaleString('bn-BD')}</div>
                                <div style={{ padding: '14px', borderRadius: '16px', background: '#f8faf8' }}><strong>Notes:</strong> {selectedCustomer.notes || 'No internal notes yet.'}</div>
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                              {[
                                ['Total Orders', selectedCustomer.totalOrders],
                                ['Completed', selectedCustomer.completedOrders],
                                ['Pending', selectedCustomer.pendingOrders],
                                ['Cancelled', selectedCustomer.cancelledOrders],
                                ['Delivered', selectedCustomer.deliveredOrders],
                                ['Total Spending', selectedCustomer.totalSpent],
                                ['Avg Order Value', selectedCustomer.averageOrderValue],
                                ['Last Purchase', selectedCustomer.lastOrderDate]
                              ].map(([label, value]) => (
                                <div key={String(label)} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '12px' }}>
                                  <div style={{ color: 'gray', fontSize: '0.8rem' }}>{label}</div>
                                  <div style={{ color: 'var(--color-forest-dark)', fontWeight: 900, marginTop: '4px' }}>{typeof value === 'number' ? (String(label).includes('Spending') || String(label).includes('Value') ? money(value) : compact(value)) : new Date(String(value)).toLocaleDateString('bn-BD')}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {detailTab === 'insights' && (
                          <div style={{ display: 'grid', gap: '12px' }}>
                            {[
                              ['Lifetime Spending', money(detailInsights.lifetimeSpending)],
                              ['Average Purchase Value', money(detailInsights.averagePurchaseValue)],
                              ['Most Purchased Category', detailInsights.mostPurchasedCategory],
                              ['Most Purchased Product', detailInsights.mostPurchasedProduct],
                              ['Preferred Payment Method', detailInsights.preferredPaymentMethod],
                              ['Preferred Courier', detailInsights.preferredCourier],
                              ['Order Frequency', detailInsights.orderFrequency],
                              ['Last Active Date', detailInsights.lastActiveDate ? new Date(detailInsights.lastActiveDate).toLocaleString('bn-BD') : 'N/A']
                            ].map(([label, value]) => (
                              <div key={String(label)} style={{ padding: '13px', borderRadius: '16px', background: '#f8faf8', border: '1px solid #e7ece8' }}>
                                <div style={{ color: 'gray', fontSize: '0.8rem' }}>{label}</div>
                                <div style={{ color: 'var(--color-forest-dark)', fontWeight: 900, marginTop: '5px' }}>{String(value)}</div>
                              </div>
                            ))}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px' }}>
                              <button onClick={copyPhone} className="btn btn-outline"><Copy size={15} /> Copy Phone</button>
                              <button onClick={sendWhatsApp} className="btn btn-outline"><MessageSquarePlus size={15} /> WhatsApp</button>
                              <button onClick={callCustomer} className="btn btn-outline"><Phone size={15} /> Call Customer</button>
                              <button onClick={exportSelectedCustomer} className="btn btn-outline"><Download size={15} /> Export Data</button>
                            </div>
                          </div>
                        )}

                        {detailTab === 'orders' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0 }}>Order Timeline</h4>
                              <button onClick={openCustomerOrders} className="btn btn-outline"><ExternalLink size={15} /> View Orders</button>
                            </div>
                            {detailLoading ? (
                              <div style={{ padding: '20px', color: 'gray' }}>Loading customer orders...</div>
                            ) : detailOrders.length === 0 ? (
                              <div style={{ padding: '20px', color: 'gray' }}>No orders found for this customer.</div>
                            ) : detailOrders.map(order => {
                              const status = dataService.normalizeOrderStatus(order.order_status);
                              const tone = statusColors[status] || statusColors['Order Placed'];
                              return (
                                <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: '18px', background: '#fff', padding: '14px', boxShadow: '0 8px 18px rgba(18,48,36,0.05)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <button onClick={() => navigate(`/account/orders/${order.transaction_id}?highlight=1`)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '999px', background: '#eef6ff', color: '#1e40af', fontWeight: 900 }}><Route size={14} /> #{order.transaction_id}</span>
                                    </button>
                                    <span style={{ padding: '7px 10px', borderRadius: '999px', background: tone.bg, color: tone.fg, fontSize: '0.78rem', fontWeight: 800 }}>{status}</span>
                                  </div>
                                  <div style={{ display: 'grid', gap: '8px', fontSize: '0.88rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date</span><strong>{new Date(order.created_at).toLocaleString('bn-BD')}</strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total</span><strong>{money(Number(order.total || 0))}</strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payment</span><strong>{order.payment_status}</strong></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '36px 18px', textAlign: 'center', color: 'gray' }}>
                      <UserCircle2 size={36} style={{ marginBottom: '10px' }} />
                      <div>Select a customer to see details</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
