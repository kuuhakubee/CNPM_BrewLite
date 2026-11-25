'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';

// Color Palette consistent with BrewLite design system
const C = {
  bg: '#f7f5ef',
  primary: '#285446',
  primaryHover: '#1f4337',
  primaryLight: '#eaf4ee',
  primaryTag: '#e7f3ec',
  orangeTag: '#fdf0e2',
  orangeText: '#a76717',
  grayTag: '#edebe6',
  grayText: '#6e6b63',
  cancelTag: '#f5ede4',
  cancelText: '#99653a',
  text: '#302b24',
  textMuted: '#78766c',
  border: '#dedcd2',
  white: '#ffffff',
};

// ── Helpers: chuyển dữ liệu backend sang format hiển thị ──────────────────────

/**
 * Map OrderStatus (backend) → statusCategory cho filter tabs
 */
function mapStatusCategory(status) {
  switch (status) {
    case 'PENDING':
    case 'PAID':
    case 'PREPARING':
    case 'READY':
      return 'processing';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
    case 'PAYMENT_FAILED':
      return 'cancelled';
    default:
      return 'processing';
  }
}

/**
 * Map OrderStatus → badge thanh toán
 */
function mapPaymentStatus(status) {
  switch (status) {
    case 'PAID':
    case 'PREPARING':
    case 'READY':
    case 'COMPLETED':
      return { label: 'Đã thanh toán', bg: '#e7f3ec', color: '#285446' };
    case 'PAYMENT_FAILED':
      return { label: 'Thanh toán thất bại', bg: '#f5ede4', color: '#99653a' };
    case 'CANCELLED':
      return { label: 'Đã hủy', bg: '#edebe6', color: '#6e6b63' };
    case 'PENDING':
    default:
      return { label: 'Chờ thanh toán', bg: '#fdf0e2', color: '#a76717' };
  }
}

/**
 * Map OrderStatus → badge trạng thái đồ uống
 */
function mapDrinkStatus(status) {
  switch (status) {
    case 'PENDING':
      return { label: 'Chờ thanh toán', bg: '#fdf0e2', color: '#a76717' };
    case 'PAID':
      return { label: 'Đồ uống: Đã nhận đơn', bg: '#fdf0e2', color: '#a76717' };
    case 'PREPARING':
      return { label: 'Đồ uống: Đang pha chế', bg: '#fdf0e2', color: '#a76717' };
    case 'READY':
      return { label: 'Đồ uống: Sẵn sàng nhận', bg: '#e7f3ec', color: '#285446' };
    case 'COMPLETED':
      return { label: 'Đã nhận đồ uống', bg: '#eaf0e8', color: '#285446' };
    case 'PAYMENT_FAILED':
      return { label: 'Thanh toán thất bại', bg: '#f5ede4', color: '#99653a' };
    case 'CANCELLED':
      return { label: 'Đã hủy', bg: '#f5ede4', color: '#99653a' };
    default:
      return { label: status, bg: '#edebe6', color: '#6e6b63' };
  }
}

/**
 * Map OrderStatus → timeline step (1-4 cho progress bar)
 */
function mapTimelineStep(status) {
  switch (status) {
    case 'PAID':
      return 1;
    case 'PREPARING':
      return 2;
    case 'READY':
      return 3;
    case 'COMPLETED':
      return 4;
    default:
      return 0;
  }
}

/**
 * Map OrderStatus → info banner text
 */
function mapInfoBanner(status) {
  switch (status) {
    case 'PAID':
      return 'Đã thanh toán · Chưa pha chế.';
    case 'PREPARING':
      return 'Đang pha chế đồ uống của bạn. Vui lòng đợi trong giây lát.';
    case 'READY':
      return 'Đồ uống đã sẵn sàng! Vui lòng đến quầy để nhận.';
    case 'PENDING':
      return 'Đơn hàng đang chờ thanh toán. Vui lòng hoàn tất thanh toán để tiếp tục.';
    default:
      return null;
  }
}

/**
 * Format ngày giờ từ ISO string
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Lấy tháng/năm từ ISO string
 */
function getMonth(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Format giá tiền VNĐ
 */
function formatPrice(val) {
  return new Intl.NumberFormat('vi-VN').format(Number(val)) + ' VNĐ';
}

/**
 * Map payment method enum → hiển thị
 */
function mapPaymentMethod(payments) {
  if (!payments || payments.length === 0) return 'Chưa thanh toán';
  const last = payments[payments.length - 1];
  if (last.method === 'CARD') return 'Thẻ ngân hàng / VNPay';
  if (last.method === 'WALLET') return 'Ví điện tử';
  return last.method || 'Chưa xác định';
}

/**
 * Chuyển đổi 1 đơn hàng backend → format hiển thị cho trang lịch sử
 */
function transformBackendOrder(order) {
  const status = order.status || 'PENDING';
  const items = (order.items || []).map((item) => ({
    id: item.productId || item.id,
    name: item.product?.name || `Sản phẩm #${item.productId}`,
    size: item.sizeCode || 'M',
    options: '',
    topping: '',
    quantity: item.qty || 1,
    price: Number(item.unitPrice || 0),
    image: item.product?.imageUrl || '',
  }));

  const itemsSummary =
    items.length > 0
      ? items.map((i) => `${i.quantity} × ${i.name}`).join(' + ')
      : `Đơn hàng ${order.code}`;

  return {
    id: order.id,
    code: order.code || `#${order.id}`,
    date: formatDate(order.createdAt),
    month: getMonth(order.createdAt),
    statusCategory: mapStatusCategory(status),
    paymentStatus: mapPaymentStatus(status),
    drinkStatus: mapDrinkStatus(status),
    title: itemsSummary,
    specsList: [],
    pickup: 'BrewLite Nguyễn Huệ · Nhận tại quầy',
    store: 'BrewLite Nguyễn Huệ - 42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM',
    paymentMethod: mapPaymentMethod(order.payments),
    price: Number(order.total || 0),
    formattedPrice: formatPrice(order.total || 0),
    thumbnail: items[0]?.image || '/images/latte-yen-mach.png',
    primaryButtonIsView: status === 'PAID' || status === 'PREPARING' || status === 'READY',
    infoBanner: mapInfoBanner(status),
    timelineStep: mapTimelineStep(status),
    items,
    _raw: order, // giữ lại dữ liệu gốc để debug nếu cần
  };
}

/**
 * Chuyển đổi 1 đơn hàng lưu cục bộ (sessionStorage / localStorage) → format hiển thị cho trang lịch sử
 */
function adaptLocalOrder(lo) {
  const status = lo.orderStatus || lo.status || 'PAID';
  const rawItems = lo.items || [];
  const items = rawItems.map((item, idx) => ({
    id: item.id || idx,
    name: item.name || 'Sản phẩm BrewLite',
    size: item.size || 'M',
    options: item.specs || item.options || '',
    topping: item.topping || '',
    quantity: item.quantity || item.qty || 1,
    price:
      typeof item.price === 'number'
        ? item.price
        : typeof item.unitPrice === 'number'
          ? item.unitPrice
          : 65000,
    image: item.image || item.imageUrl || '/images/latte-yen-mach.png',
  }));

  const itemsSummary =
    items.length > 0
      ? items.map((i) => `${i.quantity} × ${i.name}`).join(' + ')
      : `Đơn hàng ${lo.code || ''}`;

  let numericTotal = 0;
  if (typeof lo.total === 'number') {
    numericTotal = lo.total;
  } else if (typeof lo.total === 'string') {
    numericTotal = parseInt(lo.total.replace(/[^0-9]/g, ''), 10) || 0;
  }

  let dateStr = lo.date || '';
  let monthStr = '';
  if (!dateStr) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    monthStr = `${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  } else {
    const parts = dateStr.split('/');
    if (parts.length >= 3) {
      const year = parts[2].split(' ')[0].replace(/[^0-9]/g, '');
      const month = parts[1].padStart(2, '0');
      monthStr = `${month}/${year}`;
    }
  }

  return {
    id: lo.orderId || lo.id || lo.code || 'local-' + Date.now(),
    code: lo.code || `#BL-${lo.orderId || 'LOCAL'}`,
    date: dateStr,
    month: monthStr,
    statusCategory: mapStatusCategory(status),
    paymentStatus: mapPaymentStatus(status),
    drinkStatus: mapDrinkStatus(status),
    title: itemsSummary,
    specsList: [],
    pickup: 'BrewLite Nguyễn Huệ · Nhận tại quầy',
    store: 'BrewLite Nguyễn Huệ - 42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM',
    paymentMethod: lo.method || 'Cổng VNPay Sandbox',
    price: numericTotal,
    formattedPrice:
      typeof lo.total === 'string' && lo.total.includes('VNĐ')
        ? lo.total
        : formatPrice(numericTotal),
    thumbnail: items[0]?.image || '/images/latte-yen-mach.png',
    primaryButtonIsView:
      status === 'PAID' || status === 'PREPARING' || status === 'READY',
    infoBanner: mapInfoBanner(status),
    timelineStep: mapTimelineStep(status),
    items,
    _raw: lo,
  };
}

/**
 * Kiểm tra xem đơn hàng có phải là đơn thanh toán thất bại / không thành công không
 */
function isOrderUnsuccessful(order) {
  if (!order) return false;
  const status =
    order._raw?.status ||
    order._raw?.orderStatus ||
    order.status ||
    '';
  if (status === 'PAYMENT_FAILED' || status === 'CANCELLED') return true;
  if (order.statusCategory === 'cancelled') return true;
  if (
    order.paymentStatus?.label === 'Thanh toán thất bại' ||
    order.paymentStatus?.label === 'Đã hủy'
  ) {
    return true;
  }
  return false;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OrderHistoryPage() {
  const router = useRouter();
  const { addItem, restoreCart } = useCart();
  const { user, token } = useAuth();
  const { resetCheckout } = useCheckout();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [activeTab, setActiveTab] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // ── Fetch đơn hàng từ backend & local state ────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');

    let backendTransformed = [];
    let hasBackendError = false;

    // 1. Tải từ backend nếu có token đăng nhập hợp lệ
    const activeToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('brewlite_token')
        : null);

    if (activeToken && !activeToken.startsWith('mock-')) {
      try {
        const data = await orderService.getMyOrders(activeToken);
        const list = Array.isArray(data) ? data : [];
        backendTransformed = list.map(transformBackendOrder);
      } catch (err) {
        console.warn('Lỗi khi tải lịch sử đơn hàng từ backend:', err);
        hasBackendError = true;
      }
    }

    // 2. Tải thêm từ local storage và session storage (đảm bảo đơn VNPay vừa thanh toán luôn xuất hiện)
    let localTransformed = [];
    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem('brewlite_orders');
        const list = rawLocal ? JSON.parse(rawLocal) : [];

        // Kiểm tra localStorage và sessionStorage nếu có đơn vừa thanh toán
        const lastOrderRaw =
          localStorage.getItem('brewlite_last_order') ||
          sessionStorage.getItem('brewlite_last_order');
        if (lastOrderRaw) {
          try {
            const lastOrder = JSON.parse(lastOrderRaw);
            if (
              lastOrder &&
              (lastOrder.orderStatus === 'PAID' || lastOrder.code)
            ) {
              if (
                !list.some(
                  (o) =>
                    o.code === lastOrder.code ||
                    (o.orderId && o.orderId === lastOrder.orderId),
                )
              ) {
                list.unshift(lastOrder);
              }
            }
          } catch {}
        }

        localTransformed = list.map(adaptLocalOrder);
      } catch (e) {
        console.warn('Lỗi khi đọc local orders:', e);
      }
    }

    // 3. Hợp nhất: Đưa backend vào trước, bổ sung hoặc cập nhật trạng thái PAID từ local
    const mergedMap = new Map();
    backendTransformed.forEach((o) => {
      mergedMap.set(String(o.code || o.id), o);
    });

    localTransformed.forEach((lo) => {
      const key = String(lo.code || lo.id);
      if (!mergedMap.has(key)) {
        mergedMap.set(key, lo);
      } else {
        const existing = mergedMap.get(key);
        if (
          lo.paymentStatus?.label === 'Đã thanh toán' &&
          existing.paymentStatus?.label !== 'Đã thanh toán'
        ) {
          mergedMap.set(key, { ...existing, ...lo });
        }
      }
    });

    const finalOrders = Array.from(mergedMap.values());
    setOrders(finalOrders);

    if (finalOrders.length === 0) {
      if (!activeToken || activeToken.startsWith('mock-')) {
        setFetchError('Vui lòng đăng nhập để đồng bộ toàn bộ lịch sử đơn hàng.');
      } else if (hasBackendError) {
        setFetchError('Không thể kết nối đến máy chủ. Bạn chưa có đơn hàng nào đã lưu.');
      }
    }

    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Tính toán các tháng có đơn hàng ───────────────────────────────────────
  const availableMonths = useMemo(() => {
    const months = new Set();
    orders.forEach((o) => {
      if (o.month) months.add(o.month);
    });
    return Array.from(months).sort().reverse();
  }, [orders]);

  // ── Đếm số đơn theo từng tab ─────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const counts = { all: 0, processing: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      counts.all++;
      if (counts[o.statusCategory] !== undefined) {
        counts[o.statusCategory]++;
      }
    });
    return counts;
  }, [orders]);

  // ── Lọc danh sách theo tab và tháng ───────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchTab =
        activeTab === 'all' || order.statusCategory === activeTab;
      const matchMonth =
        selectedMonth === 'all' || order.month === selectedMonth;
      return matchTab && matchMonth;
    });
  }, [orders, activeTab, selectedMonth]);

  // Đặt lại món: Khôi phục danh sách món của đơn và chuyển thẳng đến phần thanh toán
  const handleReorder = (order) => {
    if (!order) return;

    const rawItems = order.items && order.items.length > 0 ? order.items : [];
    const itemsToReorder =
      rawItems.length > 0
        ? rawItems.map((item, idx) => ({
            id: item.id || idx + 1,
            name: item.name || 'Sản phẩm BrewLite',
            size: item.size || 'M',
            options: item.options || item.specs || '',
            topping: item.topping || '',
            unitPrice: Number(item.price || item.unitPrice || 65000),
            price: Number(item.price || item.unitPrice || 65000),
            quantity: Number(item.quantity || item.qty || 1),
            image: item.image || item.imageUrl || '/images/latte-yen-mach.png',
          }))
        : [
            {
              id: 1,
              name: order.title || 'Cà phê BrewLite',
              size: 'M',
              options: '',
              topping: '',
              unitPrice: Number(order.price || 65000),
              price: Number(order.price || 65000),
              quantity: 1,
              image: order.thumbnail || '/images/latte-yen-mach.png',
            },
          ];

    // Nạp lại các món của đơn này vào giỏ hàng
    if (restoreCart) {
      restoreCart(itemsToReorder);
    } else {
      itemsToReorder.forEach((item) => addItem(item));
    }

    // Đặt lại trạng thái thanh toán mới và cấp key idempotency mới
    if (resetCheckout) {
      resetCheckout();
    }
    paymentService.resetPaymentKey();

    setToastMessage(`Đã nạp lại các món của đơn ${order.code}! Đang chuyển sang trang thanh toán...`);
    setTimeout(() => {
      if (!user) {
        router.push('/checkout/account');
      } else {
        router.push('/checkout/payment');
      }
    }, 450);
  };

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: C.bg,
        minHeight: '100%',
        padding: '36px 32px 70px',
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Toast thông báo */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              backgroundColor: C.primary,
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(40, 84, 70, 0.25)',
              zIndex: 9999,
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header: Title */}
        <div style={{ marginBottom: '26px' }}>
          <h1
            style={{
              margin: '0 0 10px',
              fontSize: '38px',
              fontWeight: 500,
              color: C.text,
              lineHeight: '48px',
              fontFamily: 'serif, Georgia, "Times New Roman"',
            }}
          >
            Những ly cà phê của bạn.
          </h1>
        </div>

        {/* Filter Pills & Month selector */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '26px',
          }}
        >
          {/* Pills Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'processing', label: 'Đang thực hiện' },
              { key: 'completed', label: 'Đã nhận' },
              { key: 'cancelled', label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  backgroundColor: activeTab === tab.key ? C.primary : C.white,
                  color: activeTab === tab.key ? '#ffffff' : C.text,
                  border: activeTab === tab.key ? 'none' : `1px solid ${C.border}`,
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  fontSize: '13.5px',
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label} · {tabCounts[tab.key]}
              </button>
            ))}
          </div>

          {/* Month Dropdown + Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={fetchOrders}
              title="Làm mới danh sách"
              style={{
                background: 'none',
                border: `1px solid ${C.border}`,
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                color: C.primary,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ↻ Làm mới
            </button>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  appearance: 'none',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13.5px',
                  color: C.textMuted,
                  fontWeight: 500,
                  cursor: 'pointer',
                  paddingRight: '18px',
                  outline: 'none',
                }}
              >
                <option value="all">Tất cả các tháng</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: '2px',
                  pointerEvents: 'none',
                  fontSize: '11px',
                  color: C.textMuted,
                }}
              >
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: '16px',
              border: `1px solid ${C.border}`,
              padding: '50px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '16px', color: C.textMuted, margin: 0 }}>
              Đang tải lịch sử đơn hàng...
            </p>
          </div>
        )}

        {/* Error / Not logged in state (chỉ hiển thị khi không có đơn hàng nào) */}
        {!isLoading && orders.length === 0 && fetchError && (
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: '16px',
              border: `1px solid ${C.border}`,
              padding: '50px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '32px', margin: '0 0 12px' }}>☕</p>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: C.text }}>
              {!user ? 'Chưa đăng nhập' : 'Chưa có dữ liệu đơn hàng'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: C.textMuted }}>
              {fetchError}
            </p>
            {!user ? (
              <Link
                href="/login"
                style={{
                  display: 'inline-block',
                  backgroundColor: C.primary,
                  color: '#ffffff',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Đăng nhập
              </Link>
            ) : (
              <button
                type="button"
                onClick={fetchOrders}
                style={{
                  backgroundColor: C.primary,
                  color: '#ffffff',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
            )}
          </div>
        )}

        {/* Orders List */}
        {!isLoading && (orders.length > 0 || !fetchError) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {filteredOrders.length === 0 ? (
              <div
                style={{
                  backgroundColor: C.white,
                  borderRadius: '16px',
                  border: `1px solid ${C.border}`,
                  padding: '50px 20px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '32px', margin: '0 0 12px' }}>☕</p>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: C.text }}>
                  Không có đơn hàng nào trong mục này
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: C.textMuted }}>
                  Hãy chọn mục khác hoặc quay lại khám phá thực đơn cà phê của BrewLite.
                </p>
                <Link
                  href="/"
                  style={{
                    display: 'inline-block',
                    backgroundColor: C.primary,
                    color: '#ffffff',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Xem thực đơn
                </Link>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: C.white,
                    borderRadius: '16px',
                    border: `1px solid ${C.border}`,
                    padding: '24px 28px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Order Top Bar: Code, Date & Status Badges */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
                      <span
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: C.text,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {order.code}
                      </span>
                      <span style={{ fontSize: '13px', color: C.textMuted }}>{order.date}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {order.paymentStatus && (
                        <span
                          style={{
                            backgroundColor: order.paymentStatus.bg,
                            color: order.paymentStatus.color,
                            borderRadius: '9999px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {order.paymentStatus.label}
                        </span>
                      )}
                      {order.drinkStatus && (
                        <span
                          style={{
                            backgroundColor: order.drinkStatus.bg,
                            color: order.drinkStatus.color,
                            borderRadius: '9999px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {order.drinkStatus.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Main Content: Thumbnail, Details, Total Price & Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '20px',
                    }}
                  >
                    {/* Left: Thumbnail & Item Descriptions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        flex: 1,
                        minWidth: '300px',
                      }}
                    >
                      <div
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          backgroundColor: '#f1ede4',
                          flexShrink: 0,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {order.thumbnail ? (
                          <img
                            src={order.thumbnail}
                            alt={order.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                            }}
                          >
                            ☕
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div
                          style={{
                            fontSize: '15.5px',
                            fontWeight: 600,
                            color: C.text,
                            lineHeight: '22px',
                          }}
                        >
                          {order.title}
                        </div>

                        {order.specsList && order.specsList.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                            }}
                          >
                            {order.specsList.map((spec, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  fontSize: '12.5px',
                                  color: C.textMuted,
                                }}
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: '13px',
                            color: order.infoBanner ? C.text : C.textMuted,
                            marginTop: '2px',
                          }}
                        >
                          {order.pickup}
                        </div>
                      </div>
                    </div>

                    {/* Right: Total Price & Action Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '10px',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '22px',
                          fontWeight: 700,
                          color: C.text,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {order.formattedPrice}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveModalOrder(order)}
                          style={{
                            backgroundColor: order.primaryButtonIsView ? C.primary : C.white,
                            color: order.primaryButtonIsView ? '#ffffff' : C.text,
                            border: order.primaryButtonIsView ? 'none' : `1px solid ${C.border}`,
                            borderRadius: '6px',
                            padding: '8px 18px',
                            fontSize: '13px',
                            fontWeight: order.primaryButtonIsView ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Xem đơn
                        </button>

                        {(() => {
                          const isFailed = isOrderUnsuccessful(order);
                          const btnBg = isFailed
                            ? '#c9402a'
                            : order.primaryButtonIsView
                              ? C.white
                              : C.primary;
                          const btnColor = isFailed
                            ? '#ffffff'
                            : order.primaryButtonIsView
                              ? C.text
                              : '#ffffff';
                          const btnBorder = isFailed
                            ? 'none'
                            : order.primaryButtonIsView
                              ? `1px solid ${C.border}`
                              : 'none';
                          const btnFontWeight = isFailed
                            ? 600
                            : order.primaryButtonIsView
                              ? 500
                              : 600;

                          return (
                            <button
                              type="button"
                              onClick={() => handleReorder(order)}
                              title={
                                isFailed
                                  ? 'Đơn thanh toán chưa thành công · Nhấn để thử thanh toán lại'
                                  : 'Đặt lại đơn hàng này'
                              }
                              style={{
                                backgroundColor: btnBg,
                                color: btnColor,
                                border: btnBorder,
                                borderRadius: '6px',
                                padding: '8px 18px',
                                fontSize: '13px',
                                fontWeight: btnFontWeight,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isFailed
                                  ? '0 1px 3px rgba(201, 64, 42, 0.25)'
                                  : 'none',
                              }}
                            >
                              Đặt lại
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Status Notice Banner (khi đơn đang xử lý/chưa hoàn tất) */}
                  {order.infoBanner && (
                    <div
                      style={{
                        marginTop: '16px',
                        backgroundColor: C.primaryLight,
                        borderRadius: '8px',
                        padding: '11px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={C.primary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span
                        style={{
                          fontSize: '12.5px',
                          color: C.primary,
                          lineHeight: '18px',
                        }}
                      >
                        {order.infoBanner}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Footnote under orders list */}
        <p
          style={{
            marginTop: '24px',
            marginBottom: 0,
            fontSize: '12.5px',
            color: C.textMuted,
            lineHeight: '19px',
          }}
        >
          Đặt lại sẽ tạo giỏ mới theo giá và tình trạng còn món hiện tại, không tự động thanh toán.
        </p>

        {/* Modal: Chi tiết đơn hàng khi click Xem đơn */}
        {activeModalOrder && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px',
            }}
            onClick={() => setActiveModalOrder(null)}
          >
            <div
              style={{
                backgroundColor: C.white,
                borderRadius: '16px',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px 32px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.primary, letterSpacing: '0.05em' }}>
                    CHI TIẾT ĐƠN HÀNG
                  </div>
                  <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: C.text }}>
                    {activeModalOrder.code}
                  </h2>
                  <div style={{ fontSize: '13px', color: C.textMuted, marginTop: '4px' }}>
                    Thời gian đặt: {activeModalOrder.date}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalOrder(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    color: C.textMuted,
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span
                  style={{
                    backgroundColor: activeModalOrder.paymentStatus.bg,
                    color: activeModalOrder.paymentStatus.color,
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {activeModalOrder.paymentStatus.label}
                </span>
                <span
                  style={{
                    backgroundColor: activeModalOrder.drinkStatus.bg,
                    color: activeModalOrder.drinkStatus.color,
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {activeModalOrder.drinkStatus.label}
                </span>
              </div>

              {/* Progress Steps (State Machine) */}
              {activeModalOrder.timelineStep > 0 && (
                <div
                  style={{
                    backgroundColor: '#faf8f5',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: C.text, marginBottom: '12px' }}>
                    Tiến trình chuẩn bị đồ uống:
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    {[
                      { step: 1, label: 'Đã nhận đơn' },
                      { step: 2, label: 'Đang pha' },
                      { step: 3, label: 'Sẵn sàng nhận' },
                      { step: 4, label: 'Đã nhận' },
                    ].map((st) => {
                      const isDone = activeModalOrder.timelineStep >= st.step;
                      return (
                        <div
                          key={st.step}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            zIndex: 1,
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: isDone ? C.primary : '#dedcd2',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isDone ? '✓' : st.step}
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              color: isDone ? C.primary : C.textMuted,
                              fontWeight: isDone ? 600 : 400,
                              textAlign: 'center',
                            }}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: C.text, marginBottom: '10px' }}>
                  Danh sách món ({activeModalOrder.items.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeModalOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              backgroundColor: '#f1ede4',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                            }}
                          >
                            ☕
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>
                            {item.quantity} × {item.name}
                          </div>
                          <div style={{ fontSize: '12px', color: C.textMuted }}>
                            Size {item.size}{item.options ? ` · ${item.options}` : ''}
                          </div>
                          {item.topping && (
                            <div style={{ fontSize: '11.5px', color: C.textMuted }}>
                              Topping: {item.topping}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>
                        {(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Meta Info */}
              <div
                style={{
                  backgroundColor: '#fbf9f4',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.textMuted }}>Cửa hàng nhận:</span>
                  <span style={{ fontWeight: 500, color: C.text }}>{activeModalOrder.store}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.textMuted }}>Phương thức thanh toán:</span>
                  <span style={{ fontWeight: 500, color: C.text }}>{activeModalOrder.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontWeight: 700, color: C.text }}>Tổng thanh toán:</span>
                  <span style={{ fontWeight: 700, color: C.primary, fontSize: '16px' }}>
                    {activeModalOrder.formattedPrice}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModalOrder(null)}
                  style={{
                    backgroundColor: C.white,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                {(() => {
                  const isModalFailed = isOrderUnsuccessful(activeModalOrder);
                  const modalBtnBg = isModalFailed ? '#c9402a' : C.primary;

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        handleReorder(activeModalOrder);
                        setActiveModalOrder(null);
                      }}
                      style={{
                        backgroundColor: modalBtnBg,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '9px 20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isModalFailed
                          ? '0 1px 3px rgba(201, 64, 42, 0.25)'
                          : 'none',
                      }}
                    >
                      Đặt lại đơn này
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
