import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
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
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  RotateCw,
  Layers,
  User,
  Store
} from 'lucide-react';

export function PaymentDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [simulationToast, setSimulationToast] = useState(null);

  useEffect(() => {
    loadDetails();
  }, [id]);

  async function loadDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.getPaymentById(id);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Payment not found');
    } finally {
      setLoading(false);
    }
  }

  // Trigger manual AI Analysis
  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await recoveryService.analyzePayment(id);
      if (res.success) {
        setSimulationToast('AI analysis completed successfully!');
        setTimeout(() => setSimulationToast(null), 4000);
        await loadDetails();
      }
    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  // Trigger Recovery Simulation
  async function handleStartRecovery() {
    setRecovering(true);
    try {
      const res = await recoveryService.startRecovery(id);
      if (res.success) {
        setSimulationToast(
          res.data.status === 'SUCCESS'
            ? `🎉 Simulated Recovery Success! Full amount ${formatINR(res.data.recoveredAmount)} captured.`
            : `⚠️ Simulated Recovery Attempt failed: ${res.data.result}`
        );
        setTimeout(() => setSimulationToast(null), 6000);
        await loadDetails();
      }
    } catch (err) {
      alert(`Recovery failed: ${err.message}`);
    } finally {
      setRecovering(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Fetching payment telemetry and recovery pipeline..." />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/payments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to Payments
        </Link>
        <ErrorMessage message={error || 'Payment not found'} onRetry={loadDetails} />
      </div>
    );
  }

  const { payment, analysis, recommendation, attempts, events, customerHistory } = data;
  const isRecoverableState = payment.status === 'FAILED' && payment.recovery_status !== 'RECOVERED';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Success Notification Banner */}
      {simulationToast && (
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span>{simulationToast}</span>
          </div>
          <span className="text-xs bg-emerald-700/80 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
            PostgreSQL Updated
          </span>
        </div>
      )}

      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Link
            to="/payments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Payments</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-mono font-extrabold text-slate-900">{payment.id}</h1>
            <StatusBadge status={payment.status} type="payment" />
            <StatusBadge status={payment.recovery_status} type="recovery" />
          </div>
        </div>

        {/* Action Controls */}
        {payment.status === 'FAILED' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5 text-teal-600" />
              <span>{analyzing ? 'Analyzing...' : 'Re-Analyze'}</span>
            </button>
            {isRecoverableState && (
              <button
                onClick={handleStartRecovery}
                disabled={recovering}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{recovering ? 'Simulating Retry...' : 'Start Recovery Simulation'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Primary Financial Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Transaction Metadata Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Snapshot</h3>
          
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Amount</span>
            <span className="text-2xl font-extrabold text-slate-900">{formatINR(payment.amount)}</span>
          </div>

          <div className="space-y-3 text-xs divide-y divide-slate-100 pt-1">
            <div className="flex justify-between py-2">
              <span className="text-slate-500 flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Merchant:</span>
              <span className="font-bold text-slate-800">{payment.business_name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Customer:</span>
              <div className="text-right">
                <span className="font-bold text-slate-800 block">{payment.customer_name}</span>
                <span className="text-[11px] text-slate-400">{payment.customer_email}</span>
              </div>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Payment Instrument:</span>
              <span className="font-semibold text-slate-700">{payment.payment_method}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Failure Code:</span>
              <FailureReasonBadge reason={payment.failure_reason} />
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Created Timestamp:</span>
              <span className="font-medium text-slate-700">{formatDate(payment.created_at)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Last Telemetry Update:</span>
              <span className="font-medium text-slate-700">{formatDate(payment.updated_at)}</span>
            </div>
          </div>

          {/* Customer History Pill Box */}
          {customerHistory && (
            <div className="mt-4 p-4 rounded-xl bg-teal-50/50 border border-teal-100/60">
              <span className="text-[11px] font-bold text-teal-950 uppercase tracking-wider block mb-2">Customer Profile</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Past Checkouts</span>
                  <span className="font-extrabold text-teal-900">{customerHistory.total} completed</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Verified Successes</span>
                  <span className="font-extrabold text-emerald-700">{customerHistory.successful}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Recovery Model & Recommendation */}
        <div className="lg:col-span-2 space-y-6">
          {payment.status === 'FAILED' ? (
            <>
              {/* Recovery Recommendation Card */}
              {recommendation && (
                <div className="bg-gradient-to-r from-teal-900 to-teal-950 rounded-2xl p-6 text-white shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-teal-300">
                      Smart Recovery Recommendation
                    </span>
                    <span className="text-xs font-mono font-bold bg-teal-800 text-teal-200 px-2.5 py-1 rounded-lg border border-teal-700">
                      {recommendation.recommended_delay}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight mb-2">
                    Action: {recommendation.recommended_action.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-teal-200 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10 mb-4">
                    {recommendation.reason}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-teal-800/80">
                    <span className="text-teal-300">Expected Yield if Executed:</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      {formatINR(recommendation.expected_recovery)}
                    </span>
                  </div>
                </div>
              )}

              {/* Recovery Probability Engine Card */}
              <RecoveryProbabilityCard analysis={analysis} amount={payment.amount} />
            </>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Payment Captured Successfully</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                This transaction settled normally without triggering recovery intervention pipelines.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Attempts History & Recovery Lifecycle Events Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Previous Retry Attempts Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Recovery Re-attempts</h4>
              <p className="text-xs text-slate-500">History of simulated or executed retry requests</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{attempts?.length || 0} Attempts</span>
          </div>

          {attempts && attempts.length > 0 ? (
            <div className="space-y-3">
              {attempts.map((att) => (
                <div key={att.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Attempt #{att.attempt_number}</span>
                      <StatusBadge status={att.status} type="recovery" />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Strategy: <strong className="text-slate-700">{att.strategy}</strong> ({att.result || 'PENDING'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-emerald-600 block">
                      {att.recovered_amount > 0 ? `+${formatINR(att.recovered_amount)}` : '₹0'}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(att.attempted_at || att.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No retry attempts executed yet.
            </div>
          )}
        </div>

        {/* Recovery Lifecycle Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900">Recovery Audit Timeline</h4>
            <p className="text-xs text-slate-500">Complete chronological audit trail</p>
          </div>
          <Timeline events={events} attempts={attempts} />
        </div>
      </div>
    </div>
  );
}
