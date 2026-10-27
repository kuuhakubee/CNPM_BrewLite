'use client';

import React, { useState } from 'react';
import styles from './Auth.module.css';
import AuthHeroCard from './AuthHeroCard';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthContainer({
  initialMode = 'login',
  onSuccess,
}) {
  const [mode, setMode] = useState(initialMode);

  return (
    <main className={styles.mainContent}>
      <div className={styles.contentGrid}>
        {/* Left Visual Hero */}
        <AuthHeroCard mode={mode} />

        {/* Right Form Component */}
        <div className={styles.rightColumn}>
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setMode('register')}
              onSuccess={onSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setMode('login')}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </div>
    </main>
  );
}
