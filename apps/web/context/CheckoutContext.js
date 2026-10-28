'use client';

/**
 * CheckoutContext
 * ───────────────
 * Quản lý trạng thái luồng đặt hàng (Checkout Flow):
 * 1. Ẩn / hiện thanh Stepper (chỉ hiện khi click vào Giỏ hàng hoặc Đăng nhập).
 * 2. Đổi chỗ linh hoạt giữa Giỏ hàng và Tài khoản:
 *    - Chọn Giỏ hàng trước:  1. Giỏ hàng  -> 2. Tài khoản -> 3. Thanh toán -> 4. Xác nhận
 *    - Chọn Đăng nhập trước: 1. Tài khoản -> 2. Giỏ hàng  -> 3. Thanh toán -> 4. Xác nhận
 * 3. Ràng buộc điều kiện:
 *    - Bước 3 (Thanh toán): Chỉ truy cập được khi CẢ Giỏ hàng (có món) VÀ Tài khoản (đã đăng nhập) đã hoàn thành.
 *    - Bước 4 (Xác nhận): Chỉ truy cập được khi Bước 3 (Thanh toán) đã hoàn thành.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const CheckoutContext = createContext(null);

export function CheckoutProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { cartItems, itemCount } = useCart();

  // 1. Trạng thái ẩn/hiện stepper (mặc định ẩn khi mới vào web)
  const [stepperVisible, setStepperVisible] = useState(false);

  // 2. Thứ tự ưu tiên (bước nào được chọn trước: 'cart' | 'account')
  const [firstStep, setFirstStep] = useState('cart');

  // 3. Trạng thái đã hoàn tất thanh toán
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Tự động bật stepper nếu đang ở trong các trang checkout
  useEffect(() => {
    if (pathname && (
      pathname.includes('/checkout/') ||
      pathname === '/login' ||
      pathname === '/register'
    )) {
      setStepperVisible(true);
    }
  }, [pathname]);

  // Kiểm tra trạng thái hoàn thành của từng bước
  const isCartCompleted = itemCount > 0;
  const isAccountCompleted = Boolean(user);

  /**
   * Danh sách 4 bước động dựa trên firstStep
   */
  const getSteps = useCallback(() => {
    if (firstStep === 'account') {
      return [
        {
          key: 'account',
          label: 'Tài khoản',
          href: '/checkout/account',
          isCompleted: isAccountCompleted,
        },
        {
          key: 'cart',
          label: 'Giỏ hàng',
          href: '/checkout/cart',
          isCompleted: isCartCompleted,
        },
        {
          key: 'payment',
          label: 'Thanh toán',
          href: '/checkout/payment',
          isCompleted: paymentCompleted,
        },
        {
          key: 'confirmation',
          label: 'Xác nhận',
          href: '/checkout/confirmation',
          isCompleted: paymentCompleted,
        },
      ];
    }

    // Mặc định: Giỏ hàng trước
    return [
      {
        key: 'cart',
        label: 'Giỏ hàng',
        href: '/checkout/cart',
        isCompleted: isCartCompleted,
      },
      {
        key: 'account',
        label: 'Tài khoản',
        href: '/checkout/account',
        isCompleted: isAccountCompleted,
      },
      {
        key: 'payment',
        label: 'Thanh toán',
        href: '/checkout/payment',
        isCompleted: paymentCompleted,
      },
      {
        key: 'confirmation',
        label: 'Xác nhận',
        href: '/checkout/confirmation',
        isCompleted: paymentCompleted,
      },
    ];
  }, [firstStep, isCartCompleted, isAccountCompleted, paymentCompleted]);

  /**
   * Kiểm tra ràng buộc điều kiện khi muốn vào một bước cụ thể
   */
  const checkStepAccess = useCallback(
    (targetKey) => {
      if (targetKey === 'cart' || targetKey === 'account') {
        return { allowed: true };
      }

      if (targetKey === 'payment') {
        if (!isCartCompleted) {
          return {
            allowed: false,
            reason: 'Giỏ hàng của bạn đang trống. Vui lòng chọn món trước khi thanh toán.',
            redirectTo: '/checkout/cart',
          };
        }
        if (!isAccountCompleted) {
          return {
            allowed: false,
            reason: 'Vui lòng đăng nhập hoặc tạo tài khoản trước khi tiến hành thanh toán.',
            redirectTo: '/checkout/account',
          };
        }
        return { allowed: true };
      }

      if (targetKey === 'confirmation') {
        if (!paymentCompleted) {
          return {
            allowed: false,
            reason: 'Vui lòng hoàn tất thanh toán trước khi xem xác nhận đơn hàng.',
            redirectTo: '/checkout/payment',
          };
        }
        return { allowed: true };
      }

      return { allowed: true };
    },
    [isCartCompleted, isAccountCompleted, paymentCompleted]
  );

  /**
   * Điều hướng an toàn có kiểm tra điều kiện
   */
  const navigateToStep = useCallback(
    (targetKey) => {
      setStepperVisible(true);
      const access = checkStepAccess(targetKey);

      if (!access.allowed) {
        alert(access.reason);
        if (access.redirectTo) {
          router.push(access.redirectTo);
        }
        return false;
      }

      const steps = getSteps();
      const targetStep = steps.find((s) => s.key === targetKey);
      if (targetStep) {
        router.push(targetStep.href);
      }
      return true;
    },
    [checkStepAccess, getSteps, router]
  );

  /**
   * Kích hoạt khi người dùng click vào nút Đăng nhập ở Header
   */
  const startAuthFlow = useCallback(() => {
    setFirstStep('account');
    setStepperVisible(true);
    router.push('/checkout/account');
  }, [router]);

  /**
   * Kích hoạt khi người dùng click vào nút Giỏ hàng ở Header
   */
  const startCartFlow = useCallback(() => {
    setFirstStep('cart');
    setStepperVisible(true);
    router.push('/checkout/cart');
  }, [router]);

  /** Đánh dấu bước hoàn thành */
  const markPaymentComplete = useCallback(() => {
    setPaymentCompleted(true);
  }, []);

  /** Reset lại toàn bộ tiến trình khi hoàn tất */
  const resetCheckout = useCallback(() => {
    setPaymentCompleted(false);
    setStepperVisible(false);
  }, []);

  return (
    <CheckoutContext.Provider
      value={{
        stepperVisible,
        setStepperVisible,
        firstStep,
        setFirstStep,
        getSteps,
        checkStepAccess,
        navigateToStep,
        startAuthFlow,
        startCartFlow,
        isCartCompleted,
        isAccountCompleted,
        paymentCompleted,
        markPaymentComplete,
        resetCheckout,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
