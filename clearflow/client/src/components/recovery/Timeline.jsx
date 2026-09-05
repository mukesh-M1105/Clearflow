import React from 'react';
import { formatDate } from '../../utils/formatters';
import { 
  AlertCircle, 
  Search, 
  Lightbulb, 
  PlayCircle, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';

export function Timeline({ events = [], attempts = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs">
        No lifecycle events recorded for this recovery case.
      </div>
    );
  }

  function getIcon(type) {
    switch (type) {
      case 'FAILURE_DETECTED':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'PAYMENT_ANALYZED':
      case 'AI_ANALYSIS_COMPLETED':
        return <Search className="w-4 h-4 text-teal-600" />;
      case 'RECOMMENDATION_GENERATED':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 'RECOVERY_STARTED':
        return <PlayCircle className="w-4 h-4 text-blue-600" />;
      case 'RECOVERY_SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'RECOVERY_FAILED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  }

  function getDotBg(type) {
    switch (type) {
      case 'FAILURE_DETECTED': return 'bg-rose-50 border-rose-200';
      case 'PAYMENT_ANALYZED':
      case 'AI_ANALYSIS_COMPLETED': return 'bg-teal-50 border-teal-200';
      case 'RECOMMENDATION_GENERATED': return 'bg-amber-50 border-amber-200';
      case 'RECOVERY_STARTED': return 'bg-blue-50 border-blue-200';
      case 'RECOVERY_SUCCESS': return 'bg-emerald-50 border-emerald-200';
      case 'RECOVERY_FAILED': return 'bg-rose-50 border-rose-200';
      default: return 'bg-slate-100 border-slate-200';
    }
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((evt, idx) => (
        <div key={evt.id || idx} className="relative flex items-start gap-4 group">
          <div className={`absolute -left-6 mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white ${getDotBg(evt.event_type)} shadow-xs`}>
            {getIcon(evt.event_type)}
          </div>
          <div className="flex-1 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                {evt.event_type.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {formatDate(evt.created_at)}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
