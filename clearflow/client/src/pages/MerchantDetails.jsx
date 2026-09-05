import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { merchantService } from '../services/merchantService';
import { recoveryService } from '../services/recoveryService';
import { formatINR } from '../utils/formatters';
import { KpiCard } from '../components/payments/KpiCard';
import { ChartCard } from '../components/charts/ChartCard';
import { RecoveryOpportunityCard } from '../components/recovery/RecoveryOpportunityCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { 
  ArrowLeft, 
  Store, 
  DollarSign, 
  TrendingUp, 
  AlertOctagon, 
  Target, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

export function MerchantDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulatingId, setSimulatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadMerchantDetails();
  }, [id]);

  async function loadMerchantDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await merchantService.getMerchantById(id);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load merchant profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartRecovery(paymentId) {
    setSimulatingId(paymentId);
    try {
      const res = await recoveryService.startRecovery(paymentId);
      if (res.success) {
        setToastMessage(`Recovered ${formatINR(res.data.recoveredAmount)} for ${data.merchant.business_name}!`);
        setTimeout(() => setToastMessage(null), 5000);
        await loadMerchantDetails();
      }
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulatingId(null);
    }
  }

  const PIE_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#64748b', '#06b6d4'];

  if (loading) return <LoadingSpinner message="Calculating merchant recovery metrics in PostgreSQL..." />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/merchants" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Merchants
        </Link>
        <ErrorMessage message={error || 'Merchant not found'} onRetry={loadMerchantDetails} />
      </div>
    );
  }

  const { merchant, summary, trends, failureBreakdown, opportunities } = data;

  return (
    <div className="space-y-6 animate-fadeIn">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Link
            to="/merchants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Merchants</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{merchant.business_name}</h1>
              <p className="text-xs text-slate-500">{merchant.business_type} • ID: <strong className="font-mono">{merchant.id}</strong></p>
            </div>
          </div>
        </div>

        <button
          onClick={loadMerchantDetails}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Gross Payment Volume"
          value={formatINR(summary.totalVolume, true)}
          subtitle={`${summary.totalPayments} total checkouts`}
          icon={DollarSign}
          color="teal"
        />
        <KpiCard
          title="Failed Revenue"
          value={formatINR(summary.failedRevenue, true)}
          subtitle={`${summary.failedCount} failed attempts`}
          icon={AlertOctagon}
          color="rose"
        />
        <KpiCard
          title="Recovered Revenue"
          value={formatINR(summary.recoveredRevenue, true)}
          subtitle="Recaptured via ClearFlow"
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          title="Recovery Efficiency"
          value={`${summary.recoveryRate}%`}
          subtitle="Merchant Recovery Rate"
          icon={Target}
          color="blue"
        />
      </div>

      {/* Top Opportunities for this merchant */}
      {opportunities && opportunities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recovery Opportunities for {merchant.business_name}</h3>
            <span className="text-xs text-teal-600 font-semibold">{opportunities.length} High-Yield Cases</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <RecoveryOpportunityCard
                key={opp.id}
                opportunity={opp}
                onStartRecovery={handleStartRecovery}
                isStarting={simulatingId === opp.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Payment Volume Trend"
          subtitle="Gross checkout volume vs settlement"
          height="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends.payments}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" fontSize={10} />
              <YAxis tickLine={false} stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => [formatINR(v), 'Volume']} />
              <Area type="monotone" dataKey="totalVolume" stroke="#6366f1" fill="#e0e7ff" />
              <Area type="monotone" dataKey="successVolume" stroke="#10b981" fill="#d1fae5" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Failure Reasons Distribution"
          subtitle="Root cause classification"
          height="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={failureBreakdown}
                dataKey="count"
                nameKey="reason"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={35}
              >
                {failureBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n, item) => [`${v} incidents (${formatINR(item.payload.totalLost)} lost)`, n]} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
