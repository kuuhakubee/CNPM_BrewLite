'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('brewlite_user');
      const savedToken = localStorage.getItem('brewlite_token');
      // Không nạp lại nếu là token mock giả lập cũ
      if (savedUser && savedToken && !savedToken.startsWith('mock-')) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } else if (savedToken && savedToken.startsWith('mock-')) {
        localStorage.removeItem('brewlite_user');
        localStorage.removeItem('brewlite_token');
      }
    } catch {
      // ignore
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res && res.accessToken) {
        const userObj = {
          id: res.user?.id,
          email: res.user?.email || email,
          name: res.user?.name || res.user?.email?.split('@')[0] || email.split('@')[0],
          role: res.user?.role || 'CUSTOMER',
          loyaltyPoints: res.user?.loyaltyPoints || 0,
        };
        setUser(userObj);
        setToken(res.accessToken);
        localStorage.setItem('brewlite_user', JSON.stringify(userObj));
        localStorage.setItem('brewlite_token', res.accessToken);
        return { success: true, user: userObj };
      }
      throw new Error('Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await authService.register(userData);
      if (res && res.accessToken) {
        const userObj = {
          id: res.user?.id,
          email: res.user?.email || userData.email,
          name: userData.fullName || res.user?.name || userData.email.split('@')[0],
          phone: userData.phone || '',
          role: res.user?.role || 'CUSTOMER',
          loyaltyPoints: res.user?.loyaltyPoints || 0,
        };
        setUser(userObj);
        setToken(res.accessToken);
        localStorage.setItem('brewlite_user', JSON.stringify(userObj));
        localStorage.setItem('brewlite_token', res.accessToken);
        return { success: true, user: userObj };
      }
      throw new Error('Đăng ký không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('brewlite_user');
      localStorage.removeItem('brewlite_token');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
