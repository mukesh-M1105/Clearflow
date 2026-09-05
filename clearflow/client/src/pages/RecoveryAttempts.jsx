import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recoveryService } from '../services/recoveryService';
import { formatINR, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { 
  RefreshCw, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

export function RecoveryAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', strategy: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttempts();
  }, [pagination.page, filters.status, filters.strategy]);

  async function loadAttempts() {
    setLoading(true);
    setError(null);
    try {
      const res = await recoveryService.getRecoveryAttempts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success) {
        setAttempts(res.data.attempts);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch recovery attempts');
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status) {
    if (status === 'SUCCESS') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    if (status === 'FAILED') return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
    return <Clock className="w-3.5 h-3.5 text-blue-600" />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recovery Attempts Pipeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Simulation Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit executed retry strategies, gateway responses, and recaptured revenue.
          </p>
        </div>
        <button
          onClick={loadAttempts}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPagination(p => ({ ...p, page: 1 })); loadAttempts(); } }}
            placeholder="Search by ID, Payment ID, Merchant..."
            className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => {
            setFilters(f => ({ ...f, status: e.target.value }));
            setPagination(p => ({ ...p, page: 1 }));
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Attempt Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="PENDING">PENDING</option>
        </select>

        <select
          value={filters.strategy}
          onChange={(e) => {
            setFilters(f => ({ ...f, strategy: e.target.value }));
            setPagination(p => ({ ...p, page: 1 }));
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Recovery Strategies</option>
          <option value="RETRY_AFTER_24_HOURS">Retry After 24 Hours</option>
          <option value="RETRY_IMMEDIATELY">Retry Immediately</option>
          <option value="RETRY_AFTER_1_HOUR">Retry After 1 Hour</option>
          <option value="SEND_PAYMENT_REMINDER">Send Payment Reminder</option>
          <option value="REQUEST_DIFFERENT_PAYMENT_METHOD">Request Alternate Method</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Querying recovery execution attempts..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadAttempts} />
      ) : attempts.length === 0 ? (
        <EmptyState
          title="No recovery attempts logged"
          message="Run an automated recovery simulation from the Dashboard or Failed Payments."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Recovery ID</th>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Original Amount</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Attempt #</th>
                  <th className="py-3 px-4">Execution Status</th>
                  <th className="py-3 px-4">Gateway Result</th>
                  <th className="py-3 px-4">Recovered Yield</th>
                  <th className="py-3 px-4">Attempt Time</th>
                  <th className="py-3 px-4 text-right">Case Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{att.id}</td>
                    <td className="py-3.5 px-4 font-mono text-teal-600 font-semibold">
                      <Link to={`/recovery/${att.payment_id}`} className="hover:underline">
                        {att.payment_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{att.merchant_name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(att.original_amount)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {att.strategy}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 text-center">#{att.attempt_number}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(att.status)}
                        <span className="font-bold text-xs">{att.status}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {att.result || 'PENDING_RETRY'}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      {att.recovered_amount > 0 ? (
                        <span className="text-emerald-600 font-extrabold">+{formatINR(att.recovered_amount)}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(att.attempted_at || att.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/recovery/${att.payment_id}`}
                        className="p-1.5 inline-flex text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="View Full Case Timeline"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
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
              of <span className="font-bold">{pagination.total}</span> recovery attempts
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
