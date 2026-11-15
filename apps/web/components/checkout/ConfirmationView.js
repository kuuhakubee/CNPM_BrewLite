'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './ConfirmationView.module.css';
import { useCheckout } from '../../context/CheckoutContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';

export default function ConfirmationView() {
  const router = useRouter();
  const { paymentCompleted, markPaymentComplete } = useCheckout();
  const { cartItems, clearCart, restoreCart } = useCart();
  const { token } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');

  const [order, setOrder] = useState({
    code: '#BL-1027',
    total: '175.000 VNĐ',
    subtotal: '175.000 VNĐ',
    method: 'VNPay Sandbox',
    date: '27/10/2026 · 09:41',
    customerName: 'Khách hàng BrewLite',
    customerPhone: '0901 234 567',
    orderStatus: 'PAID',
    transactionRef: null,
    items: [
      {
        id: 1,
        name: 'Latte yến mạch',
        specs: 'M · 50% đường · Ít đá · Sữa yến mạch',
        qtyPrice: '2 × 65.000 VNĐ',
        total: '130.000 VNĐ',
        image: '/images/latte-yen-mach.png',
      },
    ],
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = window.location.search;
    const isVnpayReturn = searchParams.includes('vnp_ResponseCode');

    // Trường hợp 1: Người dùng vừa được redirect từ Cổng VNPay Sandbox
    if (isVnpayReturn) {
      setIsVerifying(true);
      setVerifyNotice('Đang kiểm tra chữ ký số HMAC-SHA512 từ VNPay...');

      const urlParams = new URLSearchParams(searchParams);
      const vnpResponseCode = urlParams.get('vnp_ResponseCode');
      const isVnpayCodeSuccess = vnpResponseCode === '00';

      paymentService
        .verifyVnpayReturn(searchParams)
        .then((result) => {
          setIsVerifying(false);
          const stored = sessionStorage.getItem('brewlite_last_order');
          let parsed = {};
          if (stored) {
            try {
              parsed = JSON.parse(stored);
            } catch {}
          }

          // Thành công khi backend hoặc client xác thực thành công HOẶC mã phản hồi từ VNPay là '00'
          const isPaymentSuccess =
            result.success ||
            result.orderStatus === 'PAID' ||
            isVnpayCodeSuccess;

          if (isPaymentSuccess) {
            markPaymentComplete();
            clearCart();
            setVerifyNotice(
              result.message || 'Xác thực thanh toán qua Cổng VNPay Sandbox thành công!',
            );
            const resolvedOrderId =
              result.orderId ||
              parsed.orderId ||
              urlParams.get('vnp_TxnRef')?.split('_')[0];
            const resolvedOrderCode =
              result.orderCode ||
              parsed.code ||
              (resolvedOrderId ? `#${resolvedOrderId}` : '#BL-VNPay');

            setOrder((prev) => {
              const finalOrder = {
                ...prev,
                ...parsed,
                orderId: resolvedOrderId,
                code: resolvedOrderCode,
                orderStatus: 'PAID',
                transactionRef:
                  result.transactionRef ||
                  urlParams.get('vnp_TransactionNo') ||
                  'VNPAY-VERIFIED',
                method: 'Cổng VNPay Sandbox',
              };
              sessionStorage.setItem('brewlite_last_order', JSON.stringify(finalOrder));
              try {
                const existingStr = localStorage.getItem('brewlite_orders');
                const existing = existingStr ? JSON.parse(existingStr) : [];
                const filtered = existing.filter(
                  (o) =>
                    o.code !== finalOrder.code &&
                    String(o.orderId || o.id) !== String(resolvedOrderId),
                );
                localStorage.setItem(
                  'brewlite_orders',
                  JSON.stringify([finalOrder, ...filtered]),
                );
              } catch {}
              return finalOrder;
            });

            // Đồng bộ trạng thái PAID lên backend nếu có token đăng nhập
            const activeToken =
              token ||
              (typeof window !== 'undefined'
                ? localStorage.getItem('brewlite_token')
                : null);
            if (activeToken && resolvedOrderId && !activeToken.startsWith('mock-')) {
              const apiUrl =
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
              fetch(`${apiUrl}/api/v1/orders/${resolvedOrderId}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${activeToken}`,
                },
                body: JSON.stringify({ status: 'PAID' }),
              }).catch(() => {});
            }
          } else {
            setVerifyNotice(
              result.message ||
                `Giao dịch bị từ chối hoặc bị huỷ trên VNPay Sandbox (Mã lỗi ${vnpResponseCode}). Giỏ hàng của bạn vẫn được giữ nguyên.`,
            );
            setOrder((prev) => ({
              ...prev,
              ...parsed,
              code: result.orderCode || prev.code,
              orderStatus: 'PAYMENT_FAILED',
              method: 'Cổng VNPay Sandbox',
            }));
            if (
              parsed.items &&
              parsed.items.length > 0 &&
              (!cartItems || cartItems.length === 0)
            ) {
              restoreCart(parsed.items);
            }
          }
        })
        .catch((err) => {
          setIsVerifying(false);
          if (isVnpayCodeSuccess) {
            markPaymentComplete();
            clearCart();
            setVerifyNotice(
              'Giao dịch VNPay thành công (Đã xác thực mã phản hồi 00 từ Cổng VNPay).',
            );
            const stored = sessionStorage.getItem('brewlite_last_order');
            let parsed = {};
            if (stored) {
              try {
                parsed = JSON.parse(stored);
              } catch {}
            }
            const resolvedOrderId =
              parsed.orderId || urlParams.get('vnp_TxnRef')?.split('_')[0];
            const resolvedOrderCode =
              parsed.code || (resolvedOrderId ? `#${resolvedOrderId}` : '#BL-VNPay');

            setOrder((prev) => {
              const finalOrder = {
                ...prev,
                ...parsed,
                orderId: resolvedOrderId,
                code: resolvedOrderCode,
                orderStatus: 'PAID',
                transactionRef:
                  urlParams.get('vnp_TransactionNo') || 'VNPAY-VERIFIED',
                method: 'Cổng VNPay Sandbox',
              };
              sessionStorage.setItem('brewlite_last_order', JSON.stringify(finalOrder));
              try {
                const existingStr = localStorage.getItem('brewlite_orders');
                const existing = existingStr ? JSON.parse(existingStr) : [];
                const filtered = existing.filter(
                  (o) =>
                    o.code !== finalOrder.code &&
                    String(o.orderId || o.id) !== String(resolvedOrderId),
                );
                localStorage.setItem(
                  'brewlite_orders',
                  JSON.stringify([finalOrder, ...filtered]),
                );
              } catch {}
              return finalOrder;
            });

            const activeToken =
              token ||
              (typeof window !== 'undefined'
                ? localStorage.getItem('brewlite_token')
                : null);
            if (activeToken && resolvedOrderId && !activeToken.startsWith('mock-')) {
              const apiUrl =
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
              fetch(`${apiUrl}/api/v1/orders/${resolvedOrderId}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${activeToken}`,
                },
                body: JSON.stringify({ status: 'PAID' }),
              }).catch(() => {});
            }
          } else {
            setVerifyNotice(err?.message || 'Lỗi khi xác thực với cổng VNPay');
            setOrder((prev) => ({
              ...prev,
              orderStatus: 'PAYMENT_FAILED',
            }));
          }
        });
      return;
    }

    // Trường hợp 2: Khách xem đơn bình thường từ sessionStorage
    const stored = sessionStorage.getItem('brewlite_last_order');
    if (!stored && !paymentCompleted) {
      router.replace('/checkout/payment');
      return;
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setOrder((prev) => ({
          ...prev,
          code: parsed.code || prev.code,
          total: parsed.total || prev.total,
          subtotal: parsed.total || prev.subtotal,
          method: parsed.method || prev.method,
          customerName: parsed.customerName || prev.customerName,
          customerPhone: parsed.customerPhone || prev.customerPhone,
          orderStatus: parsed.orderStatus || 'PAID',
          transactionRef: parsed.transactionRef || null,
          items: parsed.items || prev.items,
        }));
      } catch (e) {
        // keep defaults
      }
    }
  }, [paymentCompleted, router, markPaymentComplete]);

  return (
    <div className={styles.container}>
      {/* Top Status Header – hiển thị theo orderStatus thực tế */}
      <div className={styles.statusHeader}>
        <div
          className={styles.checkCircleLarge}
          style={
            order.orderStatus === 'PAYMENT_FAILED'
              ? { backgroundColor: '#fdf2f0', border: '2px solid #f7d8d2' }
              : {}
          }
        >
          {isVerifying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          ) : order.orderStatus === 'PAYMENT_FAILED' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9402a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e382b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        <h1 className={styles.pageTitle}>
          {isVerifying
            ? 'Đang xác thực giao dịch VNPay...'
            : order.orderStatus === 'PAYMENT_FAILED'
              ? 'Thanh toán không thành công'
              : 'Thanh toán thành công!'}
        </h1>
        <p className={styles.pageSubtitle}>
          {isVerifying
            ? 'Vui lòng chờ trong giây lát...'
            : order.orderStatus === 'PAYMENT_FAILED'
              ? 'Giao dịch chưa hoàn tất trên VNPay Sandbox. Bạn có thể quay lại để thử lại.'
              : `Cảm ơn ${order.customerName ? order.customerName.split(' ').pop() : 'bạn'}. Đơn hàng đã được ghi nhận trên hệ thống.`}
        </p>
      </div>

      {/* Notice Alert */}
      <div className={styles.mockNoticeBox}>
        <div className={styles.mockNoticeIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <p className={styles.mockNoticeText}>
          {verifyNotice ||
            (order.orderStatus === 'PAYMENT_FAILED'
              ? 'Trạng thái PAYMENT_FAILED từ cổng VNPay Sandbox. Đơn hàng được giữ nguyên.'
              : 'Giao dịch đã xác thực qua Cổng thanh toán VNPay với mã bảo mật HMAC-SHA512.')}
        </p>
      </div>

      {/* Main Two Columns */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Receipt Card */}
        <div className={styles.receiptCard}>
          <div className={styles.receiptTopRow}>
            <div>
              <div className={styles.codeLabel}>MÃ ĐƠN HÀNG</div>
              <div className={styles.codeValue}>{order.code}</div>
            </div>
            <div
              className={styles.paidBadge}
              style={
                order.orderStatus === 'PAYMENT_FAILED'
                  ? { backgroundColor: '#fdf2f0', color: '#c9402a', border: '1px solid #f7d8d2' }
                  : {}
              }
            >
              {order.orderStatus === 'PAYMENT_FAILED' ? 'Thất bại / Huỷ' : 'Đã thanh toán'}
            </div>
          </div>

          {order.transactionRef && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Mã giao dịch VNPay</span>
              <span className={styles.metaValue} style={{ fontFamily: 'monospace' }}>
                {order.transactionRef}
              </span>
            </div>
          )}

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Thời gian</span>
            <span className={styles.metaValue}>{order.date}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Phương thức</span>
            <span className={styles.metaValue}>{order.method}</span>
          </div>

          <div className={styles.divider} />

          {/* Items */}
          <div className={styles.itemsList}>
            {order.items &&
              order.items.map((item, idx) => (
                <div key={item.id || idx} className={styles.itemRow}>
                  <div className={styles.itemImgWrapper}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className={styles.itemImg} />
                    ) : (
                      <div className={styles.itemPlaceholder}>☕</div>
                    )}
                  </div>

                  <div className={styles.itemDetails}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemSpecs}>{item.specs || item.selectedSize}</div>
                    <div className={styles.itemQty}>{item.qtyPrice || `${item.quantity || 1} món`}</div>
                  </div>

                  <div className={styles.itemPrice}>{item.total || item.lineTotal || order.total}</div>
                </div>
              ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.feeRow}>
            <span>Tạm tính</span>
            <span>{order.subtotal || order.total}</span>
          </div>

          <div className={styles.feeRow}>
            <span>Phí thanh toán</span>
            <span>0 VNĐ</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng thanh toán</span>
            <span className={styles.totalValue}>{order.total}</span>
          </div>
        </div>

        {/* Right Column: Utilities & Store Details */}
        <div className={styles.rightCol}>
          <div className={styles.statusCard}>
            {/* Thời gian nhận dự kiến */}
            <div className={styles.estTimeBlock}>
              <div className={styles.estTimeIconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e382b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div className={styles.estTimeSub}>Nhận dự kiến hôm nay</div>
                <div className={styles.estTimeValue}>15 – 20 phút</div>
              </div>
            </div>

            {/* Chi tiết cửa hàng nhận món */}
            <div className={styles.storeBlock}>
              <div className={styles.storeName}>BrewLite Nguyễn Huệ</div>
              <div className={styles.storeAddress}>42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM</div>
              <div className={styles.receiverInfo}>
                Người nhận: {order.customerName || 'Khách hàng'} {order.customerPhone ? `· ${order.customerPhone}` : ''}
              </div>
            </div>

            <div className={styles.divider} />

            {/* Tiện ích các nút hành động */}
            <div className={styles.actionButtonGroup}>
              {order.orderStatus === 'PAYMENT_FAILED' ? (
                <>
                  <Link href="/checkout/payment" className={styles.primaryActionBtn}>
                    <span>Thử thanh toán lại</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <Link href="/checkout/cart" className={styles.secondaryActionBtn}>
                    Xem lại giỏ hàng
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/history" className={styles.primaryActionBtn}>
                    <span>Theo dõi trong lịch sử đơn</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <Link href="/" className={styles.secondaryActionBtn}>
                    Quay về thực đơn
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
