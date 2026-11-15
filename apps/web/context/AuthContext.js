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
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch {
      // ignore
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // 1. Kết nối API Backend thực tế
      try {
        const res = await authService.login(email, password);
        if (res && res.accessToken && !res.accessToken.startsWith('mock-')) {
          const userObj = {
            id: res.user?.id,
            email: res.user?.email || email,
            name: res.user?.name || email.split('@')[0],
            role: res.user?.role || 'CUSTOMER',
            loyaltyPoints: res.user?.loyaltyPoints || 0,
          };
          setUser(userObj);
          setToken(res.accessToken);
          localStorage.setItem('brewlite_user', JSON.stringify(userObj));
          localStorage.setItem('brewlite_token', res.accessToken);
          return { success: true, user: userObj };
        }
      } catch (backendErr) {
        console.warn('Backend API login không khả dụng, dùng phiên cục bộ:', backendErr?.message);
      }

      // 2. Fallback nếu backend đang tắt hoặc chưa kết nối DB
      let name = email.split('@')[0];
      let phone = '0901 234 567';
      try {
        const storedUsers = JSON.parse(
          localStorage.getItem('brewlite_registered_users') || '[]',
        );
        const found = storedUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        if (found) {
          name = found.name || name;
          phone = found.phone || phone;
        }
      } catch {}

      const mockUser = {
        email,
        name,
        phone,
        role: 'CUSTOMER',
      };
      const mockToken = 'mock-jwt-token-' + Date.now();
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('brewlite_user', JSON.stringify(mockUser));
      localStorage.setItem('brewlite_token', mockToken);
      return { success: true, user: mockUser };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      try {
        const res = await authService.register(userData);
        if (res && res.accessToken && !res.accessToken.startsWith('mock-')) {
          const userObj = {
            id: res.user?.id,
            email: res.user?.email || userData.email,
            name: userData.fullName || userData.email.split('@')[0],
            phone: userData.phone || '0901 234 567',
            role: res.user?.role || 'CUSTOMER',
          };
          setUser(userObj);
          setToken(res.accessToken);
          localStorage.setItem('brewlite_user', JSON.stringify(userObj));
          localStorage.setItem('brewlite_token', res.accessToken);
          return { success: true, user: userObj };
        }
      } catch (err) {
        console.warn('Backend API register không khả dụng, lưu tài khoản cục bộ:', err?.message);
      }

      const newUser = {
        email: userData.email,
        name: userData.fullName,
        phone: userData.phone,
        role: 'CUSTOMER',
      };
      try {
        const storedUsers = JSON.parse(
          localStorage.getItem('brewlite_registered_users') || '[]',
        );
        const updated = storedUsers
          .filter((u) => u.email.toLowerCase() !== userData.email.toLowerCase())
          .concat([newUser]);
        localStorage.setItem(
          'brewlite_registered_users',
          JSON.stringify(updated),
        );
      } catch {}

      return { success: true, user: newUser };
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
