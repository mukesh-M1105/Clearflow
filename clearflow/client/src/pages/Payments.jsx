import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { formatINR, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { FailureReasonBadge } from '../components/common/FailureReasonBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';

export function Payments() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    failureReason: '',
    recoveryStatus: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPayments();
  }, [pagination.page, filters.status, filters.failureReason, filters.recoveryStatus, filters.sortBy, filters.sortOrder]);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.getPayments({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success) {
        setPayments(res.data.payments);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadPayments();
  }

  function handleSort(col) {
    if (filters.sortBy === col) {
      setFilters(f => ({ ...f, sortOrder: f.sortOrder === 'ASC' ? 'DESC' : 'ASC' }));
    } else {
      setFilters(f => ({ ...f, sortBy: col, sortOrder: 'DESC' }));
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Transactions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit payment attempts, settlement states, and recovery workflows.
          </p>
        </div>
        <button
          onClick={loadPayments}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Search by Payment ID, Customer, Merchant..."
              className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </form>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters(f => ({ ...f, status: e.target.value }));
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Payment Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="PENDING">PENDING</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>

          {/* Failure Reason Filter */}
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

          {/* Recovery Status Filter */}
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
            <option value="NOT_REQUIRED">Not Required</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <LoadingSpinner message="Querying PostgreSQL payment transactions..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadPayments} />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payment records found"
          message="Adjust search parameters or clear status filters to view records."
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
                  <th 
                    onClick={() => handleSort('amount')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1">
                      <span>Amount</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Failure Reason</th>
                  <th className="py-3 px-4">Recovery Status</th>
                  <th 
                    onClick={() => handleSort('created_at')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">
                      <Link to={`/payments/${p.id}`} className="hover:underline">
                        {p.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{p.merchant_name}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{p.customer_email}</div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.payment_method}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} type="payment" />
                    </td>
                    <td className="py-3 px-4">
                      <FailureReasonBadge reason={p.failure_reason} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.recovery_status} type="recovery" />
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/payments/${p.id}`}
                        className="inline-flex items-center gap-1 p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="View Payment & Recovery Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
            <div>
              Showing <span className="font-bold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-bold">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-bold">{pagination.total}</span> payments
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
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
