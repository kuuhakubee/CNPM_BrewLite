'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import styles from './CheckoutStepper.module.css';
import { useCheckout } from '../../context/CheckoutContext';

export default function CheckoutStepper() {
  const pathname = usePathname();
  const { stepperVisible, getSteps, navigateToStep } = useCheckout();

  // Thanh từ 1 đến 4 CHỈ hiện khi người dùng đã đăng nhập thành công
  if (!stepperVisible) {
    return null;
  }

  // Lấy danh sách 4 bước theo thứ tự linh hoạt
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
          // Phần 1 (bước đầu tiên - index 0) luôn bị khóa, không thể can thiệp
          const isLocked = index === 0;

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                onClick={() => {
                  if (!isLocked) {
                    navigateToStep(step.key);
                  }
                }}
                className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ''} ${
                  isLocked ? styles.stepItemLocked : ''
                }`}
                title={
                  isLocked
                    ? `Bước ${index + 1}: ${step.label} (Đã khóa)`
                    : `Bước ${index + 1}: ${step.label}`
                }
                aria-disabled={isLocked}
                disabled={isLocked}
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
                  {isLocked && ' 🔒'}
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
