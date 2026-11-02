'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check local storage for persistent mock session
    try {
      const savedUser = localStorage.getItem('brewlite_user');
      const savedToken = localStorage.getItem('brewlite_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch {
      // ignore SSR or local storage error
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Lấy thông tin họ tên & phone nếu đã từng đăng ký
      let name = email.split('@')[0];
      let phone = '0901 234 567';
      try {
        const storedUsers = JSON.parse(localStorage.getItem('brewlite_registered_users') || '[]');
        const found = storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
      const newUser = {
        email: userData.email,
        name: userData.fullName,
        phone: userData.phone,
        role: 'CUSTOMER',
      };
      // Lưu vào danh sách tài khoản đã đăng ký (không tự động đăng nhập để người dùng dùng nút Đăng nhập)
      try {
        const storedUsers = JSON.parse(localStorage.getItem('brewlite_registered_users') || '[]');
        const updated = storedUsers.filter((u) => u.email.toLowerCase() !== userData.email.toLowerCase()).concat([newUser]);
        localStorage.setItem('brewlite_registered_users', JSON.stringify(updated));
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
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
