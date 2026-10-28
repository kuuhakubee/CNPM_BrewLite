'use client';

import React, { useState } from 'react';
import styles from './Auth.module.css';
import { useAuth } from '../../context/AuthContext';

export default function RegisterForm({ onSwitchToLogin, onSuccess }) {
  const { register, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Field errors & touched states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Regex patterns theo từng đặc trưng
  const NAME_REGEX = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
  const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  // Validate từng trường cụ thể
  const validateField = (name, value, allValues = {}) => {
    let error = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Vui lòng nhập họ và tên.';
        } else if (value.trim().length < 2) {
          error = 'Họ và tên phải có ít nhất 2 ký tự.';
        } else if (!NAME_REGEX.test(value.trim())) {
          error = 'Họ và tên chỉ được chứa chữ cái, không bao gồm số hoặc ký tự đặc biệt.';
        }
        break;

      case 'phone':
        if (!value.trim()) {
          error = 'Vui lòng nhập số điện thoại.';
        } else if (!PHONE_REGEX.test(value.trim().replace(/\s+/g, ''))) {
          error = 'Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Vui lòng nhập địa chỉ email.';
        } else if (!EMAIL_REGEX.test(value.trim())) {
          error = 'Email không đúng định dạng (ví dụ: ten@email.com).';
        }
        break;

      case 'password':
        if (!value) {
          error = 'Vui lòng nhập mật khẩu.';
        } else if (value.length < 8) {
          error = 'Mật khẩu phải có ít nhất 8 ký tự.';
        } else if (!PASSWORD_REGEX.test(value)) {
          error = 'Mật khẩu phải bao gồm cả chữ hoa, chữ thường và chữ số.';
        }
        break;

      case 'confirmPassword':
        const targetPass = allValues.password !== undefined ? allValues.password : password;
        if (!value) {
          error = 'Vui lòng nhập lại mật khẩu.';
        } else if (value !== targetPass) {
          error = 'Mật khẩu xác nhận không trùng khớp.';
        }
        break;

      case 'agreeTerms':
        if (!value) {
          error = 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val;
    if (field === 'fullName') val = fullName;
    else if (field === 'phone') val = phone;
    else if (field === 'email') val = email;
    else if (field === 'password') val = password;
    else if (field === 'confirmPassword') val = confirmPassword;
    else if (field === 'agreeTerms') val = agreeTerms;

    const error = validateField(field, val, { password });
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    if (field === 'fullName') setFullName(value);
    if (field === 'phone') setPhone(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') {
      setPassword(value);
      if (touched.confirmPassword) {
        const confirmErr = validateField('confirmPassword', confirmPassword, { password: value });
        setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
      }
    }
    if (field === 'confirmPassword') setConfirmPassword(value);
    if (field === 'agreeTerms') setAgreeTerms(value);

    if (touched[field]) {
      const error = validateField(field, value, { password });
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const newErrors = {
      fullName: validateField('fullName', fullName),
      phone: validateField('phone', phone),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword, { password }),
      agreeTerms: validateField('agreeTerms', agreeTerms),
    };

    setTouched({
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    setErrors(newErrors);

    // Kiểm tra nếu có bất kỳ trường nào có lỗi
    const hasError = Object.values(newErrors).some((err) => Boolean(err));
    if (hasError) {
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      if (onSuccess) {
        onSuccess();
      } else {
        alert(`Tạo tài khoản thành công cho: ${fullName} (${email})!`);
      }
    } catch (err) {
      setGeneralError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    }
  };

  return (
    <div className={styles.formWrapper}>
      {/* Tiêu đề chính trang Đăng ký */}
      <h1 className={styles.formTitle}>Bắt đầu với BrewLite.</h1>
      <p className={styles.formSubtitle}>
        Tạo tài khoản để lưu đơn yêu thích và trải nghiệm đặt trước tiện lợi.
      </p>

      {/* Vị trí hợp lý cho ghi chú các trường bắt buộc */}
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
          gap: '8px',
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
        {/* Row 1: Full Name & Phone Number */}
        <div className={styles.formTwoCols}>
          {/* Họ và tên */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Họ và tên <span className={styles.requiredStar}>*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              placeholder="Nguyễn Minh Anh"
              className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
            />
            {errors.fullName && (
              <span className={styles.fieldError}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Số điện thoại */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Số điện thoại <span className={styles.requiredStar}>*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder="0901 234 567"
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            />
            {errors.phone && (
              <span className={styles.fieldError}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errors.phone}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Email */}
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

        {/* Row 3: Password */}
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
          {errors.password ? (
            <span className={styles.fieldError}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.password}
            </span>
          ) : (
            <span className={styles.helperText}>
              Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số.
            </span>
          )}
        </div>

        {/* Row 4: Confirm Password */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Nhập lại mật khẩu <span className={styles.requiredStar}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="••••••••••••"
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={styles.iconButton}
              tabIndex={-1}
              title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? (
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
          {errors.confirmPassword && (
            <span className={styles.fieldError}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.confirmPassword}
            </span>
          )}
        </div>

        {/* Row 5: Terms Checkbox */}
        <div style={{ marginTop: '4px', marginBottom: '4px' }}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => handleChange('agreeTerms', e.target.checked)}
              onBlur={() => handleBlur('agreeTerms')}
              className={styles.checkbox}
            />
            <span style={{ fontSize: '13.5px', color: '#333e37', lineHeight: 1.4 }}>
              Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của BrewLite. <span className={styles.requiredStar}>*</span>
            </span>
          </label>
          {errors.agreeTerms && (
            <span className={styles.fieldError} style={{ marginTop: '6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.agreeTerms}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={isLoading} className={styles.primaryButton}>
          <span>{isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & tiếp tục'}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        {/* Switch to Login */}
        <div className={styles.switchPrompt}>
          Đã có tài khoản?{' '}
          <button
            type="button"
            className={styles.switchButton}
            onClick={onSwitchToLogin}
          >
            Đăng nhập
          </button>
        </div>
      </form>
    </div>
  );
}
