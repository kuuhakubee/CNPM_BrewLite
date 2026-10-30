'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import TopBanner from './TopBanner';
import CheckoutStepper from '../checkout/CheckoutStepper';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { CartProvider, useCart } from '../../context/CartContext';
import { CheckoutProvider, useCheckout } from '../../context/CheckoutContext';
import { useRouter, usePathname } from 'next/navigation';

function LayoutInner({ children }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { startAuthFlow, startCartFlow } = useCheckout();
  const pathname = usePathname();

  const isConfirmation = pathname?.includes('/confirmation');
  const displayCartCount = isConfirmation ? 0 : itemCount;
  const displayAuthName = user ? (user.name || user.fullName || 'Minh Anh') : 'Đăng nhập';

  const handleAuthClick = () => {
    if (user) {
      if (confirm(`Bạn có muốn đăng xuất khỏi tài khoản ${user.email}?`)) {
        logout();
      }
    } else {
      startAuthFlow();
    }
  };

  const handleCartClick = () => {
    startCartFlow();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBanner />
      <Header
        cartCount={displayCartCount}
        authButtonText={displayAuthName}
        onAuthClick={handleAuthClick}
        onCartClick={handleCartClick}
      />
      <CheckoutStepper />

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
        <CheckoutProvider>
          <LayoutInner>{children}</LayoutInner>
        </CheckoutProvider>
      </CartProvider>
    </AuthProvider>
  );
}