import React from 'react';
import { FAILURE_REASON_LABELS } from '../../utils/formatters';

export function FailureReasonBadge({ reason }) {
  if (!reason) return <span className="text-slate-400 text-xs">—</span>;

  const label = FAILURE_REASON_LABELS[reason] || reason;

  const styleMap = {
    INSUFFICIENT_FUNDS: 'bg-amber-50 text-amber-800 border-amber-200',
    BANK_DECLINED: 'bg-rose-50 text-rose-800 border-rose-200',
    NETWORK_ERROR: 'bg-blue-50 text-blue-800 border-blue-200',
    AUTHENTICATION_FAILURE: 'bg-purple-50 text-purple-800 border-purple-200',
    EXPIRED_CARD: 'bg-slate-100 text-slate-700 border-slate-300',
    TIMEOUT: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    UNKNOWN: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const style = styleMap[reason] || styleMap.UNKNOWN;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
}
