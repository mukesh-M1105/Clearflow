import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { webhookService } from '../services/webhookService';
import { formatINR } from '../utils/formatters';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Key, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Radio
} from 'lucide-react';

export function Settings() {
  const [webhookForm, setWebhookForm] = useState({
    merchantId: 'mer_nova',
    amount: '35000',
    failureReason: 'INSUFFICIENT_FUNDS',
    paymentMethod: 'Credit Card (Visa)'
  });
  const [loading, setLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleDispatchWebhook(e) {
    e.preventDefault();
    setLoading(true);
    setWebhookResult(null);
    setError(null);

    try {
      const res = await webhookService.simulateWebhook(webhookForm);
      if (res.success) {
        setWebhookResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch webhook');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Configuration & Simulator</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Infrastructure health, runtime security boundaries, and live payment gateway webhook simulation harness.
        </p>
      </div>

      {/* Interactive Gateway Webhook Simulator */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            Gateway Integration Harness
          </div>
          <span className="text-xs text-teal-300 font-mono">POST /api/webhooks/simulate</span>
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight">Live Payment Gateway Webhook Dispatcher</h3>
        <p className="text-xs text-teal-200 mt-1 max-w-xl">
          Simulate an incoming decline webhook event from Stripe, Razorpay, or PayU. Watch ClearFlow ingest the payload, score probability, and log audit milestones instantly in PostgreSQL.
        </p>

        {error && (
          <div className="mt-4 bg-rose-900/50 border border-rose-500/50 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleDispatchWebhook} className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-teal-200 uppercase tracking-wider mb-1">
              Target Merchant
            </label>
            <select
              value={webhookForm.merchantId}
              onChange={(e) => setWebhookForm({ ...webhookForm, merchantId: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
            >
              <option value="mer_nova" className="text-slate-900">Nova Electronics</option>
              <option value="mer_fresh" className="text-slate-900">FreshMart</option>
              <option value="mer_tech" className="text-slate-900">TechWorld</option>
              <option value="mer_urban" className="text-slate-900">Urban Fashion</option>
              <option value="mer_quick" className="text-slate-900">Quick Services</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-teal-200 uppercase tracking-wider mb-1">
              Transaction Amount (₹)
            </label>
            <input
              type="number"
              required
              min="100"
              max="500000"
              value={webhookForm.amount}
              onChange={(e) => setWebhookForm({ ...webhookForm, amount: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-teal-200 uppercase tracking-wider mb-1">
              Decline Code
            </label>
            <select
              value={webhookForm.failureReason}
              onChange={(e) => setWebhookForm({ ...webhookForm, failureReason: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
            >
              <option value="INSUFFICIENT_FUNDS" className="text-slate-900">INSUFFICIENT_FUNDS</option>
              <option value="NETWORK_ERROR" className="text-slate-900">NETWORK_ERROR</option>
              <option value="TIMEOUT" className="text-slate-900">TIMEOUT</option>
              <option value="BANK_DECLINED" className="text-slate-900">BANK_DECLINED</option>
              <option value="AUTHENTICATION_FAILURE" className="text-slate-900">AUTHENTICATION_FAILURE</option>
              <option value="EXPIRED_CARD" className="text-slate-900">EXPIRED_CARD</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-400/20 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Ingesting...' : 'Dispatch Webhook'}</span>
            </button>
          </div>
        </form>

        {/* Real-time Ingestion Feedback Result */}
        {webhookResult && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-100 animate-fadeIn space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Webhook Ingested & Analyzed: <code className="font-mono text-white">{webhookResult.paymentId}</code>
              </span>
              <Link
                to={`/payments/${webhookResult.paymentId}`}
                className="underline font-bold hover:text-white"
              >
                Inspect New Transaction →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-800/40 text-[11px]">
              <div>Amount: <strong className="text-white">{formatINR(webhookResult.amount)}</strong></div>
              <div>Failure: <strong className="text-white">{webhookResult.failureReason}</strong></div>
              <div>AI Score: <strong className="text-emerald-300">{webhookResult.analysis.probability}% ({webhookResult.analysis.level})</strong></div>
              <div>Action: <strong className="text-amber-300">{webhookResult.recommendation.action}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Static Infrastructure Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Runtime Architecture</h3>
            <p className="text-xs text-slate-500">Active server engines and database layer</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            PostgreSQL Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Simulated Gateway Rails</span>
              <p className="text-slate-500 mt-0.5">
                Payment capture requests execute safely in an in-memory simulation runner. Zero real card charges or bank fees are incurred.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <Database className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">PostgreSQL Relational Storage</span>
              <p className="text-slate-500 mt-0.5">
                All metrics, transactions, and audit logs are queried directly via standard SQL tables with relational constraints and indexes.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Hybrid AI Recovery Model</span>
              <p className="text-slate-500 mt-0.5">
                Scoring engine operates deterministically on customer reliability and decline telemetry, running seamlessly even without external cloud keys.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <Key className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Tenant Multi-Isolation</span>
              <p className="text-slate-500 mt-0.5">
                Merchants cannot query or modify peer transaction ledgers; enforced via backend SQL parameter scope guards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
