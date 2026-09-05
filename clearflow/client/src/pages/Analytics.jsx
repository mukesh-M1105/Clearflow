import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { formatINR } from '../utils/formatters';
import { KpiCard } from '../components/payments/KpiCard';
import { ChartCard } from '../components/charts/ChartCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  AlertOctagon, 
  HelpCircle,
  RefreshCw,
  Award
} from 'lucide-react';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

export function Analytics() {
  const [data, setData] = useState(null);
  const [merchantRankings, setMerchantRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const [recRes, merchRes] = await Promise.all([
        analyticsService.getRecoveryAnalytics('90d'),
        analyticsService.getMerchantAnalytics()
      ]);

      if (recRes.success) setData(recRes.data);
      if (merchRes.success) setMerchantRankings(merchRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load recovery analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Aggregating financial analytics across PostgreSQL ledger..." />;
  if (error || !data) return <ErrorMessage message={error} onRetry={loadAnalytics} />;

  const { summary, failureBreakdown, recoveryTrend } = data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recovery Performance Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Audit Insights
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mathematical recovery conversion breakdown, decline efficiency ratios, and merchant cohort analysis.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Failed Revenue"
          value={formatINR(summary.failedRevenue, true)}
          subtitle="All issuer declines"
          icon={AlertOctagon}
          color="rose"
        />
        <KpiCard
          title="Recoverable Revenue"
          value={formatINR(summary.recoverableRevenue, true)}
          subtitle="Viable transient decline volume"
          icon={Target}
          color="amber"
        />
        <KpiCard
          title="Recovered Revenue"
          value={formatINR(summary.recoveredRevenue, true)}
          subtitle="Recaptured into merchant accounts"
          icon={TrendingUp}
          color="emerald"
          badge="+Recaptured"
        />
        <KpiCard
          title="Net Recovery Rate"
          value={`${summary.recoveryRate}%`}
          subtitle="Recovered ÷ Recoverable × 100"
          icon={BarChart3}
          color="teal"
          badge="Conversion"
        />
      </div>

      {/* Recovery Conversion Formula Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-600" />
            <h4 className="text-sm font-bold text-slate-900">Recovery Rate Mathematical Formula</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated as total revenue recovered through smart reattempts divided by total recoverable failure volume:
          </p>
        </div>
        <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-800 text-center">
          <span className="text-emerald-700">{formatINR(summary.recoveredRevenue)}</span>
          <span className="text-slate-400 mx-2">/</span>
          <span className="text-amber-700">{formatINR(summary.recoverableRevenue)}</span>
          <span className="text-slate-400 mx-2">× 100 =</span>
          <span className="text-teal-600 text-sm">{summary.recoveryRate}%</span>
        </div>
      </div>

      {/* Recovery by Failure Reason Breakdown Chart */}
      <ChartCard
        title="Recovery Yield by Failure Root Cause"
        subtitle="Recoverable vs Recovered amounts across error categories (INR)"
        height="h-80"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={failureBreakdown}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="reason" tickLine={false} stroke="#94a3b8" fontSize={10} tickFormatter={(r) => r.replace(/_/g, ' ')} />
            <YAxis tickLine={false} stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip formatter={(value) => [formatINR(value)]} />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="totalRecoverable" name="Recoverable Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalRecovered" name="Recovered Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Merchant Performance Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900">Merchant Recovery Conversion Cohorts</h4>
            <p className="text-xs text-slate-500">Benchmark of merchant recovery success</p>
          </div>
          <Award className="w-5 h-5 text-teal-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Merchant Name</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Total Checkouts</th>
                <th className="py-3 px-4">Gross Volume</th>
                <th className="py-3 px-4">Failed Loss</th>
                <th className="py-3 px-4">Recovered Revenue</th>
                <th className="py-3 px-4 text-right">Recovery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {merchantRankings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{m.business_name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{m.business_type}</td>
                  <td className="py-3.5 px-4 font-semibold">{m.total_payments}</td>
                  <td className="py-3.5 px-4 font-bold">{formatINR(m.gross_volume)}</td>
                  <td className="py-3.5 px-4 text-rose-600 font-semibold">{formatINR(m.failed_revenue)}</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-extrabold">{formatINR(m.recovered_revenue)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-block font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-100">
                      {m.recovery_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
