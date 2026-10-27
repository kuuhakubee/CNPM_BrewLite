'use client';

import React, { useState } from 'react';
import styles from './Auth.module.css';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function LoginForm({ onSwitchToRegister, onSuccess }) {
  const { login, isLoading } = useAuth();
  const { itemCount, formattedTotal } = useCart();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Field errors
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Validate individual field
  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        error = 'Vui lòng nhập địa chỉ email.';
      } else if (!emailRegex.test(value.trim())) {
        error = 'Email không đúng định dạng (ví dụ: ten@email.com).';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Vui lòng nhập mật khẩu.';
      } else if (value.length < 8) {
        error = 'Mật khẩu phải có ít nhất 8 ký tự.';
      }
    }
    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'email' ? email : password;
    const error = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      return;
    }

    try {
      await login(email.trim(), password);
      if (onSuccess) {
        onSuccess();
      } else {
        alert(`Đăng nhập thành công! Chào mừng trở lại, ${email}.`);
      }
    } catch (err) {
      setGeneralError(err.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
    }
  };

  return (
    <div className={styles.formWrapper}>
      <h1 className={styles.formTitle}>Chào bạn trở lại.</h1>
      <p className={styles.formSubtitle}>Đăng nhập để tiếp tục với tài khoản và đơn hàng của bạn.</p>

      {/* Preservation of Cart Banner */}
      <div className={styles.infoAlert}>
        <div className={styles.infoIconWrapper}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#234d3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <span className={styles.infoAlertText}>
          Giỏ của bạn được giữ nguyên: <strong>{itemCount} món · {formattedTotal}</strong>.
        </span>
      </div>

      {/* Logical Position for Required Fields Note */}
      <div className={styles.requiredNotice}>
        <span className={styles.requiredStar}>*</span> Các trường có dấu (*) là bắt buộc
      </div>

      {generalError && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13.5px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* Email Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Email <span className={styles.requiredStar}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="minhanh@email.com"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            />
            <span className={styles.inputIconRight}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={errors.email ? '#dc2626' : '#718076'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
          </div>
          {errors.email && (
            <span className={styles.fieldError}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.email}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Mật khẩu <span className={styles.requiredStar}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••••••"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.iconButton}
              tabIndex={-1}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <span className={styles.fieldError}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.password}
            </span>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className={styles.rowBetween}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <a href="#forgot-password" className={styles.forgotLink}>Quên mật khẩu?</a>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={isLoading} className={styles.primaryButton}>
          <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập & tiếp tục'}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        {/* Switch Link */}
        <div className={styles.switchPrompt}>
          Chưa có tài khoản?{' '}
          <button
            type="button"
            className={styles.switchButton}
            onClick={onSwitchToRegister}
          >
            Đăng ký ngay
          </button>
        </div>
      </form>
    </div>
  );
}
