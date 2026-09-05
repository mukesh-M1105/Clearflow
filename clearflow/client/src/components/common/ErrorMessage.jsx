import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorMessage({ title = 'Error loading data', message, onRetry }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-900 my-4 flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-rose-600" />
      </div>
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="text-sm text-rose-700 mt-1 max-w-md">{message || 'An unexpected failure occurred while processing this request.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Request
        </button>
      )}
    </div>
  );
}
