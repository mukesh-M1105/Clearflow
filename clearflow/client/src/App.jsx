import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Payments } from './pages/Payments';
import { PaymentDetails } from './pages/PaymentDetails';
import { FailedPayments } from './pages/FailedPayments';
import { RecoveryAttempts } from './pages/RecoveryAttempts';
import { RecoveryCaseDetails } from './pages/RecoveryCaseDetails';
import { Merchants } from './pages/Merchants';
import { MerchantDetails } from './pages/MerchantDetails';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { AIAssistant } from './pages/AIAssistant';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying session credentials..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected SaaS Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/:id" element={<PaymentDetails />} />
        <Route path="failed-payments" element={<FailedPayments />} />
        <Route path="recovery" element={<RecoveryAttempts />} />
        <Route path="recovery/:id" element={<RecoveryCaseDetails />} />
        <Route path="merchants" element={<Merchants />} />
        <Route path="merchants/:id" element={<MerchantDetails />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
