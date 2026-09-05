import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clearflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('clearflow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('clearflow_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('clearflow_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, []);

  async function login(email, password) {
    const res = await authService.login(email, password);
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('clearflow_token', res.data.token);
      localStorage.setItem('clearflow_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  }

  async function register(userData) {
    const res = await authService.register(userData);
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('clearflow_token', res.data.token);
      localStorage.setItem('clearflow_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('clearflow_token');
    localStorage.removeItem('clearflow_user');
  }

  const isAdmin = user?.role === 'ADMIN';
  const isRevenueManager = user?.role === 'REVENUE_MANAGER';
  const isMerchant = user?.role === 'MERCHANT';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        isRevenueManager,
        isMerchant
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
