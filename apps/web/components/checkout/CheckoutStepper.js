import React from 'react';
import styles from './CheckoutStepper.module.css';

const STEPS = [
  { id: 1, label: 'Giỏ hàng' },
  { id: 2, label: 'Tài khoản' },
  { id: 3, label: 'Thanh toán' },
  { id: 4, label: 'Xác nhận' },
];

export default function CheckoutStepper({ currentStep = 2 }) {
  return (
    <section className={styles.stepperSection}>
      <div className={styles.stepperContainer}>
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className={styles.stepItem}>
                <div
                  className={`${styles.stepCircle} ${
                    isCompleted
                      ? styles.completedCircle
                      : isActive
                      ? styles.activeCircle
                      : styles.pendingCircle
                  }`}
                >
                  {isCompleted ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span
                  className={`${styles.stepLabel} ${
                    isCompleted
                      ? styles.completedLabel
                      : isActive
                      ? styles.activeLabel
                      : styles.pendingLabel
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && <div className={styles.stepConnector} />}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
