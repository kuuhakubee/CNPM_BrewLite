import React from 'react';
import styles from './Layout.module.css';

export default function Footer({
  slogan = 'BrewLite / Một chút chậm, một ngày thật ngon.',
}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerBrand}>
          {slogan}
        </div>
        <div className={styles.footerLinks}>
          <a href="#support" className={styles.footerLink}>Hỗ trợ</a>
          <span className={styles.footerDot}>•</span>
          <a href="#terms" className={styles.footerLink}>Điều khoản</a>
          <span className={styles.footerDot}>•</span>
          <a href="#privacy" className={styles.footerLink}>Quyền riêng tư</a>
        </div>
      </div>
    </footer>
  );
}
