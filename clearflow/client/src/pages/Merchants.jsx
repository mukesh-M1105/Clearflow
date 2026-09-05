import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { merchantService } from '../services/merchantService';
import { formatINR } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { Store, Search, ArrowRight, TrendingUp, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

export function Merchants() {
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMerchants();
  }, []);

  async function loadMerchants() {
    setLoading(true);
    setError(null);
    try {
      const res = await merchantService.getMerchants(search);
      if (res.success) {
        setMerchants(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load merchant accounts');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadMerchants();
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Connected Merchants</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Merchant performance benchmarks, gross volume, decline losses, and revenue recovery rates.
          </p>
        </div>
        <button
          onClick={loadMerchants}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant name or industry..."
            className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </form>
      </div>

      {/* Grid of Merchant Cards */}
      {loading ? (
        <LoadingSpinner message="Calculating merchant recovery benchmarks..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadMerchants} />
      ) : merchants.length === 0 ? (
        <EmptyState title="No merchants found" message="Try searching with a different business keyword." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {merchants.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{m.business_name}</h3>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{m.business_type}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {m.id}
                  </span>
                </div>

                <div className="space-y-2.5 py-3 border-t border-b border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Gross Volume:</span>
                    <span className="font-extrabold text-slate-900">{formatINR(m.total_volume)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total Checkouts:</span>
                    <span className="font-semibold text-slate-800">{m.total_payments} transactions</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Failed Revenue:</span>
                    <span className="font-extrabold text-rose-600">{formatINR(m.failed_revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Recovered Revenue:</span>
                    <span className="font-extrabold text-emerald-600">{formatINR(m.recovered_revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 pt-1">
                    <span>Recovery Rate:</span>
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {m.recovery_rate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-2">
                <Link
                  to={`/merchants/${m.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-600 text-xs font-bold rounded-xl border border-slate-200/80 hover:border-teal-200 transition-colors"
                >
                  <span>View Merchant Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
