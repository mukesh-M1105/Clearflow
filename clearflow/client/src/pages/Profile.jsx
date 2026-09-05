import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Mail, Building, Key, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          User identity, active role-based permissions, and cryptographic session credentials.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center font-extrabold text-2xl text-teal-700">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-2 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block">Unique User ID</span>
            <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">{user?.id}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block">Associated Merchant</span>
            <span className="font-bold text-slate-800 text-sm mt-1 block">
              {user?.business_name || (user?.role === 'ADMIN' ? 'All Platform Merchants (Global)' : 'Enterprise Internal Ops')}
            </span>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Active Role Capabilities</h4>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="text-slate-700">Access Global Revenue Recovery Metrics:</span>
              <span className="font-bold text-emerald-600">{user?.role !== 'MERCHANT' ? 'Granted (Global)' : 'Scoped to Tenant'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="text-slate-700">Execute Payment Recovery Simulations:</span>
              <span className="font-bold text-emerald-600">Granted</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="text-slate-700">Generate & Export Audit CSV Reports:</span>
              <span className="font-bold text-emerald-600">Granted</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="text-slate-700">Cross-Tenant Merchant Isolation Guard:</span>
              <span className="font-bold text-teal-600">Active (Backend Enforced)</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
