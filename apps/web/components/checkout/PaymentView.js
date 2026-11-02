'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './PaymentView.module.css';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';

export default function PaymentView() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { cartItems, itemCount, totalAmount, clearCart } = useCart();
  const { markPaymentComplete, isCartCompleted, isAccountCompleted } =
    useCheckout();

  useEffect(() => {
    if (!isCartCompleted) {
      alert('Giỏ hàng của bạn đang trống. Vui lòng chọn món trước.');
      router.push('/checkout/cart');
      return;
    }
    if (!isAccountCompleted) {
      alert('Vui lòng đăng nhập hoặc tạo tài khoản trước khi thanh toán.');
      router.push('/checkout/account');
      return;
    }
  }, [isCartCompleted, isAccountCompleted, router]);

  // Form states — lấy từ tài khoản đăng nhập nếu có, không thì để trống
  const [fullName, setFullName] = useState(user?.name || user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name || user.fullName || '');
      if (!phone && user.phone) setPhone(user.phone);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  const [store, setStore] = useState('BrewLite Nguyễn Huệ · Quận 1');
  const [note, setNote] = useState('');
  /**
   * paymentMethod: 'WALLET' (Ví điện tử) | 'CARD' (Thẻ ngân hàng)
   * Khớp với enum PaymentMethod trong Prisma schema và CreatePaymentDto.
   */
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFailedNotice, setShowFailedNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatPrice = (val) =>
    new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ';

  const handlePay = async () => {
    // Validation cơ bản
    if (!fullName.trim()) {
      alert('Vui lòng nhập họ và tên.');
      return;
    }
    if (!phone.trim()) {
      alert('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!email.trim()) {
      alert('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsSubmitting(true);
    setShowFailedNotice(false);
    setErrorMessage('');

    try {
      // ── Bước 1: Tạo đơn hàng (POST /orders) ────────────────────────────────
      let orderId;

      // Nếu đã login và có token thật → dùng API thật
      // Nếu token là mock (prefix 'mock-jwt') → dùng mock order ID
      const isRealToken =
        token && !token.startsWith('mock-jwt-token-');

      if (isRealToken) {
        const orderResult = await orderService.createOrder(
          {
            subtotal: totalAmount,
            total: totalAmount,
            discount: 0,
          },
          token,
        );
        orderId = orderResult.order?.id;
        if (!orderId) throw new Error('Không thể tạo đơn hàng.');
      } else {
        // Chế độ mock: dùng orderId cố định (không kết nối DB)
        orderId = null;
      }

      // ── Bước 2: Thanh toán (POST /payments) ─────────────────────────────────
      const idempotencyKey = paymentService.getOrCreateIdempotencyKey();

      let orderStatus = 'PAID';
      let transactionRef = null;

      if (isRealToken && orderId) {
        const payResult = await paymentService.pay(
          {
            orderId,
            amount: totalAmount,
            method: paymentMethod,
            idempotencyKey,
          },
          token,
        );
        orderStatus = payResult.orderStatus;
        transactionRef = payResult.payment?.transactionRef;
      } else {
        // Mock mode: simulate 90% success
        const mockSuccess = Math.random() < 0.9;
        orderStatus = mockSuccess ? 'PAID' : 'PAYMENT_FAILED';
        transactionRef = mockSuccess
          ? `MOCK-TXN-${Date.now()}-${idempotencyKey.slice(0, 8)}`
          : null;
      }

      // ── Bước 3: Xử lý kết quả ────────────────────────────────────────────────
      if (orderStatus === 'PAYMENT_FAILED') {
        // Đơn chuyển PAYMENT_FAILED – giữ giỏ hàng, hiện thông báo lỗi
        paymentService.resetPaymentKey();
        setShowFailedNotice(true);
        setErrorMessage(
          'Giao dịch bị từ chối bởi cổng thanh toán. Giỏ hàng được giữ nguyên. Bạn có thể thử lại.',
        );
        setIsSubmitting(false);
        return;
      }

      // PAID – lưu thông tin đơn, xóa key, điều hướng
      paymentService.resetPaymentKey();
      markPaymentComplete();

      if (typeof window !== 'undefined') {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const orderCode =
          orderId ? `#${orderId}` : '#BL-' + Math.floor(1000 + Math.random() * 9000);

        const orderInfo = {
          code: orderCode,
          total: formatPrice(totalAmount),
          itemCount,
          items: cartItems,
          method: paymentMethod === 'WALLET' ? 'Ví điện tử · Sandbox' : 'Thẻ ngân hàng · Sandbox',
          date: dateStr,
          customerName: fullName,
          customerPhone: phone,
          transactionRef,
          orderStatus,
        };
        sessionStorage.setItem('brewlite_last_order', JSON.stringify(orderInfo));
      }

      clearCart();
      router.push('/checkout/confirmation');
    } catch (err) {
      // Lỗi network hoặc server error
      setShowFailedNotice(true);
      setErrorMessage(
        err?.message || 'Đã xảy ra lỗi kết nối. Vui lòng thử lại.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerTitleGroup}>
        <h1 className={styles.pageTitle}>Sắp đến giờ cà phê.</h1>
        <p className={styles.pageSubtitle}>
          Nhận tại quầy, thanh toán không tiền mặt. Kiểm tra thông tin lần cuối nhé.
        </p>
      </div>

      <div className={styles.layoutGrid}>
        {/* Left Column: Forms */}
        <div className={styles.leftCol}>
          {/* Card 1: Receiver Info */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeaderTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Thông tin nhận đơn</span>
            </div>

            <div className={styles.twoColRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Họ và tên *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Số điện thoại *</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email nhận thông tin đơn *</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email"
              />
            </div>
          </div>

          {/* Card 2: Pickup Store */}
          <div className={styles.sectionCard}>
            <div className={styles.storeHeaderRow}>
              <div className={styles.cardHeaderTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Nhận tại cửa hàng</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Chọn cửa hàng *</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.select}
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                >
                  <option value="BrewLite Nguyễn Huệ · Quận 1">
                    BrewLite Nguyễn Huệ · Quận 1
                  </option>
                  <option value="BrewLite Thảo Điền · TP.Thủ Đức">
                    BrewLite Thảo Điền · TP.Thủ Đức
                  </option>
                </select>
                <div className={styles.selectArrow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            <div className={styles.storeAddressLine}>
              42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM · Mở cửa 07:00–22:00
            </div>

            <div className={styles.pickupTimeBox}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Dự kiến sau 15–20 phút kể từ khi thanh toán được xác minh.</span>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '16px' }}>
              <label className={styles.label}>Ghi chú cho cửa hàng · Không bắt buộc</label>
              <input
                type="text"
                className={styles.input}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Cho mình ống hút giấy nhé"
              />
            </div>
          </div>

          {/* Card 3: Cashless Payment Methods */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeaderTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span>Thanh toán không tiền mặt</span>
            </div>

            <div className={styles.paymentMethodsGrid}>
              {/* Option 1: E-Wallet */}
              <div
                className={`${styles.paymentRadioCard} ${paymentMethod === 'WALLET' ? styles.paymentCardActive : ''}`}
                onClick={() => setPaymentMethod('WALLET')}
              >
                <div className={styles.methodLeft}>
                  <div className={styles.methodIconBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <div className={styles.methodName}>Ví điện tử</div>
                    <div className={styles.methodDesc}>MoMo · Môi trường thử nghiệm</div>
                  </div>
                </div>

                <div className={`${styles.radioIndicator} ${paymentMethod === 'WALLET' ? styles.radioIndicatorActive : ''}`}>
                  {paymentMethod === 'WALLET' && <div className={styles.radioDot} />}
                </div>
              </div>

              {/* Option 2: Bank Card */}
              <div
                className={`${styles.paymentRadioCard} ${paymentMethod === 'CARD' ? styles.paymentCardActive : ''}`}
                onClick={() => setPaymentMethod('CARD')}
              >
                <div className={styles.methodLeft}>
                  <div className={styles.methodIconBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <div className={styles.methodName}>Thẻ ngân hàng</div>
                    <div className={styles.methodDesc}>Qua trang bảo mật của đối tác</div>
                  </div>
                </div>

                <div className={`${styles.radioIndicator} ${paymentMethod === 'CARD' ? styles.radioIndicatorActive : ''}`}>
                  {paymentMethod === 'CARD' && <div className={styles.radioDot} />}
                </div>
              </div>
            </div>

            <div className={styles.paymentFootnote}>
              Bản mẫu dùng sandbox của nhà cung cấp. BrewLite không lưu số thẻ hay CVV.
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary with retry notice */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryTopRow}>
            <h2 className={styles.summaryTitle}>Đơn của bạn</h2>
            <Link href="/checkout/cart" className={styles.editCartLink}>
              Sửa giỏ
            </Link>
          </div>

          {/* Items mini list */}
          <div className={styles.summaryItemList}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.summaryItemRow}>
                <div className={styles.summaryItemImgWrapper}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className={styles.summaryItemImg} />
                  ) : (
                    <div className={styles.summaryItemPlaceholder}>☕</div>
                  )}
                </div>

                <div className={styles.summaryItemDetail}>
                  <div className={styles.summaryItemName}>{item.name}</div>
                  <div className={styles.summaryItemSpecs}>
                    {item.size || 'M'} · {item.options || item.note || ''} · {item.topping || 'Không topping'}
                  </div>
                  <div className={styles.summaryItemQty}>
                    {item.quantity} × {formatPrice(item.unitPrice || item.price)}
                  </div>
                </div>

                <div className={styles.summaryItemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.feeRow}>
            <span>Tạm tính · {itemCount} món</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>

          <div className={styles.feeRow}>
            <span>Phí nhận tại quầy</span>
            <span>0 VNĐ</span>
          </div>

          <div className={styles.feeRow}>
            <span>Phí thanh toán</span>
            <span>0 VNĐ</span>
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng thanh toán</span>
            <span className={styles.totalValue}>{formatPrice(totalAmount)}</span>
          </div>

          <div className={styles.vatNote}>
            Giá đã gồm VAT. Không có phí giao hàng.
          </div>

          {/* Payment failed notice */}
          {showFailedNotice && (
            <div className={styles.retryAlertBox}>
              <div className={styles.retryIconWrapper}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className={styles.retryText}>
                {errorMessage ||
                  'Thanh toán thất bại. Đơn hàng chuyển sang trạng thái PAYMENT_FAILED. Giỏ hàng được giữ nguyên — bạn có thể thử lại.'}
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={isSubmitting}
            className={styles.payBtn}
          >
            <span>
              {isSubmitting
                ? 'Đang kết nối sandbox...'
                : `Xác nhận thanh toán · ${formatPrice(totalAmount)}`}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <p className={styles.partnerNotice}>
            Bạn sẽ chuyển đến trang thử nghiệm của đối tác. Chỉ xác nhận thanh toán sau khi máy chủ xác minh kết quả.
          </p>

          <div className={styles.securityBadge}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <span>Không nhận tiền mặt · Không thu tiền trong bản thiết kế</span>
          </div>
        </div>
      </div>
    </div>
  );
}
