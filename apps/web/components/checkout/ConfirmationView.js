'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './ConfirmationView.module.css';
import { useCheckout } from '../../context/CheckoutContext';
import { paymentService } from '../../services/paymentService';

export default function ConfirmationView() {
  const router = useRouter();
  const { paymentCompleted, markPaymentComplete } = useCheckout();
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

          if (result.success || result.orderStatus === 'PAID') {
            markPaymentComplete();
            setVerifyNotice('Xác thực chữ ký bảo mật HMAC-SHA512 từ VNPay thành công!');
            setOrder((prev) => ({
              ...prev,
              ...parsed,
              code: result.orderCode || `#${result.orderId}`,
              orderStatus: 'PAID',
              transactionRef: result.transactionRef || 'VNPAY-VERIFIED',
              method: 'Cổng VNPay Sandbox (Thẻ NCB Test)',
            }));
          } else {
            setVerifyNotice(
              result.message || 'Giao dịch bị từ chối hoặc bị huỷ trên VNPay Sandbox.',
            );
            setOrder((prev) => ({
              ...prev,
              ...parsed,
              code: result.orderCode || prev.code,
              orderStatus: 'PAYMENT_FAILED',
              method: 'Cổng VNPay Sandbox',
            }));
          }
        })
        .catch((err) => {
          setIsVerifying(false);
          setVerifyNotice(err?.message || 'Lỗi khi xác thực với cổng VNPay');
          setOrder((prev) => ({
            ...prev,
            orderStatus: 'PAYMENT_FAILED',
          }));
        });
      return;
    }

    // Trường hợp 2: Khách xem đơn bình thường từ sessionStorage
    const stored = sessionStorage.getItem('brewlite_last_order');
    if (!stored && !paymentCompleted) {
      alert('Vui lòng hoàn tất thanh toán trước khi xem xác nhận đơn.');
      router.push('/checkout/payment');
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
              : 'Giao dịch đã xác thực qua Cổng thanh toán VNPay Sandbox với mã bảo mật HMAC-SHA512. Backend đã cập nhật trạng thái đơn thành PAID.')}
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
              {order.orderStatus === 'PAYMENT_FAILED' ? 'Thất bại / Huỷ' : 'Đã thanh toán (PAID)'}
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
            <span>Phí thanh toán VNPay Sandbox</span>
            <span>0 VNĐ</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng thanh toán</span>
            <span className={styles.totalValue}>{order.total}</span>
          </div>
        </div>

        {/* Right Column: Status Timeline & Sandbox Info */}
        <div className={styles.rightCol}>
          <div className={styles.statusCard}>
            <div className={styles.statusCardHeader}>
              <h2 className={styles.statusTitle}>Thông tin thanh toán Sandbox</h2>
              <div className={styles.stepBadge}>
                {order.orderStatus === 'PAID' ? 'PAID · Đã xác thực' : 'PENDING / FAILED'}
              </div>
            </div>

            <p className={styles.statusDescription}>
              Đơn hàng được xác thực trực tiếp qua Cổng thử nghiệm VNPay (Test Sandbox) theo quy trình chuẩn Webhook/IPN.
            </p>

            <div className={styles.divider} />

            {/* Step timeline list */}
            <div className={styles.timelineList}>
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineCircle} ${styles.timelineCircleActive}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className={`${styles.timelineText} ${styles.timelineTextActive}`}>
                  Tạo đơn hàng (PENDING)
                </div>
              </div>

              <div className={styles.timelineItem}>
                <div className={`${styles.timelineCircle} ${styles.timelineCircleActive}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className={`${styles.timelineText} ${styles.timelineTextActive}`}>
                  Chuyển sang Cổng VNPay Sandbox
                </div>
              </div>

              <div className={styles.timelineItem}>
                <div className={`${styles.timelineCircle} ${order.orderStatus === 'PAID' ? styles.timelineCircleActive : ''}`}>
                  {order.orderStatus === 'PAID' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    '3'
                  )}
                </div>
                <div className={`${styles.timelineText} ${order.orderStatus === 'PAID' ? styles.timelineTextActive : ''}`}>
                  Nhập mã OTP Test NCB (123456)
                </div>
              </div>

              <div className={styles.timelineItem}>
                <div className={`${styles.timelineCircle} ${order.orderStatus === 'PAID' ? styles.timelineCircleActive : ''}`}>
                  {order.orderStatus === 'PAID' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    '4'
                  )}
                </div>
                <div className={`${styles.timelineText} ${order.orderStatus === 'PAID' ? styles.timelineTextActive : ''}`}>
                  Webhook / IPN xác nhận đổi sang PAID
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <Link
                href="/history"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#1e382b',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Xem lịch sử đơn
              </Link>
              <Link
                href="/"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  borderRadius: '8px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
