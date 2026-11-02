'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './CartView.module.css';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';

export default function CartView() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems, itemCount, totalAmount, updateQuantity, removeItem } = useCart();
  const { navigateToStep } = useCheckout();

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ';

  const handleContinue = () => {
    if (cartItems.length === 0) {
      alert('Giỏ hàng của bạn đang trống.');
      return;
    }
    if (!user) {
      router.push('/checkout/account');
    } else {
      navigateToStep('payment');
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerTitleGroup}>
        <div className={styles.sectionBadge}>03 / GIỎ HÀNG</div>
        <h1 className={styles.pageTitle}>Một giỏ đầy cảm hứng.</h1>
        <p className={styles.pageSubtitle}>
          {itemCount > 0
            ? `${itemCount} món đã chọn. Kiểm tra lại đồ uống trước khi tiếp tục.`
            : 'Giỏ hàng của bạn đang trống.'}
        </p>
      </div>

      <div className={styles.layoutGrid}>
        {/* Left Column: Items List */}
        <div className={styles.leftCol}>
          <div className={styles.itemList}>
            {cartItems.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>Giỏ hàng đang trống.</p>
                <Link href="/" className={styles.backBtn}>
                  ← Quay lại thực đơn
                </Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className={styles.itemCard}>
                  {/* Thumbnail */}
                  <div className={styles.itemImageWrapper}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className={styles.itemImage}
                      />
                    ) : (
                      <div className={styles.itemPlaceholder}>☕</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <div className={styles.itemOptionLine}>
                      Size {item.size} · {item.options || item.note || 'Mặc định'}
                    </div>
                    {item.topping && (
                      <div className={styles.itemToppingLine}>
                        {item.topping.startsWith('Topping:') || item.topping.startsWith('Không')
                          ? item.topping
                          : `Topping: ${item.topping}`}
                      </div>
                    )}
                    <div className={styles.unitPriceLine}>
                      {formatPrice(item.unitPrice || item.price)} / ly
                    </div>
                    <button
                      type="button"
                      className={styles.editOptionsLink}
                      onClick={() => alert(`Chỉnh sửa tùy chọn cho ${item.name}`)}
                    >
                      Chỉnh sửa tùy chọn
                    </button>
                  </div>

                  {/* Right side controls & price */}
                  <div className={styles.itemControls}>
                    <div className={styles.itemTotal}>
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <div className={styles.qtyBox}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, -1)}
                        title="Giảm số lượng"
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span className={styles.qtyNum}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, 1)}
                        title="Tăng số lượng"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => removeItem(item.id)}
                      title="Xóa món"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Info Alert Callout */}
          <div className={styles.alertNotice}>
            <div className={styles.alertIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <p className={styles.alertText}>
              Đồ uống được pha sau khi thanh toán được xác minh. Thời gian nhận dự kiến: 15–20 phút.
            </p>
          </div>

          {/* Continue Shopping Button */}
          <Link href="/" className={styles.continueShoppingBtn}>
            ← Tiếp tục chọn món
          </Link>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Tóm tắt giỏ hàng</h2>

          <div className={styles.pickupBadgeGroup}>
            <span className={styles.pickupBadge}>Nhận tại quầy</span>
          </div>

          <div className={styles.storeBlock}>
            <div className={styles.storeName}>BrewLite Nguyễn Huệ</div>
            <div className={styles.storeAddress}>
              42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM
            </div>
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

          <button
            type="button"
            onClick={handleContinue}
            disabled={cartItems.length === 0}
            className={styles.checkoutBtn}
          >
            <span>Tiếp tục thanh toán</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <p className={styles.authNotice}>
            Bạn sẽ đăng nhập hoặc tạo tài khoản để lưu đơn và theo dõi lịch sử.
          </p>
        </div>
      </div>
    </div>
  );
}
