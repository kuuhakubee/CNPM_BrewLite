'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import styles from './CheckoutStepper.module.css';
import { useCheckout } from '../../context/CheckoutContext';

export default function CheckoutStepper() {
  const pathname = usePathname();
  const { stepperVisible, getSteps, navigateToStep } = useCheckout();

  // 1. Ẩn thanh tiến trình nếu chưa kích hoạt từ Giỏ hàng hoặc Đăng nhập
  if (!stepperVisible) {
    return null;
  }

  // Lấy danh sách 4 bước theo thứ tự linh hoạt (Giỏ hàng trước hoặc Tài khoản trước)
  const steps = getSteps();

  // Xác định bước hiện tại dựa theo đường dẫn URL
  const getCurrentKey = () => {
    if (pathname?.includes('/confirmation')) return 'confirmation';
    if (pathname?.includes('/payment')) return 'payment';
    if (pathname?.includes('/account') || pathname === '/login' || pathname === '/register') return 'account';
    if (pathname?.includes('/cart')) return 'cart';
    return steps[0]?.key || 'cart';
  };

  const currentKey = getCurrentKey();
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <nav className={styles.stepperSection} aria-label="Tiến trình đặt hàng">
      <div className={styles.stepperContainer}>
        {steps.map((step, index) => {
          const isActive = step.key === currentKey;
          const isPassed = step.isCompleted && !isActive;

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                onClick={() => navigateToStep(step.key)}
                className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ''}`}
                title={`Bước ${index + 1}: ${step.label}`}
              >
                <div
                  className={`${styles.stepCircle} ${
                    isPassed
                      ? styles.completedCircle
                      : isActive
                      ? styles.activeCircle
                      : styles.pendingCircle
                  }`}
                >
                  {isPassed ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span
                  className={`${styles.stepLabel} ${
                    isActive
                      ? styles.activeLabel
                      : isPassed
                      ? styles.completedLabel
                      : styles.pendingLabel
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`${styles.stepConnector} ${
                    index < currentIndex ? styles.stepConnectorActive : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
