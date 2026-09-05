/**
 * Format currency in Indian Rupees (INR)
 * Formats with ₹ symbol and Indian numbering system (e.g. ₹85,000, ₹18.6 Lakhs, ₹28.4 Cr)
 */
export function formatINR(amount, compact = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = Number(amount);

  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format relative or full dates
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Status colors and styles
 */
export const PAYMENT_STATUS_MAP = {
  SUCCESS: { label: 'SUCCESS', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: 'FAILED', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  PENDING: { label: 'PENDING', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  REFUNDED: { label: 'REFUNDED', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
};

export const RECOVERY_STATUS_MAP = {
  NOT_REQUIRED: { label: 'Not Required', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
  PENDING: { label: 'Pending Retry', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  RECOVERED: { label: 'Recovered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  UNRECOVERABLE: { label: 'Unrecoverable', bg: 'bg-slate-100 text-slate-500 border-slate-200' }
};

export const FAILURE_REASON_LABELS = {
  INSUFFICIENT_FUNDS: 'Insufficient Funds',
  BANK_DECLINED: 'Bank Declined',
  NETWORK_ERROR: 'Network Error',
  AUTHENTICATION_FAILURE: 'Auth Failure',
  EXPIRED_CARD: 'Expired Card',
  TIMEOUT: 'Timeout',
  UNKNOWN: 'Unknown'
};

export const PROBABILITY_LEVEL_COLORS = {
  'VERY HIGH': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'HIGH': 'text-teal-700 bg-teal-50 border-teal-200',
  'MEDIUM': 'text-amber-700 bg-amber-50 border-amber-200',
  'LOW': 'text-orange-700 bg-orange-50 border-orange-200',
  'VERY LOW': 'text-rose-700 bg-rose-50 border-rose-200'
};
