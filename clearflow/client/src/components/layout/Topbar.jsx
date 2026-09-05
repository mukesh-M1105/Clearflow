import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Sparkles, ChevronDown } from 'lucide-react';

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-1.5 rounded-full font-medium shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
          <span>Simulation Active: <strong>Zero Real Gateway Charges</strong></span>
        </div>
        {user?.business_name && (
          <div className="hidden md:flex items-center text-xs text-slate-500 font-medium border-l border-slate-200 pl-4">
            <span>Merchant: <strong className="text-slate-800">{user.business_name}</strong></span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400 font-normal">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {user?.role}
                </span>
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Account Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
