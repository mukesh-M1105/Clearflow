import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { recoveryService } from '../services/recoveryService';
import { formatINR, formatDate, PROBABILITY_LEVEL_COLORS } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { FailureReasonBadge } from '../components/common/FailureReasonBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { 
  AlertOctagon, 
  Search, 
  Play, 
  SearchCheck, 
  Eye, 
  RefreshCw, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function FailedPayments() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    failureReason: '',
    recoveryStatus: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    loadFailedPayments();
  }, [pagination.page, filters.failureReason, filters.recoveryStatus]);

  async function loadFailedPayments() {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.getFailedPayments({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success) {
        setPayments(res.data.payments);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load declined transactions');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(paymentId) {
    setActionLoading(prev => ({ ...prev, [paymentId]: 'analyzing' }));
    try {
      const res = await recoveryService.analyzePayment(paymentId);
      if (res.success) {
        setSuccessToast(`Analyzed! Score: ${res.data.analysis.probability}% (${res.data.analysis.level})`);
        setTimeout(() => setSuccessToast(null), 4000);
        await loadFailedPayments();
      }
    } catch (err) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: null }));
    }
  }

  async function handleStartRecovery(paymentId) {
    setActionLoading(prev => ({ ...prev, [paymentId]: 'recovering' }));
    try {
      const res = await recoveryService.startRecovery(paymentId);
      if (res.success) {
        setSuccessToast(`Simulation Result: ${res.data.status}! Recovered ${formatINR(res.data.recoveredAmount)}`);
        setTimeout(() => setSuccessToast(null), 5000);
        await loadFailedPayments();
      }
    } catch (err) {
      alert(`Recovery error: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: null }));
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Failed Payments Diagnostic</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Declined Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit root-cause declines, run probabilistic recovery models, and trigger automated re-attempts.
          </p>
        </div>
        <button
          onClick={loadFailedPayments}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPagination(p => ({ ...p, page: 1 })); loadFailedPayments(); } }}
            placeholder="Search payment ID or customer..."
            className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={filters.failureReason}
          onChange={(e) => {
            setFilters(f => ({ ...f, failureReason: e.target.value }));
            setPagination(p => ({ ...p, page: 1 }));
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Failure Reasons</option>
          <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
          <option value="BANK_DECLINED">Bank Declined</option>
          <option value="NETWORK_ERROR">Network Error</option>
          <option value="AUTHENTICATION_FAILURE">Auth Failure</option>
          <option value="EXPIRED_CARD">Expired Card</option>
          <option value="TIMEOUT">Gateway Timeout</option>
        </select>

        <select
          value={filters.recoveryStatus}
          onChange={(e) => {
            setFilters(f => ({ ...f, recoveryStatus: e.target.value }));
            setPagination(p => ({ ...p, page: 1 }));
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Recovery States</option>
          <option value="PENDING">Pending Retry</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RECOVERED">Recovered</option>
          <option value="UNRECOVERABLE">Unrecoverable</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Filtering failed payments in PostgreSQL..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadFailedPayments} />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No declined payments match filter"
          message="Adjust filter criteria or search terms."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Failure Reason</th>
                  <th className="py-3 px-4">Recovery Probability</th>
                  <th className="py-3 px-4">Recommended Action</th>
                  <th className="py-3 px-4">Recovery Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {payments.map((p) => {
                  const prob = p.recovery_probability || 70;
                  const level = p.probability_level || 'MEDIUM';
                  const levelStyle = PROBABILITY_LEVEL_COLORS[level] || 'bg-slate-100 text-slate-700';
                  const isBusy = actionLoading[p.id];
                  const canRecover = p.recovery_status !== 'RECOVERED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-600">
                        <Link to={`/payments/${p.id}`} className="hover:underline">
                          {p.id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{p.merchant_name}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.customer_name}</div>
                        <div className="text-[11px] text-slate-400">{p.customer_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <FailureReasonBadge reason={p.failure_reason} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${levelStyle}`}>
                          {prob}% ({level})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {p.recommended_action ? p.recommended_action.replace(/_/g, ' ') : 'RETRY AFTER 24H'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.recovery_status} type="recovery" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/payments/${p.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleAnalyze(p.id)}
                            disabled={!!isBusy}
                            className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Re-run AI Analysis"
                          >
                            <SearchCheck className="w-4 h-4" />
                          </button>
                          {canRecover && (
                            <button
                              onClick={() => handleStartRecovery(p.id)}
                              disabled={!!isBusy}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-xs disabled:opacity-50"
                              title="Start Simulated Recovery"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isBusy === 'recovering' ? '...' : 'Recover'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
            <div>
              Showing <span className="font-bold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-bold">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-bold">{pagination.total}</span> declined payments
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
