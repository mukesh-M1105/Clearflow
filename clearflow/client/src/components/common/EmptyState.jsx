import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ title = 'No records found', message = 'No data matching your current filters was found.', icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-slate-200 shadow-sm my-4">
      <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">{message}</p>
      {action}
    </div>
  );
}
