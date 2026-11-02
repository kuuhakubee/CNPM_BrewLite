'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Auth.module.css';
import AuthHeroCard from './AuthHeroCard';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useCheckout } from '../../context/CheckoutContext';

export default function AuthContainer({
  initialMode = 'login',
  onSuccess,
}) {
  const [mode, setMode] = useState(initialMode);
  const router = useRouter();
  const { isCartCompleted, setStepperVisible } = useCheckout();

  // Hiển thị stepper khi đang ở trang xác thực
  useEffect(() => {
    setStepperVisible(true);
  }, [setStepperVisible]);

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

  return (
    <main className={styles.mainContent}>
      <div className={styles.contentGrid}>
        <AuthHeroCard mode={mode} />

        <div className={styles.rightColumn}>
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setMode('register')}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setMode('login')}
              onSuccess={handleAuthSuccess}
            />
          )}
        </div>
      </div>
    </main>
  );
}
