import React from 'react';
import styles from './Layout.module.css';

export default function Header({
  cartCount = 3,
  authButtonText = 'Đăng nhập',
  onAuthClick,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Brand Logo */}
        <a href="/" className={styles.logoGroup}>
          <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
          <span className={styles.logoText}>BrewLite</span>
        </a>

        {/* Navigation items */}
        <nav className={styles.navLinks}>
          <a href="#menu" className={styles.navLink}>Thực đơn</a>
          <a href="#stores" className={styles.navLink}>Cửa hàng</a>
          <a href="#history" className={styles.navLink}>Lịch sử đơn</a>
        </nav>

        {/* Right side CTAs */}
        <div className={styles.headerRight}>
          <button type="button" className={styles.loginBtn} onClick={onAuthClick}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{authButtonText}</span>
          </button>

          <div className={styles.cartPill}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Giỏ hàng · {cartCount}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
