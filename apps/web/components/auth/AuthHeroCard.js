import React from 'react';
import styles from './Auth.module.css';

export default function AuthHeroCard({ mode = 'login' }) {
  const isLogin = mode === 'login';

  return (
    <div className={styles.leftColumn}>
      <div className={styles.heroCard}>
        <img
          src={isLogin ? '/cafe-hero-login.png' : '/cafe-hero-register.png'}
          alt="BrewLite Coffee Bar"
          className={styles.heroImage}
        />

        {/* White floating card at the bottom */}
        <div className={styles.floatingCard}>
          <span className={styles.floatingTag}>
            {isLogin
              ? 'MỘT KHOẢNG DỪNG DÀNH CHO BẠN'
              : 'THÊM MỘT NGƯỜI BẠN, THÊM MỘT GU MỚI'}
          </span>
          <h3 className={styles.floatingTitle}>
            {isLogin ? 'Gu quen, không cần chờ lâu.' : 'Hẹn bạn ở ly đầu tiên.'}
          </h3>
          <p className={styles.floatingDesc}>
            {isLogin
              ? 'Lưu đơn yêu thích. Đặt trước và ghé nhận tại quầy.'
              : 'Một tài khoản cho giỏ hàng, trạng thái đơn và những lần đặt lại.'}
          </p>
        </div>
      </div>
    </div>
  );
}
