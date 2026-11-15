'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Auth.module.css';
import AuthHeroCard from './AuthHeroCard';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';

export default function AuthContainer({
  initialMode = 'login',
  onSuccess,
}) {
  const [mode, setMode] = useState(initialMode);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCartCompleted } = useCheckout();

  // Luôn đồng bộ mode khi initialMode hoặc pathname thay đổi
  useEffect(() => {
    if (pathname === '/login') {
      setMode('login');
    } else if (pathname === '/register') {
      setMode('register');
    } else {
      setMode(initialMode);
    }
  }, [initialMode, pathname]);

  const handleAuthSuccess = () => {
    if (onSuccess) {
      onSuccess();
      return;
    }

    // Nếu giỏ hàng đã có món, tiến hành thanh toán
    // Nếu chưa có món, chuyển sang bước giỏ hàng
    if (isCartCompleted) {
      router.push('/checkout/payment');
    } else {
      router.push('/checkout/cart');
    }
  };

  const handleSwitchToLogin = () => {
    setMode('login');
    if (pathname === '/register') {
      router.push('/login');
    }
  };

  const handleSwitchToRegister = () => {
    setMode('register');
    if (pathname === '/login') {
      router.push('/register');
    }
  };

  // Nếu người dùng đã đăng nhập thành công
  if (user) {
    return (
      <main className={styles.mainContent}>
        <div className={styles.contentGrid}>
          <AuthHeroCard mode="login" />

          <div className={styles.rightColumn}>
            <div className={styles.formWrapper}>
              <h1 className={styles.formTitle}>Chào bạn, {user.name || 'khách hàng'}!</h1>
              <p className={styles.formSubtitle}>
                Bạn đã đăng nhập thành công. Hãy tiếp tục chọn món và thanh toán.
              </p>

              <div
                style={{
                  backgroundColor: '#f7f9f7',
                  border: '1px solid #dbe1dc',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#5f6c64', display: 'block' }}>Họ và tên</span>
                  <strong style={{ fontSize: '16px', color: '#19211d' }}>{user.name}</strong>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#5f6c64', display: 'block' }}>Email</span>
                  <span style={{ fontSize: '14.5px', color: '#19211d' }}>{user.email}</span>
                </div>
                {user.phone && (
                  <div>
                    <span style={{ fontSize: '13px', color: '#5f6c64', display: 'block' }}>Số điện thoại</span>
                    <span style={{ fontSize: '14.5px', color: '#19211d' }}>{user.phone}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleAuthSuccess}
              >
                <span>{isCartCompleted ? 'Tiếp tục thanh toán' : 'Xem giỏ hàng'}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <div className={styles.switchPrompt} style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className={styles.switchButton}
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  style={{ color: '#b91c1c' }}
                >
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.mainContent}>
      <div className={styles.contentGrid}>
        <AuthHeroCard mode={mode} />

        <div className={styles.rightColumn}>
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={handleSwitchToRegister}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={handleSwitchToLogin}
              onSuccess={handleAuthSuccess}
            />
          )}
        </div>
      </div>
    </main>
  );
}
