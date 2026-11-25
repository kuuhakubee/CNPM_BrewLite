'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  const { token, user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');
  const processedRef = useRef(false);

  const [order, setOrder] = useState({
    code: '#BL-1027',
    total: '175.000 VNĐ',
    subtotal: '175.000 VNĐ',
    method: 'Cổng VNPay Sandbox',
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
    if (processedRef.current) return;

    const searchParams = window.location.search;
    const isVnpayReturn = searchParams.includes('vnp_ResponseCode');

    // Trường hợp 1: Người dùng vừa được redirect từ Cổng VNPay Sandbox
    if (isVnpayReturn) {
      processedRef.current = true;
      setIsVerifying(true);
      setVerifyNotice('Đang đồng bộ và xác thực dữ liệu giao dịch từ Cổng VNPay...');

      const urlParams = new URLSearchParams(searchParams);
      const vnpResponseCode = urlParams.get('vnp_ResponseCode');
      const isVnpayCodeSuccess = vnpResponseCode === '00';

      // 1. Trích xuất trực tiếp số tiền từ VNPay (vnp_Amount đơn vị x100)
      const vnpAmount = urlParams.get('vnp_Amount');
      const rawVnpAmount = vnpAmount ? Number(vnpAmount) / 100 : null;
      const formattedVnpAmount = rawVnpAmount
        ? new Intl.NumberFormat('vi-VN').format(rawVnpAmount) + ' VNĐ'
        : null;

      // 2. Trích xuất ngày thanh toán từ VNPay (định dạng YYYYMMDDHHmmss)
      const vnpPayDate = urlParams.get('vnp_PayDate');
      let formattedPayDate = null;
      if (vnpPayDate && vnpPayDate.length === 14) {
        const y = vnpPayDate.slice(0, 4);
        const m = vnpPayDate.slice(4, 6);
        const d = vnpPayDate.slice(6, 8);
        const hh = vnpPayDate.slice(8, 10);
        const mm = vnpPayDate.slice(10, 12);
        formattedPayDate = `${d}/${m}/${y} · ${hh}:${mm}`;
      } else {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        formattedPayDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      }

      // 3. Trích xuất ngân hàng / loại thẻ
      const vnpBankCode = urlParams.get('vnp_BankCode');
      const vnpCardType = urlParams.get('vnp_CardType');
      const formattedMethod = vnpBankCode
        ? `Cổng VNPay Sandbox (${vnpBankCode}${vnpCardType ? ` - ${vnpCardType}` : ''})`
        : 'Cổng VNPay Sandbox';

      const vnpTransactionNo = urlParams.get('vnp_TransactionNo');
      const vnpTxnRef = urlParams.get('vnp_TxnRef');
      const parsedOrderIdFromTxn = vnpTxnRef ? vnpTxnRef.split('_')[0] : null;

      // 4. Đọc thông tin đơn hàng đã lưu trước khi sang VNPay (ưu tiên localStorage)
      let parsed = {};
      try {
        const stored =
          localStorage.getItem('brewlite_last_order') ||
          sessionStorage.getItem('brewlite_last_order');
        if (stored) {
          parsed = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Lỗi đọc brewlite_last_order:', e);
      }

      const resolvedOrderId = parsed.orderId || parsedOrderIdFromTxn || 'VNPay';
      const resolvedOrderCode =
        parsed.code || (resolvedOrderId ? `#BL-${resolvedOrderId}` : '#BL-VNPay');
      const resolvedCustomerName =
        parsed.customerName || user?.name || user?.fullName || 'Khách hàng BrewLite';
      const resolvedCustomerPhone =
        parsed.customerPhone || user?.phone || '0901 234 567';

      // 5. CẬP NHẬT NGAY LẬP TỨC dữ liệu đơn hàng vào state (không đợi backend)
      if (isVnpayCodeSuccess) {
        markPaymentComplete();
        clearCart();

        const successOrder = {
          code: resolvedOrderCode,
          orderId: resolvedOrderId,
          total: formattedVnpAmount || parsed.total || '175.000 VNĐ',
          subtotal: formattedVnpAmount || parsed.subtotal || parsed.total || '175.000 VNĐ',
          date: formattedPayDate || parsed.date,
          method: formattedMethod,
          orderStatus: 'PAID',
          transactionRef: vnpTransactionNo || 'VNPAY-VERIFIED',
          customerName: resolvedCustomerName,
          customerPhone: resolvedCustomerPhone,
          items:
            parsed.items && parsed.items.length > 0
              ? parsed.items
              : [
                  {
                    id: 1,
                    name: 'Đơn hàng cà phê BrewLite',
                    specs: `Thanh toán qua ${vnpBankCode || 'VNPay Sandbox'} · Mã GD: ${vnpTransactionNo || 'TC'}`,
                    qtyPrice: `1 × ${formattedVnpAmount || 'Đã thanh toán'}`,
                    total: formattedVnpAmount || 'Đã thanh toán',
                    image: '/images/latte-yen-mach.png',
                  },
                ],
        };

        setOrder(successOrder);
        setVerifyNotice(
          `Giao dịch thanh toán ${formattedVnpAmount || ''} qua VNPay Sandbox đã hoàn tất thành công (Mã GD: ${vnpTransactionNo || 'VNPAY'}).`,
        );

        // Lưu đồng bộ vào cả sessionStorage và localStorage cho trang Lịch sử đơn
        try {
          sessionStorage.setItem('brewlite_last_order', JSON.stringify(successOrder));
          localStorage.setItem('brewlite_last_order', JSON.stringify(successOrder));

          const existingStr = localStorage.getItem('brewlite_orders');
          const existing = existingStr ? JSON.parse(existingStr) : [];
          const filtered = existing.filter(
            (o) =>
              o.code !== successOrder.code &&
              String(o.orderId || o.id) !== String(resolvedOrderId),
          );
          localStorage.setItem(
            'brewlite_orders',
            JSON.stringify([successOrder, ...filtered]),
          );
        } catch (storageErr) {
          console.warn('Lỗi lưu đơn hàng vào storage:', storageErr);
        }
      } else {
        setVerifyNotice(
          `Giao dịch chưa hoàn tất hoặc bị huỷ trên Cổng VNPay Sandbox (Mã lỗi: ${vnpResponseCode}). Giỏ hàng của bạn được giữ nguyên.`,
        );
        const failedOrder = {
          code: resolvedOrderCode,
          orderId: resolvedOrderId,
          total: formattedVnpAmount || parsed.total || '0 VNĐ',
          subtotal: formattedVnpAmount || parsed.subtotal || parsed.total || '0 VNĐ',
          date: formattedPayDate || parsed.date,
          method: formattedMethod,
          orderStatus: 'PAYMENT_FAILED',
          transactionRef: vnpTransactionNo || 'VNPAY-CANCELLED',
          customerName: resolvedCustomerName,
          customerPhone: resolvedCustomerPhone,
          items: parsed.items || [],
        };
        setOrder(failedOrder);
        if (parsed.items && parsed.items.length > 0) {
          restoreCart(parsed.items);
        }
      }

      // 6. Gửi xác thực bổ sung tới Backend để đồng bộ Database PostgreSQL
      paymentService
        .verifyVnpayReturn(searchParams)
        .then((result) => {
          setIsVerifying(false);
          if (result && (result.success || result.orderStatus === 'PAID')) {
            if (result.orderCode) {
              setOrder((prev) => ({ ...prev, code: result.orderCode }));
            }
          }
        })
        .catch(() => {
          setIsVerifying(false);
        })
        .finally(() => {
          setIsVerifying(false);
          // Đồng bộ trạng thái PAID lên backend nếu có token đăng nhập
          const activeToken =
            token ||
            (typeof window !== 'undefined'
              ? localStorage.getItem('brewlite_token')
              : null);
          if (
            isVnpayCodeSuccess &&
            activeToken &&
            resolvedOrderId &&
            !isNaN(Number(resolvedOrderId)) &&
            !activeToken.startsWith('mock-')
          ) {
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
        });

      return;
    }

    // Trường hợp 2: Khách xem đơn bình thường từ storage (không có query params VNPay)
    const stored =
      localStorage.getItem('brewlite_last_order') ||
      sessionStorage.getItem('brewlite_last_order');

    if (!stored && !paymentCompleted) {
      router.replace('/checkout/payment');
      return;
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setOrder({
          code: parsed.code || '#BL-1027',
          total: parsed.total || '175.000 VNĐ',
          subtotal: parsed.subtotal || parsed.total || '175.000 VNĐ',
          method: parsed.method || 'Cổng VNPay Sandbox',
          customerName: parsed.customerName || 'Khách hàng BrewLite',
          customerPhone: parsed.customerPhone || '0901 234 567',
          date: parsed.date || '27/10/2026 · 09:41',
          orderStatus: parsed.orderStatus || 'PAID',
          transactionRef: parsed.transactionRef || null,
          items:
            parsed.items && parsed.items.length > 0
              ? parsed.items
              : [
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
      } catch (e) {
        // keep defaults
      }
    }
  }, []);

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
                    <div className={styles.itemSpecs}>
                      {item.specs || (item.size ? `Size ${item.size}` : 'Size tiêu chuẩn')}
                    </div>
                    <div className={styles.itemQty}>
                      {item.qtyPrice ||
                        (item.price
                          ? `${item.quantity || 1} × ${new Intl.NumberFormat('vi-VN').format(item.price)} VNĐ`
                          : `${item.quantity || 1} món`)}
                    </div>
                  </div>

                  <div className={styles.itemPrice}>
                    {item.total ||
                      item.lineTotal ||
                      (item.price
                        ? new Intl.NumberFormat('vi-VN').format(
                            item.price * (item.quantity || 1),
                          ) + ' VNĐ'
                        : order.total)}
                  </div>
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
