import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  AlertOctagon, 
  RefreshCw, 
  Store, 
  BarChart3, 
  FileText, 
  Bot, 
  Settings,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Failed Payments', path: '/failed-payments', icon: AlertOctagon },
    { name: 'Recovery', path: '/recovery', icon: RefreshCw },
    { name: 'Merchants', path: '/merchants', icon: Store },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot, badge: 'AI' },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 min-h-screen text-slate-600">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-soft">
            <Zap className="w-5 h-5 stroke-[2.5] fill-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-slate-900 tracking-tight">ClearFlow</span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Revenue Recovery</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-teal-600'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wider ${
                      isActive ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Current Workspace / Role Badge */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-xs text-teal-700">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
            <span className="inline-block text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full mt-0.5">
              {user?.role?.replace('_', ' ') || 'GUEST'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
