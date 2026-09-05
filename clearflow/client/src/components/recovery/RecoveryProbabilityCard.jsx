import React from 'react';
import { formatINR, PROBABILITY_LEVEL_COLORS } from '../../utils/formatters';
import { ShieldAlert, TrendingUp, CheckCircle2 } from 'lucide-react';

export function RecoveryProbabilityCard({ analysis, amount }) {
  if (!analysis) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500">
        <p className="text-sm">No automated probability analysis available for this transaction yet.</p>
      </div>
    );
  }

  const {
    recovery_probability = analysis.probability || 0,
    probability_level = analysis.level || 'MEDIUM',
    recoverable_amount = analysis.recoverableAmount || amount || 0,
    expected_recovery = analysis.expectedRecovery || (amount * (analysis.probability || 80) / 100),
    explanation,
    factors = []
  } = analysis;

  const levelColor = PROBABILITY_LEVEL_COLORS[probability_level] || 'text-slate-700 bg-slate-50 border-slate-200';

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Recovery Model</span>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">Recovery Probability Assessment</h4>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${levelColor}`}>
          {probability_level}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-100">
        {/* Score Radial Visual */}
        <div className="flex items-center gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-white border-4 border-teal-500 shadow-sm flex-shrink-0">
            <span className="text-lg font-extrabold text-teal-700">{recovery_probability}%</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Recovery Confidence</p>
            <p className="text-sm font-bold text-slate-800">{probability_level} Potential</p>
          </div>
        </div>

        {/* Recoverable Amount */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          <p className="text-xs font-medium text-slate-500">Recoverable Amount</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(recoverable_amount)}</p>
          <span className="text-[11px] text-slate-400">100% of declined principal</span>
        </div>

        {/* Expected Recovery */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
          <p className="text-xs font-medium text-emerald-800">Expected Yield (Weighted)</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{formatINR(expected_recovery)}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Principal × Probability Factor</span>
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="py-4 text-xs text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-800 mb-1">Model Rationale:</p>
          <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">{explanation}</p>
        </div>
      )}

      {/* Scoring Factors Breakdown */}
      {factors && factors.length > 0 && (
        <div className="mt-2 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Evaluation Factors</p>
          <div className="space-y-2">
            {factors.map((f, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${String(f.impact).startsWith('+') ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-slate-800">{f.name}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{f.explanation}</p>
                  </div>
                </div>
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ml-3 flex-shrink-0 ${
                  String(f.impact).startsWith('+')
                    ? 'bg-emerald-100 text-emerald-800'
                    : String(f.impact).startsWith('-')
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {f.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
