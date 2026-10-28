'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import TopBanner from './TopBanner';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { CartProvider, useCart } from '../../context/CartContext';
import { useRouter } from 'next/navigation';

function LayoutInner({ children }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const handleAuthClick = () => {
    if (user) {
      if (confirm(`Bạn có muốn đăng xuất khỏi tài khoản ${user.email}?`)) {
        logout();
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBanner />
      <Header
        cartCount={itemCount}
        authButtonText={user ? user.name : 'Đăng nhập'}
        onAuthClick={handleAuthClick}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <LayoutInner>{children}</LayoutInner>
      </CartProvider>
    </AuthProvider>
  );
}
