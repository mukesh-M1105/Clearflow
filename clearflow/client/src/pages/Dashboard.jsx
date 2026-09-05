import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { recoveryService } from '../services/recoveryService';
import { formatINR } from '../utils/formatters';
import { KpiCard } from '../components/payments/KpiCard';
import { ChartCard } from '../components/charts/ChartCard';
import { RecoveryOpportunityCard } from '../components/recovery/RecoveryOpportunityCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  AlertOctagon, 
  TrendingUp, 
  ShieldAlert, 
  Target,
  Sparkles,
  RefreshCw,
  Calendar
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

export function Dashboard() {
  const [period, setPeriod] = useState('90d');
  const [summary, setSummary] = useState(null);
  const [paymentTrend, setPaymentTrend] = useState([]);
  const [recoveryTrend, setRecoveryTrend] = useState([]);
  const [failureReasons, setFailureReasons] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulatingId, setSimulatingId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, pTrendRes, rTrendRes, fResRes, oppRes] = await Promise.all([
        dashboardService.getSummary(period),
        dashboardService.getPaymentTrend(period),
        dashboardService.getRecoveryTrend(period),
        dashboardService.getFailureReasons(period),
        dashboardService.getOpportunities(6)
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (pTrendRes.success) setPaymentTrend(pTrendRes.data);
      if (rTrendRes.success) setRecoveryTrend(rTrendRes.data);
      if (fResRes.success) setFailureReasons(fResRes.data);
      if (oppRes.success) setOpportunities(oppRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }

  // Quick Simulation Action from Dashboard Opportunity Card
  async function handleStartRecovery(paymentId) {
    setSimulatingId(paymentId);
    try {
      const res = await recoveryService.startRecovery(paymentId);
      if (res.success) {
        setSuccessToast(`Recovery Simulated! Recovered ₹${res.data.recoveredAmount.toLocaleString('en-IN')}. Dashboard updated.`);
        setTimeout(() => setSuccessToast(null), 6000);
        // Reload dashboard telemetry to immediately reflect new recovered revenue
        await loadDashboardData();
      }
    } catch (err) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulatingId(null);
    }
  }

  const PIE_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#64748b', '#06b6d4', '#10b981'];

  if (loading && !summary) {
    return <LoadingSpinner message="Calculating real-time PostgreSQL recovery metrics..." size="lg" />;
  }

  if (error && !summary) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast alert on recovery simulation */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header & Date Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Revenue Recovery Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time loss detection, recovery telemetry, and smart re-attempt intelligence.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={loadDashboardData}
            title="Refresh Data"
            className="p-1.5 ml-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Payment Volume"
          value={formatINR(summary?.totalVolume, true)}
          subtitle={`${summary?.totalPayments || 0} gross checkout attempts`}
          icon={DollarSign}
          color="teal"
        />
        <KpiCard
          title="Successful Settlement"
          value={formatINR(summary?.successVolume, true)}
          subtitle={`${summary?.successCount || 0} captured payments`}
          icon={CheckCircle2}
          color="emerald"
        />
        <KpiCard
          title="Failed Revenue (Lost)"
          value={formatINR(summary?.failedRevenue, true)}
          subtitle={`${summary?.failedCount || 0} transactions declined`}
          icon={AlertOctagon}
          color="rose"
        />
        <KpiCard
          title="Recovery Efficiency"
          value={`${summary?.recoveryRate || 0}%`}
          subtitle="Recovered / Recoverable yield"
          icon={Target}
          color="blue"
          badge="Live ROI"
        />
        <KpiCard
          title="Recoverable Revenue"
          value={formatINR(summary?.recoverableRevenue, true)}
          subtitle="Qualifying transient failures"
          icon={ShieldAlert}
          color="amber"
        />
        <KpiCard
          title="Recovered Revenue"
          value={formatINR(summary?.recoveredRevenue, true)}
          subtitle="Recaptured via smart engine"
          icon={TrendingUp}
          color="emerald"
          badge="+Recaptured"
        />
        <KpiCard
          title="Pending Pipeline"
          value={formatINR(Math.max(0, (summary?.recoverableRevenue || 0) - (summary?.recoveredRevenue || 0)), true)}
          subtitle="Awaiting automated retry"
          icon={CreditCard}
          color="teal"
        />
        <KpiCard
          title="Active Transactions"
          value={(summary?.totalPayments || 0).toLocaleString('en-IN')}
          subtitle="Audited in PostgreSQL"
          icon={CheckCircle2}
          color="blue"
        />
      </div>

      {/* High Opportunity Revenue Recovery Section */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              High Priority Opportunities
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Revenue Recovery Opportunities</h2>
            <p className="text-xs text-teal-200 mt-0.5">
              Failed payments with ≥70% recovery probability sorted by expected recovery yield.
            </p>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-teal-200">
            No active high-opportunity recovery cases currently pending.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {opportunities.map((opp) => (
              <RecoveryOpportunityCard
                key={opp.id}
                opportunity={opp}
                onStartRecovery={handleStartRecovery}
                isStarting={simulatingId === opp.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Payment Volume Trend */}
        <ChartCard
          title="Payment Volume Trend"
          subtitle="Daily gross volume vs successful settlement (INR)"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={paymentTrend}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="succGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" fontSize={10} />
              <YAxis tickLine={false} stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(value) => [formatINR(value), 'Volume']} />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="totalVolume" name="Gross Volume" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#volGrad)" />
              <Area type="monotone" dataKey="successVolume" name="Successful Settlement" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#succGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart B: Successful vs Failed Payments Count */}
        <ChartCard
          title="Settlement Distribution (Volume Count)"
          subtitle="Captured transactions versus declined transactions"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" fontSize={10} />
              <YAxis tickLine={false} stroke="#94a3b8" fontSize={10} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="successCount" name="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failedCount" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart C: Failed vs Recovered Revenue Trend */}
        <ChartCard
          title="Revenue Recovery Velocity"
          subtitle="Failed revenue compared with recovered recaptured revenue"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={recoveryTrend}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" fontSize={10} />
              <YAxis tickLine={false} stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(value) => [formatINR(value), 'Revenue']} />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="failedRevenue" name="Failed Revenue" stroke="#ef4444" strokeWidth={2} fill="#fee2e2" />
              <Area type="monotone" dataKey="recoveredRevenue" name="Recovered Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#recGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart D: Failure Reason Distribution */}
        <ChartCard
          title="Payment Failure Root Causes"
          subtitle="Decline categories categorized by frequency and volume"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={failureReasons}
                dataKey="count"
                nameKey="reason"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={4}
              >
                {failureReasons.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, item) => [`${value} Failures (Lost: ${formatINR(item.payload.totalLost)})`, name]} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart E: Recovery Rate Trend */}
        <ChartCard
          title="Recovery Conversion Rate (%)"
          subtitle="Percentage of recoverable funds successfully recaptured over time"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recoveryTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" fontSize={10} />
              <YAxis tickLine={false} stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => [`${value}%`, 'Recovery Rate']} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="recoveryRate" name="Recovery Rate %" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart F: Recovery Performance Aggregate */}
        <ChartCard
          title="Recovery Performance Breakdown"
          subtitle="Total Failed vs Recoverable vs Recovered gross totals"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  name: 'Platform Telemetry',
                  'Failed Revenue': summary?.failedRevenue || 0,
                  'Recoverable Revenue': summary?.recoverableRevenue || 0,
                  'Recovered Revenue': summary?.recoveredRevenue || 0,
                }
              ]}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickLine={false} stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} />
              <YAxis type="category" dataKey="name" tickLine={false} stroke="#94a3b8" fontSize={10} hide />
              <Tooltip formatter={(value) => [formatINR(value)]} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Failed Revenue" fill="#ef4444" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Recoverable Revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Recovered Revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
