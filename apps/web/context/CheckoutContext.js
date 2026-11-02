'use client';

/**
 * CheckoutContext
 * ───────────────
 * Quản lý trạng thái luồng đặt hàng (Checkout Flow):
 * 1. Thanh Stepper từ 1 đến 4 CHỈ hiện khi người dùng đã đăng nhập thành công.
 * 2. Khóa phần 1 (bước đầu tiên) không thể can thiệp lại.
 * 3. Ràng buộc điều kiện thanh toán và xác nhận.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const CheckoutContext = createContext(null);

export function CheckoutProvider({ children }) {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems, itemCount } = useCart();

  // Thứ tự ưu tiên bước
  const [firstStep, setFirstStep] = useState('cart');

  // Trạng thái đã hoàn tất thanh toán
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Kiểm tra trạng thái hoàn thành
  const isCartCompleted = itemCount > 0;
  const isAccountCompleted = Boolean(user);

  // Thanh stepper từ 1 đến 4 CHỈ HIỆN khi người dùng đăng nhập thành công
  const stepperVisible = isAccountCompleted;
  const setStepperVisible = useCallback(() => {}, []);

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

    // Mặc định: Tài khoản trước (khóa), Giỏ hàng sau
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
  }, [firstStep, isCartCompleted, isAccountCompleted, paymentCompleted]);

  /**
   * Kiểm tra ràng buộc điều kiện khi muốn vào một bước cụ thể
   */
  const checkStepAccess = useCallback(
    (targetKey) => {
      const steps = getSteps();
      // Khóa phần 1 (bước đầu tiên) - không thể can thiệp
      if (steps[0] && targetKey === steps[0].key) {
        return {
          allowed: false,
          reason: `Bước 1 (${steps[0].label}) đã hoàn thành và được khóa, không thể can thiệp lại.`,
        };
      }

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
            redirectTo: '/login',
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
    [getSteps, isCartCompleted, isAccountCompleted, paymentCompleted]
  );

  /**
   * Điều hướng an toàn có kiểm tra điều kiện
   */
  const navigateToStep = useCallback(
    (targetKey) => {
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
   * Luôn chuyển dứt khoát về trang /login
   */
  const startAuthFlow = useCallback(() => {
    setFirstStep('account');
    router.push('/login');
  }, [router]);

  /**
   * Kích hoạt khi người dùng click vào nút Giỏ hàng ở Header
   */
  const startCartFlow = useCallback(() => {
    setFirstStep('cart');
    router.push('/checkout/cart');
  }, [router]);

  /** Đánh dấu bước hoàn thành */
  const markPaymentComplete = useCallback(() => {
    setPaymentCompleted(true);
  }, []);

  /** Reset lại toàn bộ tiến trình khi hoàn tất */
  const resetCheckout = useCallback(() => {
    setPaymentCompleted(false);
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
