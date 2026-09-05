import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('manager@clearflow.com');
  const [password, setPassword] = useState('Manager@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillCredentials(demoEmail, demoPass) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-xl shadow-teal-500/30 mb-4">
          <Zap className="w-8 h-8 stroke-[2.5] fill-white" />
        </div>
        <h2 className="text-3xl font-display font-extrabold text-white tracking-tight">
          ClearFlow
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          AI-Powered Payment Revenue Recovery Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-md shadow-teal-500/20 disabled:opacity-60 transition-colors mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to ClearFlow'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Account Quick Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Quick Demo Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('manager@clearflow.com', 'Manager@123')}
                className="text-[11px] font-semibold py-2 px-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg border border-teal-200 transition-colors text-center"
              >
                Revenue Mgr
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@clearflow.com', 'Admin@123')}
                className="text-[11px] font-semibold py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('merchant@clearflow.com', 'Merchant@123')}
                className="text-[11px] font-semibold py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors text-center"
              >
                Merchant
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-teal-600 hover:text-teal-500">
              Register Merchant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
