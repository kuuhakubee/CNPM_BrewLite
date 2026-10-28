import React from 'react';
import Link from 'next/link';
import styles from './Layout.module.css';

export default function Header({
  cartCount = 3,
  authButtonText = 'Đăng nhập',
  onAuthClick,
  onCartClick,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Brand Logo */}
        <Link href="/" className={styles.logoGroup}>
          <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
          <span className={styles.logoText}>BrewLite</span>
        </Link>

        {/* Navigation items */}
        <nav className={styles.navLinks}>
          <Link href="/#menu" className={styles.navLink}>Thực đơn</Link>
          <Link href="/#stores" className={styles.navLink}>Cửa hàng</Link>
          <Link href="/#history" className={styles.navLink}>Lịch sử đơn</Link>
        </nav>

        {/* Right side CTAs */}
        <div className={styles.headerRight}>
          {/* Nút Đăng nhập */}
          <button
            type="button"
            className={styles.loginBtn}
            onClick={onAuthClick}
            id="headerAuthBtn"
            title="Đăng nhập / Tài khoản"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{authButtonText}</span>
          </button>

          {/* Nút Giỏ hàng */}
          <button
            type="button"
            className={styles.cartPill}
            onClick={onCartClick}
            id="headerCartBtn"
            title="Xem giỏ hàng"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Giỏ hàng · {cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
