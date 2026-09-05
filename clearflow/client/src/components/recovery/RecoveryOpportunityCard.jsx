import React from 'react';
import { Link } from 'react-router-dom';
import { formatINR, PROBABILITY_LEVEL_COLORS } from '../../utils/formatters';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { FailureReasonBadge } from '../common/FailureReasonBadge';

export function RecoveryOpportunityCard({ opportunity, onStartRecovery, isStarting }) {
  const {
    id,
    amount,
    merchantName,
    customerName,
    failureReason,
    probability,
    level,
    recommendedAction,
    expectedRecovery
  } = opportunity;

  const levelStyle = PROBABILITY_LEVEL_COLORS[level] || 'bg-teal-50 text-teal-700 border-teal-200';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
      {/* Top accent bar if probability >= 80 */}
      {probability >= 80 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600" />
      )}

      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{merchantName}</span>
            <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">{formatINR(amount)}</h4>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${levelStyle}`}>
              <Sparkles className="w-3 h-3 mr-1" />
              {probability}% Probable
            </span>
          </div>
        </div>

        <div className="space-y-2 py-3 border-t border-b border-slate-100 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Customer:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[140px]">{customerName}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Failure Type:</span>
            <FailureReasonBadge reason={failureReason} />
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Action:</span>
            <span className="font-mono font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
              {recommendedAction.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Expected Yield:</span>
            <span className="font-extrabold text-emerald-600">{formatINR(expectedRecovery)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-1">
        <Link
          to={`/payments/${id}`}
          className="flex-1 text-center py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          View Case
        </Link>
        <button
          onClick={() => onStartRecovery(id)}
          disabled={isStarting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 rounded-xl shadow-xs transition-colors"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isStarting ? 'Simulating...' : 'Recover'}</span>
        </button>
      </div>
    </div>
  );
}
