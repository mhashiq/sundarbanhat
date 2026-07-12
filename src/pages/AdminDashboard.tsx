import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabase';
import { Helmet } from 'react-helmet-async';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  ClipboardList, 
  MessageSquare, 
  LogOut, 
  PlusCircle, 
  Settings,
  Trash2, 
  Edit, 
  FolderPlus, 
  Upload, 
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Package,
  Truck,
  CreditCard,
  Bell,
  CalendarDays,
  Clock3,
  Sparkles,
  BadgeAlert,
  CircleDollarSign,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { dataService, getImageUrl } from '../services/dataService';
import type { Product, Category } from '../services/dataService';

type DashboardRange = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year' | 'custom';

const safeNumber = (value: unknown): number => Number(value || 0);

const formatCurrency = (value: number): string => `৳${Math.round(value).toLocaleString('bn-BD')}`;

const formatCompact = (value: number): string => value.toLocaleString('bn-BD');

const percentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const localDayKey = (date: Date): string => date.toLocaleDateString('en-CA');

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getRangeBounds = (range: DashboardRange, customStart: string, customEnd: string, now: Date) => {
  const today = startOfDay(now);
  const tomorrow = endOfDay(now);

  switch (range) {
    case 'yesterday': {
      const start = startOfDay(addDays(today, -1));
      const end = endOfDay(addDays(today, -1));
      return { start, end };
    }
    case 'last_7_days':
      return { start: startOfDay(addDays(today, -6)), end: tomorrow };
    case 'last_30_days':
      return { start: startOfDay(addDays(today, -29)), end: tomorrow };
    case 'this_month':
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: tomorrow };
    case 'last_month': {
      const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthLastDay = addDays(firstDayCurrentMonth, -1);
      return {
        start: new Date(lastMonthLastDay.getFullYear(), lastMonthLastDay.getMonth(), 1),
        end: endOfDay(lastMonthLastDay)
      };
    }
    case 'this_year':
      return { start: new Date(today.getFullYear(), 0, 1), end: tomorrow };
    case 'custom': {
      const start = customStart ? startOfDay(new Date(customStart)) : startOfDay(addDays(today, -29));
      const end = customEnd ? endOfDay(new Date(customEnd)) : tomorrow;
      return { start, end };
    }
    case 'today':
    default:
      return { start: today, end: tomorrow };
  }
};

const getPreviousBounds = (range: DashboardRange, currentStart: Date, currentEnd: Date) => {
  const durationMs = Math.max(currentEnd.getTime() - currentStart.getTime(), 24 * 60 * 60 * 1000);

  switch (range) {
    case 'yesterday':
      return { start: startOfDay(addDays(currentStart, -1)), end: endOfDay(addDays(currentStart, -1)) };
    case 'last_7_days':
    case 'last_30_days':
    case 'custom':
      return { start: new Date(currentStart.getTime() - durationMs), end: new Date(currentStart.getTime() - 1) };
    case 'this_month': {
      const lastMonthEnd = addDays(new Date(currentStart), -1);
      return { start: new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1), end: endOfDay(lastMonthEnd) };
    }
    case 'last_month': {
      const beforeLastMonthEnd = addDays(currentStart, -1);
      return { start: new Date(beforeLastMonthEnd.getFullYear(), beforeLastMonthEnd.getMonth(), 1), end: endOfDay(beforeLastMonthEnd) };
    }
    case 'this_year':
      return { start: new Date(currentStart.getFullYear() - 1, 0, 1), end: new Date(currentStart.getFullYear() - 1, 11, 31, 23, 59, 59, 999) };
    case 'today':
    default:
      return { start: startOfDay(addDays(currentStart, -1)), end: endOfDay(addDays(currentStart, -1)) };
  }
};

const isWithinBounds = (dateValue: string, start: Date, end: Date): boolean => {
  const time = new Date(dateValue).getTime();
  return time >= start.getTime() && time <= end.getTime();
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'messages' | 'manual-orders' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({ revenue: 0, orderCount: 0, stockOut: 0, unreadMsgs: 0 });

  // Form edit states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form Fields
  const [pId, setPId] = useState('');
  const [pTitle, setPTitle] = useState('');
  const [pSubcategory, setPSubcategory] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pPriceNum, setPPriceNum] = useState(0);
  const [pWeight, setPWeight] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pHarvest, setPHarvest] = useState('');
  const [pStatus, setPStatus] = useState<'in-stock' | 'out-of-stock'>('in-stock');
  const [pStory, setPStory] = useState('');
  const [pBenefits, setPBenefits] = useState<string[]>([]);
  const [pStorage, setPStorage] = useState('');
  const [pImg, setPImg] = useState('');
  const [pStock, setPStock] = useState(10);
  const [pFeatured, setPFeatured] = useState(false);
  
  // File Upload states
  const [uploading, setUploading] = useState(false);
  const [benefitInput, setBenefitInput] = useState('');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  // Selected Order Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Search & Filter states for Orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Shipping and advanced order edit states
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustAddr, setEditCustAddr] = useState('');
  const [editCustCity, setEditCustCity] = useState('');
  const [editOrderSource, setEditOrderSource] = useState('Website');
  const [editAdvancePaid, setEditAdvancePaid] = useState('');
  const [editTotalPaid, setEditTotalPaid] = useState('');
  const [editCourierCollection, setEditCourierCollection] = useState('');
  const [editCourierName, setEditCourierName] = useState('');
  const [editCourierTracking, setEditCourierTracking] = useState('');
  const [editPaymentNotes, setEditPaymentNotes] = useState('');
  const [editInternalNotes, setEditInternalNotes] = useState('');
  const [editPaymentProofImage, setEditPaymentProofImage] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  // Settings Edit states
  const [fbUrl, setFbUrl] = useState('');
  const [instaUrl, setInstaUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [waNum, setWaNum] = useState('');

  // Manual Order Creation states
  const [manualCustName, setManualCustName] = useState('');
  const [manualCustPhone, setManualCustPhone] = useState('');
  const [manualCustEmail, setManualCustEmail] = useState('');
  const [manualCustAddress, setManualCustAddress] = useState('');
  const [manualCustDistrict, setManualCustDistrict] = useState('');
  const [manualCustDivision, setManualCustDivision] = useState('Khulna');
  const [manualCustZip, setManualCustZip] = useState('');
  const [manualOrderNotes, setManualOrderNotes] = useState('');
  
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [selectedManualItems, setSelectedManualItems] = useState<{ product: Product; quantity: number }[]>([]);
  
  const [manualCourierName, setManualCourierName] = useState('');
  const [manualShippingCharge, setManualShippingCharge] = useState(60);
  const [manualTrackingNumber, setManualTrackingNumber] = useState('');
  
  const [manualPaymentMethod, setManualPaymentMethod] = useState('cod');
  const [manualAdvancePaid, setManualAdvancePaid] = useState('');
  const [manualTransactionId, setManualTransactionId] = useState('');
  const [manualPaymentNotes, setManualPaymentNotes] = useState('');
  const [manualOrderSource, setManualOrderSource] = useState('Facebook');
  
  // Rejection state
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Dashboard analytics filter state
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentClock, setCurrentClock] = useState(() => new Date());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'manual-orders' || tab === 'overview' || tab === 'products' || tab === 'categories' || tab === 'orders' || tab === 'messages' || tab === 'settings') {
      setActiveTab(tab as typeof activeTab);
    }
  }, [location.search]);

  // Populate shipping edit fields when selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      setEditCustName(selectedOrder.customer_name || '');
      setEditCustPhone(selectedOrder.phone || '');
      setEditCustAddr(selectedOrder.address || '');
      setEditCustCity(selectedOrder.city || '');
      setEditOrderSource(selectedOrder.order_source || 'Website');
      setEditAdvancePaid(selectedOrder.advance_paid_amount ? String(selectedOrder.advance_paid_amount) : '');
      setEditTotalPaid(selectedOrder.total_paid_amount ? String(selectedOrder.total_paid_amount) : '');
      setEditCourierCollection(selectedOrder.courier_collection_amount ? String(selectedOrder.courier_collection_amount) : '');
      setEditCourierName(selectedOrder.courier_name || '');
      setEditCourierTracking(selectedOrder.courier_tracking_number || '');
      setEditPaymentNotes(selectedOrder.payment_notes || '');
      setEditInternalNotes(selectedOrder.internal_notes || '');
      setEditPaymentProofImage(selectedOrder.payment_proof_image || '');
      setRejectReasonInput('');
    }
  }, [selectedOrder]);

  // Load all dashboard statistics & records on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentClock(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  const dashboardInsights = useMemo(() => {
    const now = currentClock;
    const currentBounds = getRangeBounds(dashboardRange, customStartDate, customEndDate, now);
    const previousBounds = getPreviousBounds(dashboardRange, currentBounds.start, currentBounds.end);

    const allOrders = orders;
    const rangeOrders = allOrders.filter(order => isWithinBounds(order.created_at, currentBounds.start, currentBounds.end));
    const previousOrders = allOrders.filter(order => isWithinBounds(order.created_at, previousBounds.start, previousBounds.end));
    const rangePaidOrders = rangeOrders.filter(order => order.payment_status === 'paid');

    const normalizedOrders = allOrders.map(order => ({
      ...order,
      normalizedStatus: dataService.normalizeOrderStatus(order.order_status),
      isPendingPayment: order.payment_status === 'pending' || order.payment_status === 'failed' || order.payment_status === 'payment_pending',
      isPartiallyPaid: safeNumber(order.advance_paid_amount) > 0 && safeNumber(order.total_paid_amount) < safeNumber(order.total),
      isFullyPaid: order.payment_status === 'paid' || safeNumber(order.total_paid_amount) >= safeNumber(order.total)
    }));

    const normalizedRangeOrders = normalizedOrders.filter(order => isWithinBounds(order.created_at, currentBounds.start, currentBounds.end));
    const statusOrder = ['Order Placed', 'Payment Confirmed', 'Order Packing', 'Order Shipping', 'Order Delivered', 'Order Cancelled', 'Refunded'];
    const statusDistribution = statusOrder.map(status => {
      const count = normalizedRangeOrders.filter(order => order.normalizedStatus === status).length;
      return { status, count };
    });

    const paymentDistribution = [
      { label: 'Pending', count: normalizedRangeOrders.filter(order => order.payment_status === 'pending' || order.payment_status === 'failed').length, tone: '#f57c00' },
      { label: 'Partially Paid', count: normalizedRangeOrders.filter(order => order.isPartiallyPaid).length, tone: '#1976d2' },
      { label: 'Fully Paid', count: normalizedRangeOrders.filter(order => order.isFullyPaid).length, tone: '#2e7d32' },
      { label: 'Refunded', count: normalizedRangeOrders.filter(order => order.order_status === 'refunded' || order.payment_status === 'refunded').length, tone: '#7b1fa2' }
    ];

    const deliveryDistribution = [
      { label: 'Packing', count: normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Packing').length, tone: '#fb8c00' },
      { label: 'Shipping', count: normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Shipping').length, tone: '#1e88e5' },
      { label: 'Delivered', count: normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Delivered').length, tone: '#2e7d32' },
      { label: 'Cancelled', count: normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Cancelled').length, tone: '#c62828' }
    ];

    const uniqueCustomerKey = (order: any) => order.customer_id || order.phone || order.customer_name || order.transaction_id;
    const uniqueCustomers = new Map<string, { name: string; total: number; orders: number; isGuest: boolean }>();
    normalizedOrders.forEach(order => {
      const key = uniqueCustomerKey(order);
      const existing = uniqueCustomers.get(key) || { name: order.customer_name || 'Guest', total: 0, orders: 0, isGuest: !order.customer_id, };
      existing.total += safeNumber(order.total);
      existing.orders += 1;
      existing.isGuest = !order.customer_id;
      uniqueCustomers.set(key, existing);
    });

    const uniqueCustomersToday = new Map<string, boolean>();
    normalizedRangeOrders.forEach(order => uniqueCustomersToday.set(uniqueCustomerKey(order), true));

    const rangeRevenue = rangePaidOrders.reduce((sum, order) => sum + safeNumber(order.total), 0);
    const previousRevenue = previousOrders.filter(order => order.payment_status === 'paid').reduce((sum, order) => sum + safeNumber(order.total), 0);

    const allRangeOrdersCount = rangeOrders.length;
    const previousOrdersCount = previousOrders.length;
    const avgOrderValue = rangePaidOrders.length ? rangeRevenue / rangePaidOrders.length : 0;

    const orderTodayCount = allOrders.filter(order => isWithinBounds(order.created_at, startOfDay(now), endOfDay(now))).length;
    const orderThisWeekCount = allOrders.filter(order => isWithinBounds(order.created_at, startOfDay(addDays(now, -6)), endOfDay(now))).length;
    const orderThisMonthCount = allOrders.filter(order => isWithinBounds(order.created_at, new Date(now.getFullYear(), now.getMonth(), 1), endOfDay(now))).length;

    const revenueToday = allOrders.filter(order => order.payment_status === 'paid' && isWithinBounds(order.created_at, startOfDay(now), endOfDay(now))).reduce((sum, order) => sum + safeNumber(order.total), 0);
    const revenueThisWeek = allOrders.filter(order => order.payment_status === 'paid' && isWithinBounds(order.created_at, startOfDay(addDays(now, -6)), endOfDay(now))).reduce((sum, order) => sum + safeNumber(order.total), 0);
    const revenueThisMonth = allOrders.filter(order => order.payment_status === 'paid' && isWithinBounds(order.created_at, new Date(now.getFullYear(), now.getMonth(), 1), endOfDay(now))).reduce((sum, order) => sum + safeNumber(order.total), 0);
    const revenueThisYear = allOrders.filter(order => order.payment_status === 'paid' && isWithinBounds(order.created_at, new Date(now.getFullYear(), 0, 1), endOfDay(now))).reduce((sum, order) => sum + safeNumber(order.total), 0);

    const totalProducts = products.length;
    const activeProducts = products.filter(product => product.status === 'in-stock' && safeNumber(product.stock) > 0).length;
    const outOfStockProducts = products.filter(product => product.status === 'out-of-stock' || safeNumber(product.stock) <= 0).length;
    const lowStockProducts = products.filter(product => safeNumber(product.stock) > 0 && safeNumber(product.stock) <= 5).length;

    const ordersPacking = normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Packing').length;
    const ordersShipping = normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Shipping').length;
    const deliveredToday = allOrders.filter(order => order.payment_status === 'paid' && order.normalizedStatus === 'Order Delivered' && isWithinBounds(order.created_at, startOfDay(now), endOfDay(now))).length;
    const cancelledOrders = normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Cancelled').length;
    const refundedOrders = normalizedRangeOrders.filter(order => order.normalizedStatus === 'Refunded').length;
    const pendingPayments = normalizedRangeOrders.filter(order => order.isPendingPayment).length;
    const partiallyPaidOrders = normalizedRangeOrders.filter(order => order.isPartiallyPaid).length;
    const fullyPaidOrders = normalizedRangeOrders.filter(order => order.isFullyPaid).length;

    const pendingConfirmation = normalizedRangeOrders.filter(order => ['pending', 'pending_payment', 'under_review', 'payment_submitted'].includes(String(order.order_status))).length;
    const pendingPacking = normalizedRangeOrders.filter(order => !['Order Packing', 'Order Shipping', 'Order Delivered', 'Order Cancelled', 'Refunded'].includes(String(order.normalizedStatus))).length;
    const pendingShipping = normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Packing' || order.normalizedStatus === 'Order Shipping').length;
    const pendingCourierCollections = normalizedRangeOrders.filter(order => safeNumber(order.courier_collection_amount) > 0 && safeNumber(order.due_amount) > 0).length;
    const pendingRefundRequests = normalizedRangeOrders.filter(order => order.payment_status === 'refund_requested' || order.order_status === 'refund_requested').length;
    const pendingMessages = messages.filter(message => message.status === 'unread').length;
    const productsRunningOut = products.filter(product => safeNumber(product.stock) > 0 && safeNumber(product.stock) <= 3).length;
    const hiddenProducts = products.filter(product => product.status === 'out-of-stock').length;
    const draftProducts = 0;
    const expiredDiscounts = 0;
    const couponsUsedToday = 0;

    const highestSpendingCustomer = Array.from(uniqueCustomers.values()).sort((a, b) => b.total - a.total)[0] || null;
    const averageCustomerSpending = uniqueCustomers.size ? Array.from(uniqueCustomers.values()).reduce((sum, customer) => sum + customer.total, 0) / uniqueCustomers.size : 0;
    const guestOrders = normalizedRangeOrders.filter(order => !order.customer_id).length;

    const productSales = new Map<string, { title: string; quantity: number; revenue: number; category: string; views: number }>();
    normalizedRangeOrders.forEach(order => {
      (order.order_items || []).forEach((item: any) => {
        const title = item.products?.title || item.product_id || 'Unknown Product';
        const current = productSales.get(title) || { title, quantity: 0, revenue: 0, category: item.products?.category || item.products?.subcategory || 'Uncategorized', views: 0 };
        current.quantity += safeNumber(item.quantity);
        current.revenue += safeNumber(item.price_num) * safeNumber(item.quantity);
        productSales.set(title, current);
      });
    });
    const bestSellingProduct = Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity)[0] || null;
    const highestRevenueProduct = Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue)[0] || null;
    const mostOrderedProduct = Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity)[0] || null;
    const categorySales = new Map<string, number>();
    normalizedRangeOrders.forEach(order => {
      (order.order_items || []).forEach((item: any) => {
        const category = item.products?.category || item.products?.subcategory || 'Uncategorized';
        categorySales.set(category, (categorySales.get(category) || 0) + safeNumber(item.quantity));
      });
    });
    const categoryDistribution = Array.from(categorySales.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const bestSellingCategory = Array.from(categorySales.entries()).sort((a, b) => b[1] - a[1])[0] || null;
    const averageBasketSize = normalizedRangeOrders.length ? normalizedRangeOrders.reduce((sum, order) => sum + (order.order_items || []).reduce((itemSum: number, item: any) => itemSum + safeNumber(item.quantity), 0), 0) / normalizedRangeOrders.length : 0;
    const mostViewedProduct = bestSellingProduct;

    const dayBuckets = new Map<string, { revenue: number; orders: number; customers: number }>();
    normalizedOrders.forEach(order => {
      const key = localDayKey(new Date(order.created_at));
      const bucket = dayBuckets.get(key) || { revenue: 0, orders: 0, customers: 0 };
      bucket.orders += 1;
      if (order.payment_status === 'paid') bucket.revenue += safeNumber(order.total);
      dayBuckets.set(key, bucket);
    });

    const monthlyBuckets = Array.from({ length: 12 }, (_, index) => {
      const monthKey = new Date(now.getFullYear(), index, 1).toLocaleString('en-US', { month: 'short' });
      const monthOrders = allOrders.filter(order => new Date(order.created_at).getMonth() === index && new Date(order.created_at).getFullYear() === now.getFullYear());
      const monthRevenue = monthOrders.filter(order => order.payment_status === 'paid').reduce((sum, order) => sum + safeNumber(order.total), 0);
      return { label: monthKey, orders: monthOrders.length, revenue: monthRevenue };
    });
    const customerGrowth = Array.from({ length: 12 }, (_, index) => {
      const monthOrders = allOrders.filter(order => new Date(order.created_at).getMonth() === index && new Date(order.created_at).getFullYear() === now.getFullYear());
      const uniqueMonthCustomers = new Set(monthOrders.map(uniqueCustomerKey)).size;
      return { label: new Date(now.getFullYear(), index, 1).toLocaleString('en-US', { month: 'short' }), value: uniqueMonthCustomers };
    });

    const latest7Days = Array.from({ length: 7 }, (_, index) => {
      const day = addDays(startOfDay(now), index - 6);
      const dayOrders = allOrders.filter(order => localDayKey(new Date(order.created_at)) === localDayKey(day));
      return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), value: dayOrders.filter(order => order.payment_status === 'paid').reduce((sum, order) => sum + safeNumber(order.total), 0) };
    });

    const salesDays = Array.from(dayBuckets.entries())
      .map(([label, bucket]) => ({ label, ...bucket }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-7);

    const highestSalesDay = salesDays.slice().sort((a, b) => b.revenue - a.revenue)[0] || null;
    const lowestSalesDay = salesDays.slice().sort((a, b) => a.revenue - b.revenue)[0] || null;

    const todaySummaryOrders = allOrders.filter(order => isWithinBounds(order.created_at, startOfDay(now), endOfDay(now)));
    const waitingForAction = todaySummaryOrders.filter(order => ['pending', 'pending_payment', 'under_review', 'payment_submitted', 'payment_verification'].includes(String(order.order_status))).length + todaySummaryOrders.filter(order => order.payment_status === 'failed').length;

    const alerts = [
      outOfStockProducts > 0 ? `${outOfStockProducts} products are out of stock` : null,
      ordersPacking > 0 ? `${ordersPacking} orders need packing` : null,
      pendingPayments > 0 ? `${pendingPayments} payments are pending verification` : null,
      pendingRefundRequests > 0 ? `${pendingRefundRequests} refund requests require approval` : null,
      lowStockProducts > 0 ? `${lowStockProducts} products have low inventory` : null,
      pendingMessages > 0 ? `${pendingMessages} customer messages need response` : null,
      pendingConfirmation > 0 ? `${pendingConfirmation} orders are waiting for confirmation` : null
    ].filter(Boolean) as string[];

    return {
      currentBounds,
      previousBounds,
      rangeOrders,
      previousOrders,
      allRangeOrdersCount,
      previousOrdersCount,
      rangeRevenue,
      previousRevenue,
      avgOrderValue,
      orderTodayCount,
      orderThisWeekCount,
      orderThisMonthCount,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      revenueThisYear,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      pendingPayments,
      partiallyPaidOrders,
      fullyPaidOrders,
      refundedOrders,
      ordersPacking,
      ordersShipping,
      deliveredToday,
      cancelledOrders,
      statusDistribution,
      paymentDistribution,
      deliveryDistribution,
      pendingConfirmation,
      pendingPacking,
      pendingShipping,
      pendingCourierCollections,
      pendingRefundRequests,
      pendingMessages,
      productsRunningOut,
      hiddenProducts,
      draftProducts,
      expiredDiscounts,
      couponsUsedToday,
      highestSpendingCustomer,
      averageCustomerSpending,
      guestOrders,
      uniqueCustomersCount: uniqueCustomers.size,
      uniqueCustomersTodayCount: uniqueCustomersToday.size,
      activeCustomers: Array.from(uniqueCustomers.values()).filter(customer => customer.orders > 0).length,
      returningCustomers: Array.from(uniqueCustomers.values()).filter(customer => customer.orders > 1).length,
      bestSellingProduct,
      bestSellingCategory,
      mostViewedProduct,
      highestRevenueProduct,
      mostOrderedProduct,
      averageBasketSize,
      highestSalesDay,
      lowestSalesDay,
      alerts,
      salesByMonth: monthlyBuckets,
      customerGrowth,
      categoryDistribution,
      revenueTrend: latest7Days,
      quickStats: [
        { label: 'Total Orders', value: allRangeOrdersCount },
        { label: 'Pending Orders', value: pendingConfirmation },
        { label: 'Delivered Orders', value: normalizedRangeOrders.filter(order => order.normalizedStatus === 'Order Delivered').length },
        { label: 'Cancelled Orders', value: cancelledOrders },
        { label: 'Revenue Today', value: revenueToday, isMoney: true },
        { label: 'Revenue This Month', value: revenueThisMonth, isMoney: true },
        { label: 'Active Customers', value: Array.from(uniqueCustomers.values()).filter(customer => customer.orders > 0).length },
        { label: 'Low Stock Products', value: lowStockProducts }
      ],
      summaryText: `Today you have ${todaySummaryOrders.length} new orders, ${waitingForAction} orders waiting for action, and ${formatCurrency(revenueToday)} in sales.`,
      statusColors: {
        'Order Placed': '#fb8c00',
        'Payment Confirmed': '#1e88e5',
        'Order Packing': '#8e24aa',
        'Order Shipping': '#039be5',
        'Order Delivered': '#2e7d32',
        'Order Cancelled': '#c62828',
        'Refunded': '#6d4c41'
      }
    };
  }, [orders, products, messages, dashboardRange, customStartDate, customEndDate, currentClock]);

  const now = currentClock;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Products
      const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      const mappedProds: Product[] = (prods || []).map(p => ({
        id: p.id,
        title: p.title,
        subcategory: p.subcategory,
        category: p.category,
        price: p.price,
        priceNum: Number(p.price_num),
        weight: p.weight,
        location: p.location,
        harvest: p.harvest,
        status: p.status as 'in-stock' | 'out-of-stock',
        story: p.story,
        benefits: p.benefits,
        storage: p.storage,
        img: p.img,
        stock: p.stock,
        is_featured: p.is_featured
      }));
      setProducts(mappedProds);

      // 2. Fetch Categories
      const { data: cats } = await supabase.from('categories').select('*').order('name', { ascending: true });
      setCategories(cats || []);
      // 3. Fetch Orders
      const { data: ords } = await supabase.from('orders').select('*, order_items(*, products(*)), payments(*)').order('created_at', { ascending: false });
      setOrders(ords || []);

      // 4. Fetch Contact Messages
      const { data: msgs } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      setMessages(msgs || []);

      // 5. Fetch Settings
      const { data: dbSettings } = await supabase.from('settings').select('*');
      if (dbSettings) {
        dbSettings.forEach(s => {
          if (s.key === 'facebook_url') setFbUrl(s.value || '');
          else if (s.key === 'instagram_url') setInstaUrl(s.value || '');
          else if (s.key === 'tiktok_url') setTiktokUrl(s.value || '');
          else if (s.key === 'youtube_url') setYtUrl(s.value || '');
          else if (s.key === 'whatsapp_number') setWaNum(s.value || '');
        });
      }

      // 5. Calculate Metrics
      const totalRev = (ords || [])
        .filter(o => o.order_status !== 'cancelled' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const stockOuts = mappedProds.filter(p => p.status === 'out-of-stock' || (p.stock !== undefined && p.stock <= 0)).length;
      const unreads = (msgs || []).filter(m => m.status === 'unread').length;

      setAnalytics({
        revenue: totalRev,
        orderCount: (ords || []).length,
        stockOut: stockOuts,
        unreadMsgs: unreads
      });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Image upload directly to Supabase Storage Bucket
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to supabase storage bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Set public storage path to state
      const dbStoragePath = `storage/product-images/${filePath}`;
      setPImg(dbStoragePath);
      alert('ছবি সফলভাবে আপলোড করা হয়েছে!');
    } catch (err: any) {
      alert(`ছবি আপলোড ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setPBenefits([...pBenefits, benefitInput.trim()]);
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (idx: number) => {
    setPBenefits(pBenefits.filter((_, i) => i !== idx));
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setPId('');
    setPTitle('');
    setPSubcategory('');
    setPCategory(categories[0]?.slug || '');
    setPPrice('');
    setPPriceNum(0);
    setPWeight('');
    setPLocation('');
    setPHarvest('');
    setPStatus('in-stock');
    setPStory('');
    setPBenefits([]);
    setPStorage('');
    setPImg('');
    setPStock(10);
    setPFeatured(false);
    setShowProductForm(true);
  };

  const openEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setPId(prod.id);
    setPTitle(prod.title);
    setPSubcategory(prod.subcategory);
    setPCategory(prod.category);
    setPPrice(prod.price);
    setPPriceNum(prod.priceNum);
    setPWeight(prod.weight);
    setPLocation(prod.location);
    setPHarvest(prod.harvest);
    setPStatus(prod.status);
    setPStory(prod.story);
    setPBenefits(prod.benefits);
    setPStorage(prod.storage);
    setPImg(prod.img);
    setPStock(prod.stock || 10);
    setPFeatured(prod.is_featured || false);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pId || !pTitle || !pPrice || !pPriceNum || !pWeight || !pImg) {
      alert('অনুগ্রহ করে তারকাচিহ্নিত (*) প্রয়োজনীয় ঘরগুলো পূরণ করুন।');
      return;
    }

    setLoading(true);

    const payload = {
      id: pId.trim(),
      title: pTitle.trim(),
      subcategory: pSubcategory.trim(),
      category: pCategory,
      price: pPrice.trim(),
      price_num: pPriceNum,
      weight: pWeight.trim(),
      location: pLocation.trim(),
      harvest: pHarvest.trim(),
      status: pStatus,
      story: pStory.trim(),
      benefits: pBenefits,
      storage: pStorage.trim(),
      img: pImg,
      stock: pStock,
      is_featured: pFeatured,
      updated_at: new Date()
    };

    try {
      if (editingProduct) {
        // Edit Mode
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        alert('পণ্য সফলভাবে আপডেট করা হয়েছে।');
      } else {
        // Insert Mode
        const { error } = await supabase
          .from('products')
          .insert(payload);
        if (error) throw error;
        alert('নতুন পণ্য সফলভাবে যোগ করা হয়েছে।');
      }
      setShowProductForm(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(`পণ্য সংরক্ষণ ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই পণ্যটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      const { error } = await supabase
        .from('categories')
        .insert({ slug: catSlug.trim().toLowerCase(), name: catName.trim() });
      if (error) throw error;
      alert('ক্যাটাগরি সফলভাবে তৈরি হয়েছে।');
      setCatName('');
      setCatSlug('');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    if (!window.confirm('এই ক্যাটাগরি ডিলিট করলে এর অধীনে থাকা সব পণ্যও ডিলিট হতে পারে। ডিলিট করবেন?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('slug', slug);
      if (error) throw error;
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status, updated_at: new Date() })
        .eq('id', orderId);
      if (error) throw error;

      // Log status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: status,
          notes: `অর্ডার স্ট্যাটাস পরিবর্তন করা হয়েছে: ${status}`
        });

      fetchDashboardData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: status });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status, updated_at: new Date() })
        .eq('id', orderId);
      if (error) throw error;

      // Log status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: status === 'paid' ? 'payment_approved' : 'pending_payment',
          notes: `পেমেন্ট স্ট্যাটাস পরিবর্তন করা হয়েছে: ${status}`
        });

      fetchDashboardData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: status });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprovePayment = async (orderId: string, paymentId: string) => {
    try {
      setLoading(true);
      // 1. Update payment status to approved
      const { error: payError } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId);
      if (payError) throw payError;

      // 2. Update order status to payment_approved and payment_status to paid
      const { error: ordError } = await supabase
        .from('orders')
        .update({ order_status: 'payment_approved', payment_status: 'paid', updated_at: new Date() })
        .eq('id', orderId);
      if (ordError) throw ordError;

      // 3. Add status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'payment_approved',
          notes: 'অ্যাডমিন কর্তৃক পেমেন্ট যাচাই সম্পন্ন ও অনুমোদিত হয়েছে।'
        });

      alert('পেমেন্ট সফলভাবে অনুমোদিত হয়েছে!');
      fetchDashboardData();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(`ত্রুটি: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayment = async (orderId: string, paymentId: string, reason: string) => {
    if (!reason.trim()) {
      alert('প্রত্যাখ্যানের কারণ উল্লেখ করুন।');
      return;
    }
    try {
      setLoading(true);
      // 1. Update payment status to rejected
      const { error: payError } = await supabase
        .from('payments')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', paymentId);
      if (payError) throw payError;

      // 2. Revert order status to pending_payment and payment_status to failed
      const { error: ordError } = await supabase
        .from('orders')
        .update({ order_status: 'pending_payment', payment_status: 'failed', updated_at: new Date() })
        .eq('id', orderId);
      if (ordError) throw ordError;

      // 3. Add status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'pending_payment',
          notes: `পেমেন্ট প্রত্যাখ্যাত হয়েছে। কারণ: ${reason}`
        });

      alert('পেমেন্ট প্রত্যাখ্যান করা হয়েছে!');
      fetchDashboardData();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(`ত্রুটি: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProofImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setEditPaymentProofImage(`storage/payment-proofs/${filePath}`);
      alert('পেমেন্ট প্রুফ ইমেজ সফলভাবে আপলোড হয়েছে!');
    } catch (err: any) {
      alert(`ইমেজ আপলোড ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSaveShippingInfo = async () => {
    try {
      setLoading(true);
      const total = Number(selectedOrder.total || 0);
      const adv = Number(editAdvancePaid || 0);
      const paid = Number(editTotalPaid || 0);
      const due = Math.max(0, total - adv - paid);

      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: editCustName.trim(),
          phone: editCustPhone.trim(),
          address: editCustAddr.trim(),
          city: editCustCity.trim(),
          order_source: editOrderSource,
          advance_paid_amount: adv,
          total_paid_amount: paid,
          courier_collection_amount: Number(editCourierCollection || 0),
          courier_name: editCourierName.trim(),
          courier_tracking_number: editCourierTracking.trim(),
          payment_notes: editPaymentNotes.trim(),
          internal_notes: editInternalNotes.trim(),
          payment_proof_image: editPaymentProofImage,
          due_amount: due,
          updated_at: new Date()
        })
        .eq('id', selectedOrder.id);
      if (error) throw error;
      
      alert('অর্ডার তথ্য সফলভাবে আপডেট করা হয়েছে!');
      fetchDashboardData();
      setSelectedOrder({
        ...selectedOrder,
        customer_name: editCustName.trim(),
        phone: editCustPhone.trim(),
        address: editCustAddr.trim(),
        city: editCustCity.trim(),
        order_source: editOrderSource,
        advance_paid_amount: adv,
        total_paid_amount: paid,
        courier_collection_amount: Number(editCourierCollection || 0),
        courier_name: editCourierName.trim(),
        courier_tracking_number: editCourierTracking.trim(),
        payment_notes: editPaymentNotes.trim(),
        internal_notes: editInternalNotes.trim(),
        payment_proof_image: editPaymentProofImage,
        due_amount: due
      });
    } catch (err: any) {
      alert(`শিপিং আপডেট ব্যর্থ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualOrder = async () => {
    if (!manualCustName.trim() || !manualCustPhone.trim() || !manualCustAddress.trim() || !manualCustDistrict.trim()) {
      alert('অনুগ্রহ করে তারকাচিহ্নিত (*) সকল ফিল্ড পূরণ করুন!');
      return;
    }
    if (selectedManualItems.length === 0) {
      alert('কমপক্ষে একটি প্রোডাক্ট যোগ করুন!');
      return;
    }

    setLoading(true);
    try {
      // 1. Calculate totals
      const subtotal = selectedManualItems.reduce((sum, item) => sum + item.product.priceNum * item.quantity, 0);
      const shipping = Number(manualShippingCharge || 0);
      const total = subtotal + shipping;
      const adv = Number(manualAdvancePaid || 0);
      const due = Math.max(0, total - adv);

      // Generate random transaction ID (e.g. SH-ORD-123456)
      const randNum = Math.floor(100000 + Math.random() * 900000);
      const txId = `SH-ORD-${randNum}`;

      // 2. Insert into orders table
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          transaction_id: txId,
          customer_name: manualCustName.trim(),
          phone: manualCustPhone.trim(),
          email: manualCustEmail.trim() || null,
          address: manualCustAddress.trim(),
          city: manualCustDistrict.trim(),
          postal_code: manualCustZip.trim() || null,
          subtotal,
          shipping_cost: shipping,
          total,
          payment_method: manualPaymentMethod,
          order_status: 'Order Placed',
          payment_status: adv > 0 ? 'paid' : 'pending',
          order_source: manualOrderSource,
          advance_paid_amount: adv,
          total_paid_amount: adv,
          due_amount: due,
          courier_name: manualCourierName.trim() || null,
          courier_tracking_number: manualTrackingNumber.trim() || null,
          payment_notes: manualPaymentNotes.trim() || null,
          internal_notes: manualOrderNotes.trim() || null,
          notes: 'Created manually by Admin'
        })
        .select('*')
        .single();

      if (orderErr) throw orderErr;

      // 3. Insert items into order_items table
      const itemsToInsert = selectedManualItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_num: item.product.priceNum
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;

      // 4. Log status history
      const { error: histErr } = await supabase
        .from('order_status_history')
        .insert({
          order_id: newOrder.id,
          status: 'Order Placed',
          notes: 'Manual order created by administrator.'
        });

      if (histErr) throw histErr;

      alert(`ম্যানুয়াল অর্ডারটি সফলভাবে তৈরি হয়েছে! অর্ডার আইডি: ${txId}`);
      
      // Reset form fields
      setManualCustName('');
      setManualCustPhone('');
      setManualCustEmail('');
      setManualCustAddress('');
      setManualCustDistrict('');
      setManualCustZip('');
      setManualOrderNotes('');
      setSelectedManualItems([]);
      setManualCourierName('');
      setManualTrackingNumber('');
      setManualAdvancePaid('');
      setManualTransactionId('');
      setManualPaymentNotes('');

      fetchDashboardData();
    } catch (err: any) {
      alert(`অর্ডার তৈরি ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSocialSettings = async () => {
    setLoading(true);
    try {
      const keys = ['facebook_url', 'instagram_url', 'tiktok_url', 'youtube_url', 'whatsapp_number'];
      const values = [fbUrl.trim(), instaUrl.trim(), tiktokUrl.trim(), ytUrl.trim(), waNum.trim()];

      for (let i = 0; i < keys.length; i++) {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: keys[i], value: values[i] }, { onConflict: 'key' });

        if (error) throw error;
      }

      alert('সামাজিক যোগাযোগ মাধ্যম লিংকসমূহ সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      alert(`সেটিংস সংরক্ষণ ব্যর্থ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID,Customer Name,Phone,Date,Subtotal,Shipping,Total,Payment Method,Order Status,Payment Status\n'];
    const rows = orders.map(o => `"${o.transaction_id}","${o.customer_name}","${o.phone}","${new Date(o.created_at).toLocaleDateString()}","${o.subtotal}","${o.shipping_cost}","${o.total}","${o.payment_method}","${o.order_status}","${o.payment_status}"`);
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateMessageStatus = async (msgId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', msgId);
      if (error) throw error;
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('বার্তাটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', msgId);
      if (error) throw error;
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openOrdersTab = (status: string = 'all', payment: string = 'all') => {
    setStatusFilter(status);
    setPaymentFilter(payment);
    setSearchQuery('');
    navigate('/orders');
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '90vh', padding: '0px' }}>
      <Helmet>
        <title>অ্যাডমিন ড্যাশবোর্ড - সুন্দরবন হাট</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Main Admin Dashboard Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '90vh' }}>
        
        {/* Left Sidebar */}
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
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-honey)' }}>অ্যাডমিন প্যানেল</span>
            </div>

            {/* Sidebar Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Overview */}
              <button 
                onClick={() => setActiveTab('overview')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'overview' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'overview' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'overview' ? 'bold' : 'normal'
                }}
              >
                <LayoutDashboard size={18} /> ওভারভিউ
              </button>

              {/* Orders */}
              <button 
                onClick={() => navigate('/orders')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: 'transparent',
                  color: '#ddd',
                  fontWeight: 'normal'
                }}
              >
                <ClipboardList size={18} /> অর্ডারসমূহ
                {orders.filter(o => o.order_status === 'pending').length > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: '#e53935', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {orders.filter(o => o.order_status === 'pending').length}
                  </span>
                )}
              </button>

              {/* Products */}
              <button 
                onClick={() => setActiveTab('products')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'products' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'products' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'products' ? 'bold' : 'normal'
                }}
              >
                <ShoppingBag size={18} /> পণ্যসমূহ
              </button>

              {/* Customer Management */}
              <button 
                onClick={() => navigate('/admin/customers')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: 'transparent',
                  color: '#ddd',
                  fontWeight: 'normal'
                }}
              >
                <Users size={18} /> কাস্টমার ম্যানেজমেন্ট
              </button>

              {/* Categories */}
              <button 
                onClick={() => setActiveTab('categories')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'categories' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'categories' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'categories' ? 'bold' : 'normal'
                }}
              >
                <Tags size={18} /> ক্যাটাগরি
              </button>

              {/* Messages */}
              <button 
                onClick={() => setActiveTab('messages')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'messages' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'messages' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'messages' ? 'bold' : 'normal'
                }}
              >
                <MessageSquare size={18} /> বার্তা ইনবক্স
                {analytics.unreadMsgs > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: 'var(--color-honey-glow)', color: 'var(--color-forest-dark)', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {analytics.unreadMsgs}
                  </span>
                )}
              </button>

              {/* Manual Order Creation */}
              <button 
                onClick={() => setActiveTab('manual-orders')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'manual-orders' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'manual-orders' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'manual-orders' ? 'bold' : 'normal'
                }}
              >
                <PlusCircle size={18} /> ম্যানুয়াল অর্ডার
              </button>

              {/* Settings */}
              <button 
                onClick={() => setActiveTab('settings')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'settings' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'settings' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'settings' ? 'bold' : 'normal'
                }}
              >
                <Settings size={18} /> সেটিং চ্যানেল
              </button>
            </div>
          </div>

          {/* Log Out Button */}
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
              backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff6666'
            }}
          >
            <LogOut size={18} /> লগআউট করুন
          </button>
        </div>

        {/* Right Tab Content View */}
        <div style={{ padding: '40px', overflowY: 'auto', maxHeight: '90vh' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(18, 48, 36, 0.98), rgba(37, 99, 75, 0.96))',
                color: '#fff',
                borderRadius: '28px',
                padding: '28px',
                boxShadow: '0 20px 40px rgba(18, 48, 36, 0.18)',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: '760px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', fontSize: '0.82rem', marginBottom: '14px' }}>
                      <Sparkles size={14} /> Welcome back, Admin
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.1, fontWeight: 900 }}>Business intelligence at a glance</h2>
                    <p style={{ margin: '10px 0 0 0', fontSize: '1rem', color: 'rgba(255,255,255,0.82)', maxWidth: '760px' }}>{dashboardInsights.summaryText}</p>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '18px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.88)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={15} /> {now.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock3 size={15} /> {now.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button onClick={openAddForm} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '11px 16px' }}><PlusCircle size={16} /> New Product</button>
                    <button onClick={() => navigate('/admin/dashboard?tab=manual-orders')} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '11px 16px', color: '#fff', borderColor: 'rgba(255,255,255,0.28)' }}><ClipboardList size={16} /> Manual Order</button>
                    <button onClick={() => navigate('/orders')} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '11px 16px', color: '#fff', borderColor: 'rgba(255,255,255,0.28)' }}><Eye size={16} /> View Orders</button>
                    <button onClick={() => navigate('/admin/customers')} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '11px 16px', color: '#fff', borderColor: 'rgba(255,255,255,0.28)' }}><Users size={16} /> Manage Customers</button>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.78)', border: '1px solid var(--color-border)', borderRadius: '18px', boxShadow: '0 10px 24px rgba(18, 48, 36, 0.06)', backdropFilter: 'blur(12px)'
              }}>
                {[
                  ['today', 'Today'], ['yesterday', 'Yesterday'], ['last_7_days', 'Last 7 Days'], ['last_30_days', 'Last 30 Days'], ['this_month', 'This Month'], ['last_month', 'Last Month'], ['this_year', 'This Year'], ['custom', 'Custom Range']
                ].map(([key, label]) => (
                  <button key={key} onClick={() => setDashboardRange(key as DashboardRange)} style={{
                    border: 'none', cursor: 'pointer', borderRadius: '999px', padding: '9px 14px', fontWeight: 700,
                    backgroundColor: dashboardRange === key ? 'var(--color-mangrove)' : '#f3f6f4', color: dashboardRange === key ? '#fff' : 'var(--color-forest-dark)'
                  }}>{label}</button>
                ))}
                {dashboardRange === 'custom' && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} style={{ padding: '9px 12px', borderRadius: '999px', border: '1px solid var(--color-border)' }} />
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} style={{ padding: '9px 12px', borderRadius: '999px', border: '1px solid var(--color-border)' }} />
                  </div>
                )}
              </div>

              {loading && orders.length === 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ height: '120px', borderRadius: '20px', background: 'linear-gradient(90deg, rgba(231,236,233,0.65), rgba(255,255,255,0.95), rgba(231,236,233,0.65))', animation: 'pulse 1.4s ease-in-out infinite' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {Array.from({ length: 6 }).map((_, index) => <div key={index} style={{ height: '160px', borderRadius: '20px', background: '#fff', border: '1px solid var(--color-border)', opacity: 0.7 }} />)}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {[
                      { title: 'Orders', value: formatCompact(dashboardInsights.allRangeOrdersCount), change: percentageChange(dashboardInsights.allRangeOrdersCount, dashboardInsights.previousOrdersCount), icon: <ClipboardList size={22} />, accent: 'linear-gradient(135deg, #0f766e, #14b8a6)', onClick: () => openOrdersTab() },
                      { title: 'Revenue', value: formatCurrency(dashboardInsights.rangeRevenue), change: percentageChange(dashboardInsights.rangeRevenue, dashboardInsights.previousRevenue), icon: <CircleDollarSign size={22} />, accent: 'linear-gradient(135deg, #1d4ed8, #60a5fa)', onClick: () => openOrdersTab('all', 'paid') },
                      { title: 'Customers', value: formatCompact(dashboardInsights.uniqueCustomersCount), change: percentageChange(dashboardInsights.uniqueCustomersTodayCount, Math.max(1, dashboardInsights.uniqueCustomersCount - dashboardInsights.uniqueCustomersTodayCount)), icon: <Users size={22} />, accent: 'linear-gradient(135deg, #7c3aed, #c084fc)', onClick: () => navigate('/admin/customers') },
                      { title: 'Products', value: formatCompact(dashboardInsights.totalProducts), change: percentageChange(dashboardInsights.totalProducts - dashboardInsights.outOfStockProducts, Math.max(1, dashboardInsights.totalProducts - dashboardInsights.outOfStockProducts - 1)), icon: <Package size={22} />, accent: 'linear-gradient(135deg, #b45309, #f59e0b)', onClick: () => setActiveTab('products') },
                      { title: 'Payments', value: formatCompact(dashboardInsights.pendingPayments), change: percentageChange(dashboardInsights.fullyPaidOrders, Math.max(1, dashboardInsights.pendingPayments)), icon: <CreditCard size={22} />, accent: 'linear-gradient(135deg, #be185d, #fb7185)', onClick: () => openOrdersTab('all', 'pending') },
                      { title: 'Deliveries', value: formatCompact(dashboardInsights.ordersPacking + dashboardInsights.ordersShipping + dashboardInsights.deliveredToday), change: percentageChange(dashboardInsights.deliveredToday, Math.max(1, dashboardInsights.ordersShipping)), icon: <Truck size={22} />, accent: 'linear-gradient(135deg, #047857, #34d399)', onClick: () => openOrdersTab('delivered') }
                    ].map(card => (
                      <button key={card.title} type="button" onClick={card.onClick} style={{
                        textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: '22px', padding: '20px', color: '#fff', background: card.accent,
                        boxShadow: '0 18px 35px rgba(18, 48, 36, 0.12)', position: 'relative', overflow: 'hidden', minHeight: '158px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, letterSpacing: '0.02em' }}>{card.title}</span>
                          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center' }}>{card.icon}</div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '18px' }}>{card.value}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.88)' }}>
                          {card.change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                          <span>{Math.abs(card.change).toFixed(1)}% vs previous period</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)', boxShadow: '0 12px 28px rgba(18, 48, 36, 0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-forest-dark)' }}>Order Status Analytics</h3>
                          <p style={{ margin: '6px 0 0 0', color: 'gray', fontSize: '0.88rem' }}>Tap any status to open the filtered order queue.</p>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-mangrove)' }}><Activity size={16} /> Live</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                        {dashboardInsights.statusDistribution.map(item => {
                          const percent = dashboardInsights.allRangeOrdersCount ? (item.count / dashboardInsights.allRangeOrdersCount) * 100 : 0;
                          const color = dashboardInsights.statusColors[item.status as keyof typeof dashboardInsights.statusColors] || 'var(--color-mangrove)';
                          return (
                            <button key={item.status} type="button" onClick={() => openOrdersTab(item.status === 'Order Delivered' ? 'delivered' : item.status === 'Order Cancelled' ? 'cancelled' : 'all')} style={{
                              border: '1px solid var(--color-border)', background: '#fff', borderRadius: '18px', padding: '16px', textAlign: 'left', cursor: 'pointer', boxShadow: '0 8px 18px rgba(18,48,36,0.05)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: 'var(--color-forest-dark)' }}>{item.status}</span>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                              </div>
                              <div style={{ fontSize: '1.9rem', fontWeight: 900, marginTop: '10px', color: 'var(--color-forest-dark)' }}>{item.count}</div>
                              <div style={{ fontSize: '0.82rem', color: 'gray' }}>{percent.toFixed(1)}% of total orders</div>
                              <div style={{ marginTop: '12px', height: '8px', borderRadius: '999px', background: '#edf2ee', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.max(6, percent)}%`, height: '100%', borderRadius: '999px', background: color }} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)', boxShadow: '0 12px 28px rgba(18, 48, 36, 0.06)' }}>
                      <h3 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-forest-dark)' }}>Business Health</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                        {[
                          ['Orders waiting confirmation', dashboardInsights.pendingConfirmation, 'var(--color-mud)'],
                          ['Orders waiting packing', dashboardInsights.pendingPacking, '#fb8c00'],
                          ['Orders waiting shipping', dashboardInsights.pendingShipping, '#1e88e5'],
                          ['Pending courier collections', dashboardInsights.pendingCourierCollections, '#00897b'],
                          ['Pending refunds', dashboardInsights.pendingRefundRequests, '#8e24aa'],
                          ['Pending customer messages', dashboardInsights.pendingMessages, '#c62828'],
                          ['Products running out', dashboardInsights.productsRunningOut, '#d97706'],
                          ['Hidden products', dashboardInsights.hiddenProducts, '#6b7280']
                        ].map(([label, value, tone]) => (
                          <button key={String(label)} type="button" onClick={() => setActiveTab(String(label).includes('customer messages') ? 'messages' : 'orders')} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '12px 14px', background: '#fff', cursor: 'pointer', textAlign: 'left'
                          }}>
                            <span style={{ color: 'var(--color-forest-dark)', fontWeight: 700 }}>{label}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: tone as string, fontWeight: 900 }}><BadgeAlert size={15} /> {value as number}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Revenue Analytics</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px' }}>
                        {[
                          { label: 'Today', value: dashboardInsights.revenueToday },
                          { label: 'This Week', value: dashboardInsights.revenueThisWeek },
                          { label: 'This Month', value: dashboardInsights.revenueThisMonth },
                          { label: 'This Year', value: dashboardInsights.revenueThisYear },
                          { label: 'Avg Order Value', value: dashboardInsights.avgOrderValue },
                          { label: 'Highest Sales Day', value: dashboardInsights.highestSalesDay?.revenue || 0 }
                        ].map((item) => (
                          <div key={item.label} style={{ borderRadius: '16px', background: '#f8faf8', padding: '14px', border: '1px solid #e7ece8' }}>
                            <div style={{ color: 'gray', fontSize: '0.82rem' }}>{item.label}</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-forest-dark)', marginTop: '6px' }}>{formatCurrency(item.value)}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', fontSize: '0.9rem' }}>
                        <div style={{ padding: '14px', borderRadius: '16px', background: '#edf7f4' }}>
                          <div style={{ color: 'gray' }}>Average Daily Sales</div>
                          <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.08rem' }}>{formatCurrency(dashboardInsights.revenueThisMonth / Math.max(1, now.getDate()))}</strong>
                        </div>
                        <div style={{ padding: '14px', borderRadius: '16px', background: '#fff7ed' }}>
                          <div style={{ color: 'gray' }}>Lowest Sales Day</div>
                          <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.08rem' }}>{dashboardInsights.lowestSalesDay ? formatCurrency(dashboardInsights.lowestSalesDay.revenue) : formatCurrency(0)}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Inventory Overview</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          ['Available', dashboardInsights.activeProducts, '#2e7d32'],
                          ['Out of stock', dashboardInsights.outOfStockProducts, '#c62828'],
                          ['Low stock', dashboardInsights.lowStockProducts, '#f59e0b'],
                          ['Recently added', dashboardInsights.totalProducts, '#1e88e5'],
                          ['Needs restock', dashboardInsights.productsRunningOut, '#fb8c00']
                        ].map(([label, value, color]) => {
                          const percent = dashboardInsights.totalProducts ? ((value as number) / dashboardInsights.totalProducts) * 100 : 0;
                          return (
                            <div key={String(label)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--color-forest-dark)', fontWeight: 700 }}>{label}</span>
                                <span style={{ fontWeight: 900, color: color as string }}>{value as number}</span>
                              </div>
                              <div style={{ height: '10px', background: '#edf2ee', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.max(4, percent)}%`, background: color as string, height: '100%' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Customer Insights</h3>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {[
                          ['Total Registered Customers', dashboardInsights.uniqueCustomersCount],
                          ['Customers Registered Today', dashboardInsights.uniqueCustomersTodayCount],
                          ['Returning Customers', dashboardInsights.returningCustomers],
                          ['Guest Orders', dashboardInsights.guestOrders],
                          ['Average Customer Spending', dashboardInsights.averageCustomerSpending],
                          ['Highest Spending Customer', dashboardInsights.highestSpendingCustomer?.name || 'N/A']
                        ].map(([label, value]) => (
                          <div key={String(label)} style={{ padding: '13px', borderRadius: '16px', background: '#f8faf8', border: '1px solid #e7ece8' }}>
                            <div style={{ color: 'gray', fontSize: '0.82rem' }}>{label}</div>
                            <div style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem', fontWeight: 900, marginTop: '6px' }}>{typeof value === 'number' ? (String(label).includes('Spending') ? formatCurrency(value) : formatCompact(value)) : String(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--color-forest-dark)' }}>Alerts & Notifications</h3>
                        <Bell size={18} color="var(--color-mangrove)" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {dashboardInsights.alerts.length > 0 ? dashboardInsights.alerts.map((alert, index) => (
                          <button key={index} type="button" onClick={() => openOrdersTab()} style={{ border: '1px solid #f0e0cf', background: '#fffaf4', borderRadius: '16px', padding: '13px', textAlign: 'left', cursor: 'pointer' }}>
                            <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', color: '#b45309', fontWeight: 800 }}><AlertTriangle size={14} /> {alert}</span>
                          </button>
                        )) : (
                          <div style={{ color: 'gray', fontSize: '0.92rem' }}>No actionable alerts right now.</div>
                        )}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Quick Statistics</h3>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {dashboardInsights.quickStats.map(stat => (
                          <button key={stat.label} type="button" onClick={() => stat.label.includes('Products') ? setActiveTab('products') : openOrdersTab()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '14px', background: '#fff', padding: '12px 14px', cursor: 'pointer' }}>
                            <span style={{ color: 'var(--color-forest-dark)', fontWeight: 700 }}>{stat.label}</span>
                            <strong style={{ color: 'var(--color-mangrove)' }}>{stat.isMoney ? formatCurrency(stat.value) : formatCompact(stat.value)}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Sales by Month</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'end', minHeight: '210px' }}>
                        {dashboardInsights.salesByMonth.map(item => {
                          const maxRevenue = Math.max(...dashboardInsights.salesByMonth.map(month => month.revenue), 1);
                          const height = Math.max(18, (item.revenue / maxRevenue) * 180);
                          return (
                            <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ height: `${height}px`, borderRadius: '14px 14px 6px 6px', background: 'linear-gradient(180deg, var(--color-honey-glow), var(--color-mangrove))', marginBottom: '10px' }} />
                              <div style={{ fontSize: '0.75rem', color: 'gray' }}>{item.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Revenue Trend</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'end', minHeight: '210px' }}>
                        {dashboardInsights.revenueTrend.map(item => {
                          const maxValue = Math.max(...dashboardInsights.revenueTrend.map(entry => entry.value), 1);
                          const height = Math.max(20, (item.value / maxValue) * 180);
                          return (
                            <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ height: `${height}px`, borderRadius: '14px 14px 6px 6px', background: 'linear-gradient(180deg, #dbeafe, #1d4ed8)', marginBottom: '10px' }} />
                              <div style={{ fontSize: '0.72rem', color: 'gray' }}>{item.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Order Status Distribution</h3>
                      <div style={{ width: '220px', height: '220px', borderRadius: '50%', margin: '18px auto', background: (() => {
                        const total = Math.max(dashboardInsights.allRangeOrdersCount, 1);
                        let currentPercent = 0;
                        const gradientStops = dashboardInsights.statusDistribution.map(item => {
                          const color = dashboardInsights.statusColors[item.status as keyof typeof dashboardInsights.statusColors] || 'var(--color-mangrove)';
                          const nextPercent = currentPercent + (item.count / total) * 100;
                          const segment = `${color} ${currentPercent}% ${nextPercent}%`;
                          currentPercent = nextPercent;
                          return segment;
                        }).join(', ');
                        return `conic-gradient(${gradientStops})`;
                      })(), boxShadow: 'inset 0 0 0 18px rgba(255,255,255,0.82)' }} />
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {dashboardInsights.statusDistribution.slice(0, 4).map(item => (
                          <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-forest-dark)', fontSize: '0.9rem' }}>
                            <span>{item.status}</span>
                            <strong>{item.count}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Payment Status Distribution</h3>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {dashboardInsights.paymentDistribution.map(item => {
                          const max = Math.max(...dashboardInsights.paymentDistribution.map(entry => entry.count), 1);
                          const percent = (item.count / max) * 100;
                          return (
                            <div key={item.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 700 }}>{item.label}</span>
                                <strong style={{ color: item.tone }}>{item.count}</strong>
                              </div>
                              <div style={{ height: '10px', background: '#edf2ee', borderRadius: '999px' }}>
                                <div style={{ width: `${Math.max(6, percent)}%`, height: '100%', borderRadius: '999px', background: item.tone }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Product Category Distribution</h3>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {dashboardInsights.categoryDistribution.length > 0 ? dashboardInsights.categoryDistribution.map(item => {
                          const max = Math.max(...dashboardInsights.categoryDistribution.map(entry => entry.value), 1);
                          const percent = (item.value / max) * 100;
                          return (
                            <div key={item.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 700 }}>{item.label}</span>
                                <strong>{item.value}</strong>
                              </div>
                              <div style={{ height: '10px', background: '#edf2ee', borderRadius: '999px' }}>
                                <div style={{ width: `${Math.max(6, percent)}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #f59e0b, #7c3aed)' }} />
                              </div>
                            </div>
                          );
                        }) : <div style={{ color: 'gray' }}>No sales data yet.</div>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Sales Performance</h3>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {[
                          ['Best Selling Product', dashboardInsights.bestSellingProduct?.title || 'N/A'],
                          ['Best Selling Category', dashboardInsights.bestSellingCategory?.[0] || 'N/A'],
                          ['Most Viewed Product', dashboardInsights.mostViewedProduct?.title || 'N/A'],
                          ['Highest Revenue Product', dashboardInsights.highestRevenueProduct?.title || 'N/A'],
                          ['Most Ordered Product', dashboardInsights.mostOrderedProduct?.title || 'N/A'],
                          ['Average Basket Size', dashboardInsights.averageBasketSize]
                        ].map(([label, value]) => (
                          <div key={String(label)} style={{ border: '1px solid var(--color-border)', borderRadius: '16px', padding: '12px', background: '#fff' }}>
                            <div style={{ color: 'gray', fontSize: '0.82rem' }}>{label}</div>
                            <div style={{ marginTop: '5px', color: 'var(--color-forest-dark)', fontWeight: 900 }}>{typeof value === 'number' ? formatCompact(value) : String(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '24px', padding: '22px', border: '1px solid var(--color-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--color-forest-dark)' }}>Quick Comparison</h3>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {[
                          ['Orders vs previous', dashboardInsights.allRangeOrdersCount - dashboardInsights.previousOrdersCount],
                          ['Revenue vs previous', dashboardInsights.rangeRevenue - dashboardInsights.previousRevenue],
                          ['Pending orders', dashboardInsights.pendingConfirmation],
                          ['Low stock', dashboardInsights.lowStockProducts]
                        ].map(([label, value]) => (
                          <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '16px', background: '#f8faf8' }}>
                            <span style={{ color: 'gray' }}>{label}</span>
                            <strong style={{ color: (value as number) >= 0 ? '#2e7d32' : '#c62828' }}>{typeof value === 'number' && String(label).includes('Revenue') ? formatCurrency(value as number) : formatCompact(value as number)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', fontWeight: '800', margin: 0 }}>📦 পণ্য ব্যবস্থাপনা</h2>
                {!showProductForm && (
                  <button onClick={openAddForm} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: 'var(--border-radius-md)' }}>
                    <PlusCircle size={18} /> নতুন পণ্য যোগ করুন
                  </button>
                )}
              </div>

              {/* Product Form Add / Edit */}
              {showProductForm ? (
                <div style={{ background: '#fff', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '2px solid var(--color-mud)', boxShadow: '0 10px 25px var(--color-shadow)', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-mangrove)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '25px' }}>
                    {editingProduct ? '✏️ পণ্য পরিবর্তন করুন' : '➕ নতুন পণ্য সংযোজন ফরম'}
                  </h3>

                  <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* ID Slug */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পণ্য ID (Slug-like, e.g. honey-kholisha) *</label>
                      <input 
                        type="text" 
                        value={pId}
                        onChange={(e) => setPId(e.target.value)}
                        disabled={!!editingProduct}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: honey-kholisha"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পণ্যের নাম (Bengali) *</label>
                      <input 
                        type="text" 
                        value={pTitle}
                        onChange={(e) => setPTitle(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: সুন্দরবনের খাঁটি খলিশা মধু"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>ক্যাটাগরি *</label>
                      <select 
                        value={pCategory}
                        onChange={(e) => setPCategory(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#fff' }}
                      >
                        {categories.map(c => (
                          <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>উপ-ক্যাটাগরি</label>
                      <input 
                        type="text" 
                        value={pSubcategory}
                        onChange={(e) => setPSubcategory(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: সুন্দরবনের খাঁটি মধু"
                      />
                    </div>

                    {/* Price Display */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>মূল্যমান লেখা (Price text display) *</label>
                      <input 
                        type="text" 
                        value={pPrice}
                        onChange={(e) => setPPrice(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: ৳৮৫০"
                      />
                    </div>

                    {/* Price Num */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>মূল্যমান সংখ্যা (GA4 Value) *</label>
                      <input 
                        type="number" 
                        value={pPriceNum}
                        onChange={(e) => setPPriceNum(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: 850"
                      />
                    </div>

                    {/* Weight */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>প্যাক সাইজ / ওজন *</label>
                      <input 
                        type="text" 
                        value={pWeight}
                        onChange={(e) => setPWeight(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: ৫০০ গ্রাম"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংগৃহীত স্থান</label>
                      <input 
                        type="text" 
                        value={pLocation}
                        onChange={(e) => setPLocation(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: গহীন সুন্দরবন"
                      />
                    </div>

                    {/* Harvest */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংগ্রহের সময়কাল</label>
                      <input 
                        type="text" 
                        value={pHarvest}
                        onChange={(e) => setPHarvest(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: মে ২০২৬"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>স্টক স্ট্যাটাস *</label>
                      <select 
                        value={pStatus}
                        onChange={(e) => setPStatus(e.target.value as any)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#fff' }}
                      >
                        <option value="in-stock">ইন স্টক (In-stock)</option>
                        <option value="out-of-stock">আউট অফ স্টক (Out-of-stock)</option>
                      </select>
                    </div>

                    {/* Stock limit */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>স্টক পরিমাণ *</label>
                      <input 
                        type="number" 
                        value={pStock}
                        onChange={(e) => setPStock(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="जैसे: 10"
                      />
                    </div>

                    {/* Featured */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                      <input 
                        type="checkbox" 
                        id="featured" 
                        checked={pFeatured} 
                        onChange={(e) => setPFeatured(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-mangrove)' }}
                      />
                      <label htmlFor="featured" style={{ fontSize: '0.92rem', color: 'var(--color-forest-dark)', fontWeight: 'bold', cursor: 'pointer' }}>হোমপেজে ফিচারড পণ্য হিসেবে দেখান</label>
                    </div>

                    {/* Image Upload Input */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পণ্যের ছবি *</label>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={pImg} 
                          onChange={(e) => setPImg(e.target.value)} 
                          placeholder="আপলোড করা ফাইলের URL এখানে আসবে..."
                          style={{ flexGrow: 1, padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#f9f9f9' }} 
                        />
                        
                        <div style={{ position: 'relative' }}>
                          <button 
                            type="button" 
                            disabled={uploading}
                            className="btn btn-outline" 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 15px', fontSize: '0.9rem' }}
                          >
                            <Upload size={16} /> {uploading ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}
                          </button>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                          />
                        </div>
                      </div>
                      {pImg && (
                        <div style={{ marginTop: '10px' }}>
                          <img src={getImageUrl(pImg)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
                        </div>
                      )}
                    </div>

                    {/* Story description */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংগ্রহের গল্প ও বিবরণ *</label>
                      <textarea 
                        value={pStory} 
                        onChange={(e) => setPStory(e.target.value)}
                        rows={4}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'inherit' }}
                        placeholder="পণ্যের সংগ্রহের বর্ণনা, বিশেষত্ব ও গল্প লিখুন..."
                      />
                    </div>

                    {/* Storage method */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংরক্ষণ পদ্ধতি *</label>
                      <textarea 
                        value={pStorage} 
                        onChange={(e) => setPStorage(e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'inherit' }}
                        placeholder="কীভাবে সংরক্ষণ করতে হবে..."
                      />
                    </div>

                    {/* Benefits lists */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>উপকারিতা ও বৈশিষ্ট্য সমূহ</label>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input 
                          type="text" 
                          value={benefitInput} 
                          onChange={(e) => setBenefitInput(e.target.value)} 
                          style={{ flexGrow: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }} 
                          placeholder="একটি উপকারিতা লিখুন (যেমন: রোগ প্রতিরোধ ক্ষমতা বাড়ায়)..." 
                        />
                        <button type="button" onClick={handleAddBenefit} className="btn btn-outline" style={{ padding: '8px 15px' }}>যোগ করুন</button>
                      </div>

                      <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {pBenefits.map((b, idx) => (
                          <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-sand)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.88rem' }}>
                            <span>✓ {b}</span>
                            <button type="button" onClick={() => handleRemoveBenefit(idx)} style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer' }}>মুছে দিন</button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Form actions */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                      <button type="button" onClick={() => setShowProductForm(false)} className="btn btn-outline" style={{ padding: '10px 20px' }}>বাতিল</button>
                      <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 25px' }}>
                        {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                      </button>
                    </div>

                  </form>
                </div>
              ) : (
                /* Products Table */
                <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-mud)', fontWeight: 'bold' }}>
                          <th style={{ padding: '12px' }}>ছবি</th>
                          <th style={{ padding: '12px' }}>নাম ও আইডি</th>
                          <th style={{ padding: '12px' }}>ক্যাটাগরি</th>
                          <th style={{ padding: '12px' }}>মূল্যমান</th>
                          <th style={{ padding: '12px' }}>স্টক</th>
                          <th style={{ padding: '12px' }}>স্ট্যাটাস</th>
                          <th style={{ padding: '12px' }}>ফিচারড</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'gray' }}>কোনো পণ্য পাওয়া যায়নি।</td>
                          </tr>
                        ) : (
                          products.map((prod) => (
                            <tr key={prod.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '12px' }}>
                                <img src={getImageUrl(prod.img)} alt={prod.title} style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: 'var(--color-sand)', borderRadius: '4px' }} />
                              </td>
                              <td style={{ padding: '12px' }}>
                                <strong style={{ color: 'var(--color-forest-dark)', display: 'block' }}>{prod.title}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'gray' }}>ID: {prod.id}</span>
                              </td>
                              <td style={{ padding: '12px' }}>{prod.category}</td>
                              <td style={{ padding: '12px', fontWeight: 'bold' }}>{prod.price} ({prod.priceNum})</td>
                              <td style={{ padding: '12px' }}>{prod.stock !== undefined ? prod.stock : 10}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                  backgroundColor: prod.status === 'in-stock' ? '#e8f5e9' : '#ffebee',
                                  color: prod.status === 'in-stock' ? '#2e7d32' : '#c62828'
                                }}>{prod.status}</span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                {prod.is_featured ? <span style={{ color: 'var(--color-honey-glow)', fontWeight: 'bold' }}>★ Featured</span> : 'No'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button onClick={() => openEditForm(prod)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', padding: '4px' }} title="এডিট"><Edit size={16} /></button>
                                  <button onClick={() => handleDeleteProduct(prod.id)} style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '4px' }} title="ডিলিট"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>🏷️ ক্যাটাগরি ব্যবস্থাপনা</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
                {/* Add Category Form */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)', height: 'fit-content' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', marginBottom: '15px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                    নতুন ক্যাটাগরি তৈরি করুন
                  </h3>
                  <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>ক্যাটাগরির নাম (যেমন: ফল)</label>
                      <input 
                        type="text" 
                        value={catName} 
                        onChange={(e) => setCatName(e.target.value)} 
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }} 
                        placeholder="যেমন: ফল" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>ক্যাটাগরি Slug (ID, e.g. fruit)</label>
                      <input 
                        type="text" 
                        value={catSlug} 
                        onChange={(e) => setCatSlug(e.target.value)} 
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }} 
                        placeholder="যেমন: fruit" 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <FolderPlus size={16} /> ক্যাটাগরি যোগ করুন
                    </button>
                  </form>
                </div>

                {/* Categories List */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', marginBottom: '15px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                    ক্যাটাগরি তালিকা ({categories.length})
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {categories.map((c) => (
                      <div 
                        key={c.slug}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 20px',
                          backgroundColor: 'var(--color-sand)',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--color-forest-dark)' }}>{c.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'gray', marginLeft: '10px' }}>Slug: {c.slug}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteCategory(c.slug)}
                          style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', fontWeight: '800', margin: 0 }}>📦 অর্ডার সমূহ</h2>
                <button 
                  onClick={exportToCSV}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
                >
                  📥 এক্সপোর্ট করুন (CSV)
                </button>
              </div>

              {/* Search & Filters */}
              <div style={{
                background: '#fff', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)',
                marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'
              }}>
                {/* Search query */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>অর্ডার খুঁজুন</label>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="অর্ডার নম্বর/গ্রাহক/মোবাইল..."
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Status filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>অর্ডার স্ট্যাটাস</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontSize: '0.88rem' }}
                  >
                    <option value="all">সকল অর্ডার</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="payment_submitted">Payment Submitted</option>
                    <option value="payment_verification">Payment Verification</option>
                    <option value="payment_approved">Payment Approved</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Payment filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পেমেন্ট স্ট্যাটাস</label>
                  <select 
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontSize: '0.88rem' }}
                  >
                    <option value="all">সকল পেমেন্ট</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
              
              {/* Order Detail Modal Modal view */}
              {selectedOrder && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(7, 34, 17, 0.6)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px'
                }}>
                  <div style={{
                    background: '#fff', borderRadius: 'var(--border-radius-lg)', border: '4px solid var(--color-mud)',
                    width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative'
                  }}>
                    <button 
                      onClick={() => setSelectedOrder(null)} 
                      style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                    >✕</button>

                    <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.3rem', marginBottom: '20px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginTop: 0 }}>
                      অর্ডার নম্বর: #{selectedOrder.transaction_id}
                    </h3>

                    {/* Edit Shipping, Payment & Courier Panel */}
                    <div style={{ backgroundColor: 'var(--color-sand)', padding: '20px', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>📍 অর্ডার বিবরণী, শিপিং, পেমেন্ট ও কুরিয়ার তথ্য সংশোধন করুন</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>গ্রাহকের নাম:</label>
                          <input 
                            type="text" 
                            value={editCustName}
                            onChange={(e) => setEditCustName(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>মোবাইল নম্বর:</label>
                          <input 
                            type="text" 
                            value={editCustPhone}
                            onChange={(e) => setEditCustPhone(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>পূর্ণ ঠিকানা:</label>
                          <textarea 
                            value={editCustAddr}
                            onChange={(e) => setEditCustAddr(e.target.value)}
                            rows={2}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>শহর/জেলা:</label>
                          <input 
                            type="text" 
                            value={editCustCity}
                            onChange={(e) => setEditCustCity(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>অर्डर সোর্স (Source):</label>
                          <select 
                            value={editOrderSource}
                            onChange={(e) => setEditOrderSource(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontWeight: 'bold' }}
                          >
                            <option value="Website">Website</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Instagram">Instagram</option>
                            <option value="TikTok">TikTok</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Messenger">Messenger</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Phone Call">Phone Call</option>
                            <option value="Walk-in Customer">Walk-in Customer</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>অগ্রিম পরিশোধ (Advance Paid):</label>
                          <input 
                            type="number" 
                            min="0"
                            value={editAdvancePaid}
                            onChange={(e) => setEditAdvancePaid(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>সম্পূর্ণ বিল পরিশোধিত? (Fully Paid?):</label>
                          <select 
                            value={Number(editTotalPaid || 0) > 0 ? "yes" : "no"}
                            onChange={(e) => setEditTotalPaid(e.target.value === "yes" ? String(Math.max(0, Number(selectedOrder.total || 0) - Number(editAdvancePaid || 0))) : '')}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                          >
                            <option value="no">না (No)</option>
                            <option value="yes">হ্যাঁ (Yes)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>কুরিয়ার কালেকশন (Courier Collection):</label>
                          <input 
                            type="number" 
                            min="0"
                            value={editCourierCollection}
                            onChange={(e) => setEditCourierCollection(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>কুরিয়ার কোম্পানির নাম:</label>
                          <input 
                            type="text" 
                            value={editCourierName}
                            onChange={(e) => setEditCourierName(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>কুরিয়ার ট্র্যাকিং নম্বর:</label>
                          <input 
                            type="text" 
                            value={editCourierTracking}
                            onChange={(e) => setEditCourierTracking(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>পেমেন্ট প্রুফ ইমেজ আপলোড:</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleUploadProofImage}
                            disabled={uploadingProof}
                            style={{ display: 'block', marginBottom: '8px' }}
                          />
                          {uploadingProof && <span style={{ fontSize: '0.8rem', color: 'var(--color-mangrove)' }}>আপলোড হচ্ছে...</span>}
                          {editPaymentProofImage && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                              <a href={getImageUrl(editPaymentProofImage)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                <img src={getImageUrl(editPaymentProofImage)} alt="Proof Preview" style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: '6px' }} />
                                <span style={{ fontSize: '0.72rem', color: 'var(--color-mangrove)', fontWeight: 'bold' }}>View photo</span>
                              </a>
                              <span style={{ fontSize: '0.8rem', color: 'gray' }}>সফলভাবে সেট করা হয়েছে।</span>
                              <button type="button" onClick={() => setEditPaymentProofImage('')} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>রিমুভ করুন</button>
                            </div>
                          )}
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>পেমেন্ট নোটসমূহ:</label>
                          <input 
                            type="text" 
                            value={editPaymentNotes}
                            onChange={(e) => setEditPaymentNotes(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>অভ্যন্তরীণ নোট (Internal Notes - Admin Only):</label>
                          <textarea 
                            value={editInternalNotes}
                            onChange={(e) => setEditInternalNotes(e.target.value)}
                            rows={2}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit' }}
                          />
                        </div>

                        {/* Live computations */}
                        <div style={{ gridColumn: 'span 2', background: '#fff', border: '1px solid var(--color-border)', padding: '15px', borderRadius: '6px', marginTop: '10px' }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>📊 পেমেন্ট হিসাব (লাইভ):</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.85rem', textAlign: 'center' }}>
                            <div style={{ background: 'var(--color-sand)', padding: '8px', borderRadius: '4px' }}>
                              <span style={{ display: 'block', color: 'gray' }}>সর্বমোট বিল:</span>
                              <strong>৳{selectedOrder.total}</strong>
                            </div>
                            <div style={{ background: '#e8f5e9', padding: '8px', borderRadius: '4px' }}>
                              <span style={{ display: 'block', color: 'gray' }}>পরিশোধিত:</span>
                              <strong style={{ color: 'green' }}>৳{Number(editAdvancePaid || 0) + Number(editTotalPaid || 0)}</strong>
                            </div>
                            <div style={{ background: '#ffebee', padding: '8px', borderRadius: '4px' }}>
                              <span style={{ display: 'block', color: 'gray' }}>বাকি বকেয়া (Due):</span>
                              <strong style={{ color: 'red' }}>৳{selectedOrder.total - Number(editAdvancePaid || 0) - Number(editTotalPaid || 0)}</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button 
                            type="button" 
                            onClick={handleSaveShippingInfo}
                            className="btn btn-primary"
                            style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: 'bold' }}
                          >
                            পরিবর্তন সংরক্ষণ করুন
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submitted Payments Panel */}
                    {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                      <div style={{ border: '2px dashed var(--color-honey)', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fffcf4' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '0.98rem', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>💳 গ্রাহকের প্রেরিত পেমেন্ট বিবরণী:</h4>
                        {selectedOrder.payments.map((pay: any) => (
                          <div key={pay.id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div style={{ flexGrow: 1, fontSize: '0.88rem' }}>
                              <p style={{ margin: '0 0 5px 0' }}><strong>পদ্ধতি:</strong> {pay.payment_method}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>Transaction ID:</strong> <strong style={{ color: 'var(--color-mangrove)' }}>{pay.transaction_id}</strong></p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>টাকার পরিমাণ:</strong> ৳{pay.amount}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>তারিখ:</strong> {new Date(pay.payment_date).toLocaleString('bn-BD')}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>অবস্থা:</strong> 
                                <span style={{ marginLeft: '6px', fontWeight: 'bold', color: pay.status === 'approved' ? 'green' : pay.status === 'rejected' ? 'red' : 'orange' }}>
                                  {pay.status === 'approved' ? 'অনুমোদিত (Approved)' : pay.status === 'rejected' ? 'প্রত্যাখ্যাত (Rejected)' : 'পেন্ডিং (Pending)'}
                                </span>
                              </p>
                              {pay.rejection_reason && <p style={{ margin: '5px 0 0 0', color: 'red' }}><strong>প্রত্যাখ্যানের কারণ:</strong> {pay.rejection_reason}</p>}
                            </div>

                            {pay.screenshot_url && (
                              <div style={{ width: '120px', flexShrink: 0, textAlign: 'center' }}>
                                <a href={getImageUrl(pay.screenshot_url)} target="_blank" rel="noreferrer">
                                  <img 
                                    src={getImageUrl(pay.screenshot_url)} 
                                    alt="Payment screenshot" 
                                    style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                  />
                                </a>
                                <span style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginTop: '4px' }}>বড় করে দেখতে ক্লিক করুন</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Approve/Reject verification buttons */}
                        {selectedOrder.payments.some((p: any) => p.status === 'pending') && (
                          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '15px', marginTop: '15px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>পেমেন্ট অনুমোদন অ্যাকশন:</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                onClick={() => handleApprovePayment(selectedOrder.id, selectedOrder.payments.find((p: any) => p.status === 'pending').id)}
                                className="btn btn-primary"
                                style={{ padding: '8px 15px', fontSize: '0.85rem', fontWeight: 'bold' }}
                              >
                                পেমেন্ট অনুমোদন করুন (Approve)
                              </button>
                              
                              <div style={{ display: 'flex', gap: '5px', flexGrow: 1 }}>
                                <input 
                                  type="text" 
                                  placeholder="বাতিলের কারণ লিখুন..." 
                                  value={rejectReasonInput}
                                  onChange={(e) => setRejectReasonInput(e.target.value)}
                                  style={{ flexGrow: 1, padding: '6px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.82rem' }}
                                />
                                <button 
                                  onClick={() => handleRejectPayment(selectedOrder.id, selectedOrder.payments.find((p: any) => p.status === 'pending').id, rejectReasonInput)}
                                  className="btn btn-outline"
                                  style={{ padding: '8px 12px', fontSize: '0.82rem', borderColor: '#ff4444', color: '#ff4444' }}
                                >
                                  প্রত্যাখ্যান (Reject)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Update actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-mud)' }}>অর্ডার স্ট্যাটাস</label>
                        <select 
                          value={selectedOrder.order_status} 
                          onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                        >
                          <option value="pending_payment">Pending Payment</option>
                          <option value="payment_submitted">Payment Submitted</option>
                          <option value="payment_verification">Payment Verification</option>
                          <option value="payment_approved">Payment Approved</option>
                          <option value="processing">Processing</option>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-mud)' }}>পেমেন্ট স্ট্যাটাস</label>
                        <select 
                          value={selectedOrder.payment_status} 
                          onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                    </div>

                    {/* Items table */}
                    <h4 style={{ color: 'var(--color-forest-dark)', fontSize: '0.98rem', marginBottom: '10px' }}>📦 পণ্য তালিকা:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {(selectedOrder.order_items || []).map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-sand)', paddingBottom: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-forest-dark)', fontSize: '0.92rem' }}>{item.products?.title || 'Unknown Product'}</span>
                            <span style={{ fontSize: '0.78rem', color: 'gray', marginLeft: '10px' }}>x{item.quantity} ({item.products?.weight})</span>
                          </div>
                          <span style={{ fontWeight: 'bold' }}>৳{item.price_num * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right', alignItems: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '15px' }}>
                      <div style={{ display: 'flex', width: '200px', justifyContent: 'space-between', fontSize: '0.85rem', color: 'gray' }}>
                        <span>উপমোট মূল্য:</span>
                        <span>৳{selectedOrder.subtotal}</span>
                      </div>
                      <div style={{ display: 'flex', width: '200px', justifyContent: 'space-between', fontSize: '0.85rem', color: 'gray' }}>
                        <span>ডেলিভারি চার্জ:</span>
                        <span>৳{selectedOrder.shipping_cost}</span>
                      </div>
                      <div style={{ display: 'flex', width: '200px', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-mangrove)', borderTop: '1px dashed var(--color-border)', paddingTop: '6px', marginTop: '4px' }}>
                        <span>সর্বমোট:</span>
                        <span>৳{selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order List Table */}
              <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-mud)', fontWeight: 'bold' }}>
                        <th style={{ padding: '12px' }}>অর্ডার নম্বর</th>
                        <th style={{ padding: '12px' }}>গ্রাহকের নাম</th>
                        <th style={{ padding: '12px' }}>মোবাইল</th>
                        <th style={{ padding: '12px' }}>তারিখ</th>
                        <th style={{ padding: '12px' }}>মোট</th>
                        <th style={{ padding: '12px' }}>অর্ডার স্ট্যাটাস</th>
                        <th style={{ padding: '12px' }}>পেমেন্ট স্ট্যাটাস</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>বিস্তারিত</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => {
                        const matchesSearch = 
                          o.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.phone.includes(searchQuery);
                        
                        const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
                        const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;

                        return matchesSearch && matchesStatus && matchesPayment;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'gray' }}>কোনো অর্ডার পাওয়া যায়নি।</td>
                        </tr>
                      ) : (
                        orders.filter(o => {
                          const matchesSearch = 
                            o.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.phone.includes(searchQuery);
                          
                          const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
                          const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;

                          return matchesSearch && matchesStatus && matchesPayment;
                        }).map((o) => (
                          <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>#{o.transaction_id}</td>
                            <td style={{ padding: '12px' }}>{o.customer_name}</td>
                            <td style={{ padding: '12px' }}>{o.phone}</td>
                            <td style={{ padding: '12px' }}>{new Date(o.created_at).toLocaleDateString('bn-BD')}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--color-mangrove)' }}>৳{o.total}</td>
                            <td style={{ padding: '12px' }}>
                              <select 
                                value={o.order_status} 
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                style={{
                                  padding: '4px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#fff', fontWeight: 'bold',
                                  color: o.order_status === 'delivered' ? '#2e7d32' : o.order_status === 'cancelled' ? '#c62828' : '#e65100'
                                }}
                              >
                                <option value="pending_payment">Pending Payment</option>
                                <option value="payment_submitted">Payment Submitted</option>
                                <option value="payment_verification">Payment Verification</option>
                                <option value="payment_approved">Payment Approved</option>
                                <option value="processing">Processing</option>
                                <option value="packed">Packed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <select 
                                value={o.payment_status} 
                                onChange={(e) => handleUpdatePaymentStatus(o.id, e.target.value)}
                                style={{
                                  padding: '4px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#fff', fontWeight: 'bold',
                                  color: o.payment_status === 'paid' ? '#2e7d32' : '#c62828'
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button onClick={() => setSelectedOrder(o)} style={{ background: 'none', border: 'none', color: 'var(--color-mangrove)', cursor: 'pointer', padding: '4px' }}>
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MESSAGES */}
          {activeTab === 'messages' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>✉️ বার্তা ইনবক্স</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {messages.length === 0 ? (
                  <div style={{ background: '#fff', padding: '30px', textAlign: 'center', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', color: 'gray' }}>
                    ইনবক্স একদম খালি! কোনো নতুন বার্তা পাওয়া যায়নি।
                  </div>
                ) : (
                  messages.map((m) => (
                    <div 
                      key={m.id}
                      style={{
                        background: '#fff', padding: '25px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)',
                        borderLeft: `5px solid ${m.status === 'unread' ? 'var(--color-honey-glow)' : 'var(--color-border)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '15px' }}>
                        <div>
                          <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem', display: 'block' }}>{m.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'gray' }}>📱 {m.phone} | ✉️ {m.email || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'gray' }}>{new Date(m.created_at).toLocaleString('bn-BD')}</span>
                          
                          <select 
                            value={m.status} 
                            onChange={(e) => handleUpdateMessageStatus(m.id, e.target.value)}
                            style={{ padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.78rem', backgroundColor: '#fff' }}
                          >
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                          </select>
                          
                          <button 
                            onClick={() => handleDeleteMessage(m.id)}
                            style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-light)', margin: 0, fontWeight: m.status === 'unread' ? 'bold' : 'normal', whiteSpace: 'pre-wrap' }}>
                        <strong>বিষয়: {m.subject || 'সাধারণ যোগাযোগ'}</strong><br />
                        {m.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MANUAL ORDERS */}
          {activeTab === 'manual-orders' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>➕ ম্যানুয়াল অর্ডার তৈরি করুন (Facebook, Phone Call, WhatsApp, Walk-in)</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
                {/* Left Side: Customer & Shipping Details */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '20px' }}>📍 গ্রাহক ও শিপিং তথ্য</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.88rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>গ্রাহকের নাম *:</label>
                      <input 
                        type="text" 
                        required
                        value={manualCustName}
                        onChange={(e) => setManualCustName(e.target.value)}
                        placeholder="গ্রাহকের পুরো নাম লিখুন..."
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>মোবাইল নম্বর *:</label>
                      <input 
                        type="text" 
                        required
                        value={manualCustPhone}
                        onChange={(e) => setManualCustPhone(e.target.value)}
                        placeholder="মোবাইল নম্বর লিখুন..."
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>ইমেইল (ঐচ্ছিক):</label>
                      <input 
                        type="email" 
                        value={manualCustEmail}
                        onChange={(e) => setManualCustEmail(e.target.value)}
                        placeholder="গ্রাহকের ইমেইল..."
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পূর্ণ ঠিকানা *:</label>
                      <textarea 
                        required
                        value={manualCustAddress}
                        onChange={(e) => setManualCustAddress(e.target.value)}
                        placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা..."
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>শহর/জেলা *:</label>
                      <input 
                        type="text" 
                        required
                        value={manualCustDistrict}
                        onChange={(e) => setManualCustDistrict(e.target.value)}
                        placeholder="যেমন: খুলনা বা বাগেরহাট"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>বিভাগ *:</label>
                      <select 
                        value={manualCustDivision}
                        onChange={(e) => setManualCustDivision(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                      >
                        <option value="Khulna">Khulna</option>
                        <option value="Dhaka">Dhaka</option>
                        <option value="Chittagong">Chittagong</option>
                        <option value="Rajshahi">Rajshahi</option>
                        <option value="Rangpur">Rangpur</option>
                        <option value="Barisal">Barisal</option>
                        <option value="Sylhet">Sylhet</option>
                        <option value="Mymensingh">Mymensingh</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পোস্টাল কোড / জিপ:</label>
                      <input 
                        type="text" 
                        value={manualCustZip}
                        onChange={(e) => setManualCustZip(e.target.value)}
                        placeholder="যেমন: ৯১০০"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>অর্ডার সোর্স *:</label>
                      <select 
                        value={manualOrderSource}
                        onChange={(e) => setManualOrderSource(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontWeight: 'bold' }}
                      >
                        <option value="Facebook">Facebook</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Phone Call">Phone Call</option>
                        <option value="Walk-in Customer">Walk-in Customer</option>
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Messenger">Messenger</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginTop: '25px', marginBottom: '20px' }}>🚚 কুরিয়ার ও শিপিং বিবরণ</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.88rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>শিপিং চার্জ (৳):</label>
                      <input 
                        type="number" 
                        value={manualShippingCharge}
                        onChange={(e) => setManualShippingCharge(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>কুরিয়ার কোম্পানির নাম:</label>
                      <input 
                        type="text" 
                        value={manualCourierName}
                        onChange={(e) => setManualCourierName(e.target.value)}
                        placeholder="যেমন: Sundarban, Steadfast"
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>কুরিয়ার ট্র্যাকিং নম্বর:</label>
                      <input 
                        type="text" 
                        value={manualTrackingNumber}
                        onChange={(e) => setManualTrackingNumber(e.target.value)}
                        placeholder="ট্র্যাকিং আইডি/কনসাইনমেন্ট নম্বর..."
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginTop: '25px', marginBottom: '20px' }}>💳 পেমেন্ট তথ্য</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.88rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পেমেন্ট পদ্ধতি:</label>
                      <select 
                        value={manualPaymentMethod}
                        onChange={(e) => setManualPaymentMethod(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                      >
                        <option value="cod">Cash on Delivery (COD)</option>
                        <option value="bkash">bKash</option>
                        <option value="nagad">Nagad</option>
                        <option value="rocket">Rocket</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>অগ্রিম পেমেন্ট (৳):</label>
                      <input 
                        type="number" 
                        min="0"
                        value={manualAdvancePaid}
                        onChange={(e) => setManualAdvancePaid(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      />
                    </div>
                    {Number(manualAdvancePaid || 0) > 0 && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>Transaction ID (পেমেন্ট ট্রানজেকশন):</label>
                          <input 
                            type="text" 
                            value={manualTransactionId}
                            onChange={(e) => setManualTransactionId(e.target.value)}
                            placeholder="যেমন: Bkash TrxID"
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পেমেন্ট নোট:</label>
                          <input 
                            type="text" 
                            value={manualPaymentNotes}
                            onChange={(e) => setManualPaymentNotes(e.target.value)}
                            placeholder="পেমেন্ট সম্পর্কিত কোনো নোট..."
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                      </>
                    )}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>অর্ডার নোট (অ্যাডমিন নোট):</label>
                      <textarea 
                        value={manualOrderNotes}
                        onChange={(e) => setManualOrderNotes(e.target.value)}
                        placeholder="কাস্টমারকে কাস্টমাইজেশন বা ডেলিভারি নিয়ে বিশেষ নির্দেশনা..."
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side: Product Search & Selected Products */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {/* Product Search & Selector */}
                  <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '20px' }}>🔍 প্রোডাক্ট খুঁজুন ও যোগ করুন</h3>
                    
                    <input 
                      type="text"
                      placeholder="নাম বা ওজন দিয়ে খুঁজুন (যেমন: মধু, ৫০০গ্রাম)..."
                      value={manualSearchQuery}
                      onChange={(e) => setManualSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '10px 15px', border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: '15px' }}
                    />

                    {manualSearchQuery.trim() !== '' && (
                      <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fcfcfc' }}>
                        {products
                          .filter(p => 
                            p.title.toLowerCase().includes(manualSearchQuery.toLowerCase()) || 
                            (p.weight && p.weight.toLowerCase().includes(manualSearchQuery.toLowerCase()))
                          )
                          .map(prod => (
                            <div 
                              key={prod.id} 
                              onClick={() => {
                                // Add or update quantity
                                setSelectedManualItems(prev => {
                                  const existing = prev.find(item => item.product.id === prod.id);
                                  if (existing) {
                                    return prev.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item);
                                  }
                                  return [...prev, { product: prod, quantity: 1 }];
                                });
                                setManualSearchQuery('');
                              }}
                              style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                              className="search-item-hover"
                            >
                              <img src={getImageUrl(prod.img)} alt={prod.title} style={{ width: '40px', height: '40px', objectFit: 'contain', background: 'var(--color-sand)', borderRadius: '4px' }} />
                              <div style={{ flexGrow: 1, fontSize: '0.86rem' }}>
                                <strong style={{ color: 'var(--color-forest-dark)', display: 'block' }}>{prod.title}</strong>
                                <span style={{ color: 'gray', fontSize: '0.78rem' }}>ওজন: {prod.weight || 'N/A'} | মূল্য: ৳{prod.priceNum}</span>
                              </div>
                              <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--color-sand)', padding: '2px 8px', borderRadius: '10px', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>+ যোগ করুন</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  {/* Selected Products Breakdown */}
                  <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '20px' }}>🛒 নির্বাচিত প্রোডাক্টসমূহ</h3>

                    {selectedManualItems.length === 0 ? (
                      <div style={{ color: 'gray', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>কোনো প্রোডাক্ট যোগ করা হয়নি। উপরে সার্চ করে প্রোডাক্ট যোগ করুন।</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {selectedManualItems.map(item => (
                          <div key={item.product.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: '12px', alignItems: 'center', borderBottom: '1px solid #f1f1f1', paddingBottom: '10px' }}>
                            <img src={getImageUrl(item.product.img)} alt={item.product.title} style={{ width: '50px', height: '50px', objectFit: 'contain', background: 'var(--color-sand)', borderRadius: '6px' }} />
                            <div>
                              <span style={{ fontSize: '0.88rem', fontWeight: 'bold', display: 'block' }}>{item.product.title}</span>
                              <span style={{ fontSize: '0.78rem', color: 'gray' }}>ওজন: {item.product.weight || 'N/A'} | মূল্য: ৳{item.product.priceNum}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button 
                                onClick={() => setSelectedManualItems(prev => prev.map(i => i.product.id === item.product.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                                style={{ padding: '2px 8px', border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '4px', cursor: 'pointer' }}
                              >-</button>
                              <strong style={{ fontSize: '0.9rem' }}>{item.quantity}</strong>
                              <button 
                                onClick={() => setSelectedManualItems(prev => prev.map(i => i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i))}
                                style={{ padding: '2px 8px', border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '4px', cursor: 'pointer' }}
                              >+</button>
                              <button 
                                onClick={() => setSelectedManualItems(prev => prev.filter(i => i.product.id !== item.product.id))}
                                style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                              >✕</button>
                            </div>
                          </div>
                        ))}

                        {/* Calculation Summary */}
                        {(() => {
                          const subtotal = selectedManualItems.reduce((sum, item) => sum + item.product.priceNum * item.quantity, 0);
                          const total = subtotal + Number(manualShippingCharge || 0);
                          const due = total - Number(manualAdvancePaid || 0);
                          return (
                            <div style={{ background: 'var(--color-sand)', padding: '20px', borderRadius: '8px', marginTop: '10px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>প্রোডাক্ট মোট:</span>
                                <strong>৳{subtotal}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>শিপিং চার্জ:</span>
                                <strong>৳{manualShippingCharge}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: '8px', fontSize: '1.05rem', color: 'var(--color-mangrove)' }}>
                                <span>সর্বমোট বিল:</span>
                                <strong>৳{total}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                                <span>অগ্রিম পরিশোধিত:</span>
                                <strong>- ৳{manualAdvancePaid}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '8px', fontSize: '1.15rem', color: '#ff4444', fontWeight: '800' }}>
                                <span>বকেয়া পরিমাণ (Due):</span>
                                <strong>৳{due}</strong>
                              </div>
                            </div>
                          );
                        })()}

                        <button 
                          type="button"
                          onClick={handleCreateManualOrder}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
                        >
                          📥 অর্ডারটি সিস্টেমে যোগ করুন
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>⚙️ সামাজিক যোগাযোগ মাধ্যম লিংক সেটিংস</h2>
              
              <div style={{ background: '#fff', padding: '40px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)', maxWidth: '600px' }}>
                <p style={{ fontSize: '0.9rem', color: 'gray', marginBottom: '25px', lineHeight: '1.5' }}>
                  এখানে সামাজিক মাধ্যমের ইউআরএল লিংকগুলো আপডেট করুন। এগুলো ওয়েবসাইটের ফুটার সেকশনে প্রদর্শিত হবে। কোনো লিংক ফাকা রাখলে সেটি ফুটারে স্বয়ংক্রিয়ভাবে হাইড হয়ে যাবে।
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-forest-dark)', marginBottom: '6px' }}>🔗 ফেসবুক পেইজ লিংক (Facebook Page URL):</label>
                    <input 
                      type="url" 
                      value={fbUrl}
                      onChange={(e) => setFbUrl(e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-forest-dark)', marginBottom: '6px' }}>🔗 ইন্সটাগ্রাম লিংক (Instagram Profile URL):</label>
                    <input 
                      type="url" 
                      value={instaUrl}
                      onChange={(e) => setInstaUrl(e.target.value)}
                      placeholder="https://instagram.com/yourprofile"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-forest-dark)', marginBottom: '6px' }}>🔗 টিকটক প্রোফাইল লিংক (TikTok Profile URL):</label>
                    <input 
                      type="url" 
                      value={tiktokUrl}
                      onChange={(e) => setTiktokUrl(e.target.value)}
                      placeholder="https://tiktok.com/@yourusername"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-forest-dark)', marginBottom: '6px' }}>🔗 ইউটিউব চ্যানেল লিংক (YouTube Channel URL):</label>
                    <input 
                      type="url" 
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-forest-dark)', marginBottom: '6px' }}>📞 হোয়াটসঅ্যাপ নম্বর (WhatsApp Number with Country Code):</label>
                    <input 
                      type="text" 
                      value={waNum}
                      onChange={(e) => setWaNum(e.target.value)}
                      placeholder="+8801920723213"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button 
                      type="button" 
                      onClick={handleSaveSocialSettings}
                      className="btn btn-primary"
                      style={{ padding: '12px 25px', fontSize: '0.95rem', fontWeight: 'bold' }}
                    >
                      💾 সেটিংস সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
