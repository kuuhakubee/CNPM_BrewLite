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
      // Mock login response (in production: await authService.login(email, password))
      const mockUser = {
        email,
        name: email.split('@')[0],
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
      const mockToken = 'mock-jwt-token-' + Date.now();
      setUser(newUser);
      setToken(mockToken);
      localStorage.setItem('brewlite_user', JSON.stringify(newUser));
      localStorage.setItem('brewlite_token', mockToken);
      return { success: true, user: newUser };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('brewlite_user');
    localStorage.removeItem('brewlite_token');
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
