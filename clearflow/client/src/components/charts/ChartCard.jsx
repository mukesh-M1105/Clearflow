import React from 'react';

export function ChartCard({ title, subtitle, children, action, height = 'h-72' }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className={`w-full ${height} mt-2`}>
        {children}
      </div>
    </div>
  );
}
