import React from 'react';
import styles from './Layout.module.css';

export default function TopBanner({ 
  text = 'BẢN THIẾT KẾ MVP',
  pickupText = 'Nhận tại quầy',
  mockPaymentText = 'Thanh toán mẫu, không phát sinh giao dịch'
}) {
  return (
    <div className={styles.topBanner}>
      <span>{text}</span>
      <span className={styles.bannerDot}>•</span>
      <span>{pickupText}</span>
      <span className={styles.bannerDot}>•</span>
      <span>{mockPaymentText}</span>
    </div>
  );
}
