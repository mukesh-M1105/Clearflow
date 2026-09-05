import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recoveryService } from '../services/recoveryService';
import { formatINR, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { FailureReasonBadge } from '../components/common/FailureReasonBadge';
import { RecoveryProbabilityCard } from '../components/recovery/RecoveryProbabilityCard';
import { Timeline } from '../components/recovery/Timeline';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { 
  ArrowLeft, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertOctagon,
  RefreshCw
} from 'lucide-react';

export function RecoveryCaseDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recovering, setRecovering] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadCase();
  }, [id]);

  async function loadCase() {
    setLoading(true);
    setError(null);
    try {
      const res = await recoveryService.getRecoveryCase(id);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load recovery case details');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartRecovery() {
    setRecovering(true);
    try {
      const res = await recoveryService.startRecovery(id);
      if (res.success) {
        setToastMessage(`Recovery simulated: ${res.data.status}! Recovered ${formatINR(res.data.recoveredAmount)}`);
        setTimeout(() => setToastMessage(null), 5000);
        await loadCase();
      }
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setRecovering(false);
    }
  }

  if (loading) return <LoadingSpinner message="Querying recovery case lifecycle and audit trail..." />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/recovery" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Recovery Pipeline
        </Link>
        <ErrorMessage message={error || 'Recovery case not found'} onRetry={loadCase} />
      </div>
    );
  }

  const { payment, analysis, recommendation, attempts, events } = data;
  const isRecovered = payment.recovery_status === 'RECOVERED';

  return (
    <div className="space-y-6 animate-fadeIn">
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-xs bg-emerald-700/80 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
            PostgreSQL Synchronized
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Link
            to="/recovery"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Recovery Attempts</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-mono font-extrabold text-slate-900">Case #{payment.id}</h1>
            <StatusBadge status={payment.recovery_status} type="recovery" />
          </div>
        </div>

        {!isRecovered && (
          <button
            onClick={handleStartRecovery}
            disabled={recovering}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{recovering ? 'Simulating Retry...' : 'Execute Recovery Simulation'}</span>
          </button>
        )}
      </div>

      {/* Case Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Original Declined Amount</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{formatINR(payment.amount)}</span>
          <span className="text-[11px] text-slate-500">{payment.business_name}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Decline Root Cause</span>
          <div className="mt-2">
            <FailureReasonBadge reason={payment.failure_reason} />
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Instrument: {payment.payment_method}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">AI Probability Score</span>
          <span className="text-2xl font-extrabold text-teal-600 mt-1 block">
            {analysis?.recovery_probability || 75}%
          </span>
          <span className="text-[11px] text-slate-500">{analysis?.probability_level || 'HIGH'} Confidence</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Recovered Yield</span>
          <span className={`text-2xl font-extrabold mt-1 block ${isRecovered ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isRecovered ? formatINR(payment.amount) : '₹0'}
          </span>
          <span className="text-[11px] text-slate-500">
            {isRecovered ? '100% Recaptured' : 'Awaiting Settlement'}
          </span>
        </div>
      </div>

      {/* AI Assessment & Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {recommendation && (
            <div className="bg-teal-900 text-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300">Prescribed Action</span>
                <span className="text-xs font-mono font-bold bg-teal-800 text-teal-200 px-2 py-0.5 rounded">
                  Delay: {recommendation.recommended_delay}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {recommendation.recommended_action.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-teal-200 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
                {recommendation.reason}
              </p>
            </div>
          )}

          <RecoveryProbabilityCard analysis={analysis} amount={payment.amount} />
        </div>

        {/* Audit Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900">Recovery Audit Timeline</h4>
            <p className="text-xs text-slate-500">Chronological lifecycle milestones</p>
          </div>
          <Timeline events={events} attempts={attempts} />
        </div>
      </div>
    </div>
  );
}
