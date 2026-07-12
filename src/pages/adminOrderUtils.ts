import type { OrderSource, PaymentMethod } from '../services/dataService';

export const socialOrderSources: OrderSource[] = [
  'Facebook',
  'Instagram',
  'TikTok',
  'WhatsApp',
  'Messenger',
  'Phone Call',
  'Walk-in Customer',
  'Other'
];

export const orderStatusOptions = [
  'pending_payment',
  'payment_submitted',
  'under_review',
  'payment_approved',
  'order_confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'payment_rejected',
  'correction_requested'
] as const;

export const paymentStatusOptions = [
  'pending_payment',
  'payment_submitted',
  'under_review',
  'payment_approved',
  'payment_rejected',
  'paid',
  'failed',
  'refunded',
  'correction_requested'
] as const;

export const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cod', label: 'Cash on Delivery (COD)' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank_transfer', label: 'Bank Transfer' }
];

export const dateRangeOptions = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' }
] as const;

export const formatCurrency = (value: number): string => `৳${Math.round(value || 0).toLocaleString('bn-BD')}`;

export const formatDateTime = (value?: string | null): string => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('bn-BD');
};

export const formatDate = (value?: string | null): string => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('bn-BD');
};

export const formatOrderSource = (source?: string | null): string => source || 'Website';

export const formatOrderStatus = (status?: string | null): string => {
  const labelMap: Record<string, string> = {
    pending: 'Pending',
    pending_payment: 'Pending Payment',
    payment_submitted: 'Payment Submitted',
    under_review: 'Under Review',
    payment_approved: 'Payment Approved',
    order_confirmed: 'Order Confirmed',
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    payment_rejected: 'Payment Rejected',
    correction_requested: 'Correction Requested',
    'Order Placed': 'Order Placed',
    'Payment Confirmed': 'Payment Confirmed',
    'Order Packing': 'Order Packing',
    'Order Shipping': 'Order Shipping',
    'Order Delivered': 'Order Delivered',
    'Order Cancelled': 'Order Cancelled'
  };

  return labelMap[String(status || '')] || String(status || 'Pending');
};

export const formatPaymentStatus = (status?: string | null): string => {
  const labelMap: Record<string, string> = {
    pending: 'Pending',
    pending_payment: 'Pending Payment',
    payment_submitted: 'Payment Submitted',
    under_review: 'Under Review',
    payment_approved: 'Approved',
    payment_rejected: 'Rejected',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
    correction_requested: 'Correction Requested'
  };

  return labelMap[String(status || '')] || String(status || 'Pending');
};

export const statusTone = (value?: string | null): { background: string; color: string } => {
  const status = String(value || '').toLowerCase();

  if (status.includes('delivered') || status === 'paid' || status === 'payment_approved') {
    return { background: '#e8f5e9', color: '#2e7d32' };
  }

  if (status.includes('cancel') || status.includes('reject') || status === 'failed') {
    return { background: '#ffebee', color: '#c62828' };
  }

  if (status.includes('refund')) {
    return { background: '#fff3e0', color: '#e65100' };
  }

  if (status.includes('review') || status.includes('submitted')) {
    return { background: '#e3f2fd', color: '#1565c0' };
  }

  return { background: '#f1f5f9', color: '#334155' };
};

export const sourceTone = (source?: string | null): { background: string; color: string } => {
  const value = String(source || '').toLowerCase();

  if (value === 'website') return { background: '#e8f5e9', color: '#2e7d32' };
  if (value.includes('facebook')) return { background: '#e3f2fd', color: '#1565c0' };
  if (value.includes('instagram')) return { background: '#fce4ec', color: '#ad1457' };
  if (value.includes('tiktok')) return { background: '#ede7f6', color: '#5e35b1' };
  if (value.includes('whatsapp')) return { background: '#e8f5e9', color: '#2e7d32' };
  if (value.includes('messenger')) return { background: '#e0f7fa', color: '#006064' };
  if (value.includes('phone')) return { background: '#fff3e0', color: '#ef6c00' };
  if (value.includes('walk-in')) return { background: '#f3e5f5', color: '#6a1b9a' };
  return { background: '#f1f5f9', color: '#334155' };
};

export const buildPagination = (currentPage: number, totalPages: number): number[] => {
  if (totalPages <= 1) return [1];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
};

export const getRangeBounds = (range: string, now: Date = new Date()): { start?: Date; end?: Date } => {
  if (!range || range === 'all') return {};

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

  switch (range) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': {
      const day = new Date(now);
      day.setDate(day.getDate() - 1);
      return { start: startOfDay(day), end: endOfDay(day) };
    }
    case 'last_7_days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case 'last_30_days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case 'this_month':
      return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: endOfDay(now) };
    case 'last_month': {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { start, end };
    }
    case 'this_year':
      return { start: startOfDay(new Date(now.getFullYear(), 0, 1)), end: endOfDay(now) };
    default:
      return {};
  }
};

export const createChallenge = (): { question: string; answer: number } => {
  const a = Math.floor(1 + Math.random() * 9);
  const b = Math.floor(1 + Math.random() * 9);
  const add = Math.random() > 0.5;
  return add
    ? { question: `${a} + ${b} = ?`, answer: a + b }
    : { question: `${Math.max(a, b)} - ${Math.min(a, b)} = ?`, answer: Math.max(a, b) - Math.min(a, b) };
};
