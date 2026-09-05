import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { 
  FileText, 
  Download, 
  Filter, 
  Table, 
  RefreshCw,
  Calendar
} from 'lucide-react';

export function Reports() {
  const [reportType, setReportType] = useState('payments');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    failureReason: ''
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, [reportType, filters.status, filters.failureReason]);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (reportType === 'payments' || reportType === 'failed') {
        const queryFilters = { ...filters };
        if (reportType === 'failed') queryFilters.status = 'FAILED';
        res = await reportService.getPaymentsReport(queryFilters, 'json');
      } else if (reportType === 'recovery') {
        res = await reportService.getRecoveryReport(filters, 'json');
      } else if (reportType === 'merchants') {
        res = await reportService.getMerchantsReport(filters, 'json');
      }

      if (res && res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    const queryFilters = { ...filters };
    if (reportType === 'failed') queryFilters.status = 'FAILED';

    if (reportType === 'payments' || reportType === 'failed') {
      reportService.getPaymentsReport(queryFilters, 'csv');
    } else if (reportType === 'recovery') {
      reportService.getRecoveryReport(filters, 'csv');
    } else if (reportType === 'merchants') {
      reportService.getMerchantsReport(filters, 'csv');
    }
  }

  const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial & Recovery Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate audit-ready SQL datasets with parameterized query filtering and CSV download.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={reportData.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'payments', label: 'Payment Transactions' },
          { id: 'failed', label: 'Failed Payments Report' },
          { id: 'recovery', label: 'Recovery Attempts Report' },
          { id: 'merchants', label: 'Merchant Summary Report' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors whitespace-nowrap ${
              reportType === tab.id
                ? 'bg-white border-t border-x border-slate-200 text-teal-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Parameters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-teal-600" /> Filters:
        </span>

        {/* Date Inputs */}
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          placeholder="Start Date"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          placeholder="End Date"
        />

        {reportType === 'payments' && (
          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="PENDING">PENDING</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        )}

        {(reportType === 'payments' || reportType === 'failed') && (
          <select
            value={filters.failureReason}
            onChange={(e) => setFilters(f => ({ ...f, failureReason: e.target.value }))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Reasons</option>
            <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
            <option value="BANK_DECLINED">Bank Declined</option>
            <option value="NETWORK_ERROR">Network Error</option>
            <option value="AUTHENTICATION_FAILURE">Auth Failure</option>
            <option value="EXPIRED_CARD">Expired Card</option>
            <option value="TIMEOUT">Timeout</option>
          </select>
        )}

        <button
          onClick={loadReport}
          className="ml-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-slate-700 transition-colors"
        >
          Apply Query
        </button>
      </div>

      {/* Report Table */}
      {loading ? (
        <LoadingSpinner message="Executing SQL query for report dataset..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadReport} />
      ) : reportData.length === 0 ? (
        <EmptyState title="No rows returned" message="No records in PostgreSQL match the selected report filters." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-600">
              Query Result: <strong className="text-slate-900">{reportData.length} records returned</strong>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Export format: RFC 4180 CSV</span>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 shadow-xs">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors font-mono">
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-4 whitespace-nowrap text-[11px]">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
