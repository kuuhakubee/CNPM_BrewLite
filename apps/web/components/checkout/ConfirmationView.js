'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './ConfirmationView.module.css';
import { useCheckout } from '../../context/CheckoutContext';

export default function ConfirmationView() {
  const router = useRouter();
  const { paymentCompleted } = useCheckout();

  const [order, setOrder] = useState({
    code: '#BL-1027',
    total: '175.000 VNĐ',
    subtotal: '175.000 VNĐ',
    method: 'Ví MoMo · Sandbox',
    date: '27/10/2026 · 09:41',
    customerName: 'Nguyễn Minh Anh',
    customerPhone: '0901 234 567',
    items: [
      {
        id: 1,
        name: 'Latte yến mạch',
        specs: 'M · 50% đường · Ít đá · Sữa yến mạch',
        qtyPrice: '2 × 65.000 VNĐ',
        total: '130.000 VNĐ',
        image: '/images/latte-yen-mach.png',
      },
      {
        id: 2,
        name: 'Cold Brew nguyên bản',
        specs: 'M · Không đường · Đá thường · Không topping',
        qtyPrice: '1 × 45.000 VNĐ',
        total: '45.000 VNĐ',
        image: '/images/cold-brew.png',
      },
    ],
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
          }));
        } catch (e) {
          // keep defaults
        }
      }
    }
  }, [paymentCompleted, router]);

  return (
    <div className={styles.container}>
      {/* Top Status Header */}
      <div className={styles.statusHeader}>
        <div className={styles.checkCircleLarge}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e382b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className={styles.sectionBadge}>07 / XÁC NHẬN · TRẠNG THÁI MẪU</div>
        <h1 className={styles.pageTitle}>Thanh toán thành công!</h1>
        <p className={styles.pageSubtitle}>
          Cảm ơn {order.customerName.split(' ').pop() || 'bạn'}. Đơn mẫu của bạn đã được ghi nhận.
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
          Đây là trạng thái thành công minh họa trong thiết kế, không phải xác nhận một giao dịch thật.
        </p>
      </div>

      {/* Main Two Columns */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Receipt Card */}
        <div className={styles.receiptCard}>
          <div className={styles.receiptTopRow}>
            <div>
              <div className={styles.codeLabel}>MÃ ĐƠN MẪU</div>
              <div className={styles.codeValue}>{order.code}</div>
            </div>
            <div className={styles.paidBadge}>Đã thanh toán</div>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Tạo lúc</span>
            <span className={styles.metaValue}>{order.date}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Phương thức</span>
            <span className={styles.metaValue}>{order.method}</span>
          </div>

          <div className={styles.divider} />

          {/* Items */}
          <div className={styles.itemsList}>
            {order.items.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemImgWrapper}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className={styles.itemImg} />
                  ) : (
                    <div className={styles.itemPlaceholder}>☕</div>
                  )}
                </div>

                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemSpecs}>{item.specs}</div>
                  <div className={styles.itemQty}>{item.qtyPrice}</div>
                </div>

                <div className={styles.itemPrice}>{item.total}</div>
              </div>
            ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.feeRow}>
            <span>Tạm tính</span>
            <span>{order.subtotal}</span>
          </div>

          <div className={styles.feeRow}>
            <span>Phí nhận tại quầy & thanh toán</span>
            <span>0 VNĐ</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng đã thanh toán mẫu</span>
            <span className={styles.totalValue}>{order.total}</span>
          </div>
        </div>

        {/* Right Column: Status Timeline & Pickup Details */}
        <div className={styles.rightCol}>
          <div className={styles.statusCard}>
            <div className={styles.statusCardHeader}>
              <h2 className={styles.statusTitle}>Đồ uống đang ở bước nào?</h2>
              <div className={styles.stepBadge}>Đã nhận đơn · Chưa pha chế</div>
            </div>

            <p className={styles.statusDescription}>
              Thanh toán đã xác nhận không có nghĩa là đồ uống đã sẵn sàng. Theo dõi trạng thái trong lịch sử đơn.
            </p>

            <div className={styles.divider} />

            {/* Step timeline list */}
            <div className={styles.timelineList}>
              {/* Step 1: Active check */}
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineCircle} ${styles.timelineCircleActive}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className={`${styles.timelineText} ${styles.timelineTextActive}`}>
                  Đã nhận đơn
                </div>
              </div>

              {/* Step 2 */}
              <div className={styles.timelineItem}>
                <div className={styles.timelineCircle}>2</div>
                <div className={styles.timelineText}>Đang pha chế</div>
              </div>

              {/* Step 3 */}
              <div className={styles.timelineItem}>
                <div className={styles.timelineCircle}>3</div>
                <div className={styles.timelineText}>Sẵn sàng nhận</div>
              </div>

              {/* Step 4 */}
              <div className={styles.timelineItem}>
                <div className={styles.timelineCircle}>4</div>
                <div className={styles.timelineText}>Hoàn tất</div>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Estimated time */}
            <div className={styles.estTimeBlock}>
              <div className={styles.estTimeIconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div className={styles.estTimeSub}>NHẬN DỰ KIẾN HÔM NAY</div>
                <div className={styles.estTimeValue}>09:56 – 10:01</div>
              </div>
            </div>

            {/* Store & Customer Info */}
            <div className={styles.storeBlock}>
              <div className={styles.storeName}>BrewLite Nguyễn Huệ</div>
              <div className={styles.storeAddress}>
                42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM
              </div>
              <div className={styles.receiverInfo}>
                Người nhận: {order.customerName} · {order.customerPhone}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtonGroup}>
            <Link href="/#history" className={styles.primaryActionBtn}>
              <span>Theo dõi trong lịch sử đơn</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <Link href="/" className={styles.secondaryActionBtn}>
              Quay về thực đơn
            </Link>
          </div>

          <div className={styles.counterNote}>
            Khi nhận đồ uống, vui lòng đọc mã {order.code} cho nhân viên tại quầy.
          </div>
        </div>
      </div>
    </div>
  );
}
