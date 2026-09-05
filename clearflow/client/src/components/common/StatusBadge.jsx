import React from 'react';
import { PAYMENT_STATUS_MAP, RECOVERY_STATUS_MAP } from '../../utils/formatters';

export function StatusBadge({ status, type = 'payment' }) {
  const map = type === 'payment' ? PAYMENT_STATUS_MAP : RECOVERY_STATUS_MAP;
  const config = map[status] || { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
}
