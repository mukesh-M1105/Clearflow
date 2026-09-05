import React from 'react';

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'teal', badge }) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-slate-200'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100'
    }
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${scheme.bg} flex items-center justify-center ${scheme.text}`}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {badge && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
