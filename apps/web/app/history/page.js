'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';

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

const INITIAL_ORDERS = [
  {
    id: 'BL-1027',
    code: '#BL-1027',
    date: '27/10/2026 · 09:41',
    month: '10/2026',
    statusCategory: 'processing', // 'processing' | 'completed' | 'cancelled'
    paymentStatus: {
      label: 'Thanh toán: Đã xác nhận',
      bg: '#e7f3ec',
      color: '#285446',
    },
    drinkStatus: {
      label: 'Đồ uống: Đã nhận đơn',
      bg: '#fdf0e2',
      color: '#a76717',
    },
    title: '2 × Latte yến mạch + 1 × Cold Brew nguyên bản',
    specsList: [
      'Latte: M · 50% đường · Ít đá · Sữa yến mạch',
      'Cold Brew: M · Không đường · Đá thường · Không topping',
    ],
    pickup: 'BrewLite Nguyễn Huệ · Dự kiến nhận 09:56–10:01',
    store: 'BrewLite Nguyễn Huệ - 42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM',
    paymentMethod: 'Ví MoMo · Sandbox',
    price: 175000,
    formattedPrice: '175.000 VNĐ',
    thumbnail: '/images/latte-yen-mach.png',
    primaryButtonIsView: true,
    infoBanner:
      'Đã thanh toán · Chưa pha chế. Trạng thái đồ uống sẽ chuyển sang Đang pha → Sẵn sàng nhận → Đã nhận.',
    timelineStep: 1, // 1: Đã nhận đơn, 2: Đang pha, 3: Sẵn sàng nhận, 4: Đã nhận
    items: [
      {
        id: 1,
        name: 'Latte yến mạch',
        size: 'M',
        options: '50% đường · Ít đá',
        topping: 'Sữa yến mạch (+10.000 VNĐ)',
        quantity: 2,
        price: 65000,
        image: '/images/latte-yen-mach.png',
      },
      {
        id: 2,
        name: 'Cold Brew nguyên bản',
        size: 'M',
        options: 'Không đường · Đá thường',
        topping: 'Không topping',
        quantity: 1,
        price: 45000,
        image: '/images/cold-brew.png',
      },
    ],
  },
  {
    id: 'BL-1009',
    code: '#BL-1009',
    date: '24/10/2026 · 08:30',
    month: '10/2026',
    statusCategory: 'completed',
    paymentStatus: {
      label: 'Đã thanh toán',
      bg: '#e7f3ec',
      color: '#285446',
    },
    drinkStatus: {
      label: 'Đã nhận đồ uống',
      bg: '#eaf0e8',
      color: '#285446',
    },
    title: '1 × Cold Brew nguyên bản · M · Không đường · Đá thường',
    specsList: [],
    pickup: 'BrewLite Nguyễn Huệ · Nhận tại quầy',
    store: 'BrewLite Nguyễn Huệ - 42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM',
    paymentMethod: 'Thẻ ATM nội địa (Napas)',
    price: 45000,
    formattedPrice: '45.000 VNĐ',
    thumbnail: '/images/cold-brew.png',
    primaryButtonIsView: false,
    infoBanner: null,
    timelineStep: 4,
    items: [
      {
        id: 2,
        name: 'Cold Brew nguyên bản',
        size: 'M',
        options: 'Không đường · Đá thường',
        topping: 'Không topping',
        quantity: 1,
        price: 45000,
        image: '/images/cold-brew.png',
      },
    ],
  },
  {
    id: 'BL-0984',
    code: '#BL-0984',
    date: '21/10/2026 · 14:12',
    month: '10/2026',
    statusCategory: 'cancelled',
    paymentStatus: {
      label: 'Chưa thanh toán',
      bg: '#edebe6',
      color: '#6e6b63',
    },
    drinkStatus: {
      label: 'Đã hủy · Quá hạn thanh toán',
      bg: '#f5ede4',
      color: '#99653a',
    },
    title: '1 × Latte yến mạch · M · 50% đường · Ít đá · Sữa yến mạch',
    specsList: [],
    pickup: 'BrewLite Nguyễn Huệ · Nhận tại quầy',
    store: 'BrewLite Nguyễn Huệ - 42 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM',
    paymentMethod: 'Chưa thanh toán',
    price: 65000,
    formattedPrice: '65.000 VNĐ',
    thumbnail: '/images/latte-yen-mach.png',
    primaryButtonIsView: false,
    infoBanner: null,
    timelineStep: 0,
    items: [
      {
        id: 1,
        name: 'Latte yến mạch',
        size: 'M',
        options: '50% đường · Ít đá',
        topping: 'Sữa yến mạch (+10.000 VNĐ)',
        quantity: 1,
        price: 65000,
        image: '/images/latte-yen-mach.png',
      },
    ],
  },
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const { addItem } = useCart();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'processing' | 'completed' | 'cancelled'
  const [selectedMonth, setSelectedMonth] = useState('10/2026');
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Lọc danh sách theo tab và tháng
  const filteredOrders = useMemo(() => {
    return INITIAL_ORDERS.filter((order) => {
      const matchTab =
        activeTab === 'all' || order.statusCategory === activeTab;
      const matchMonth =
        selectedMonth === 'all' || order.month === selectedMonth;
      return matchTab && matchMonth;
    });
  }, [activeTab, selectedMonth]);

  // Đặt lại món: Thêm các món trong đơn hàng vào giỏ và chuyển đến trang giỏ hàng
  const handleReorder = (order) => {
    order.items.forEach((item) => {
      addItem({
        id: item.id,
        name: item.name,
        size: item.size,
        options: item.options,
        topping: item.topping,
        unitPrice: item.price,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      });
    });

    setToastMessage(`Đã thêm món từ đơn ${order.code} vào giỏ hàng! Đang chuyển đến giỏ hàng...`);
    setTimeout(() => {
      router.push('/cart');
    }, 900);
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

        {/* Header: Breadcrumb & Title */}
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
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                backgroundColor: activeTab === 'all' ? C.primary : C.white,
                color: activeTab === 'all' ? '#ffffff' : C.text,
                border: activeTab === 'all' ? 'none' : `1px solid ${C.border}`,
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'all' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Tất cả · 3
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('processing')}
              style={{
                backgroundColor: activeTab === 'processing' ? C.primary : C.white,
                color: activeTab === 'processing' ? '#ffffff' : C.text,
                border: activeTab === 'processing' ? 'none' : `1px solid ${C.border}`,
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'processing' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Đang thực hiện · 1
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              style={{
                backgroundColor: activeTab === 'completed' ? C.primary : C.white,
                color: activeTab === 'completed' ? '#ffffff' : C.text,
                border: activeTab === 'completed' ? 'none' : `1px solid ${C.border}`,
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'completed' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Đã nhận · 1
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cancelled')}
              style={{
                backgroundColor: activeTab === 'cancelled' ? C.primary : C.white,
                color: activeTab === 'cancelled' ? '#ffffff' : C.text,
                border: activeTab === 'cancelled' ? 'none' : `1px solid ${C.border}`,
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'cancelled' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Đã hủy · 1
            </button>
          </div>

          {/* Month Dropdown */}
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
              <option value="10/2026">Tháng 10/2026</option>
              <option value="09/2026">Tháng 09/2026</option>
              <option value="all">Tất cả các tháng</option>
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

        {/* Orders List */}
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

                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        style={{
                          backgroundColor: order.primaryButtonIsView ? C.white : C.primary,
                          color: order.primaryButtonIsView ? C.text : '#ffffff',
                          border: order.primaryButtonIsView ? `1px solid ${C.border}` : 'none',
                          borderRadius: '6px',
                          padding: '8px 18px',
                          fontSize: '13px',
                          fontWeight: order.primaryButtonIsView ? 500 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Đặt lại
                      </button>
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
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>
                            {item.quantity} × {item.name}
                          </div>
                          <div style={{ fontSize: '12px', color: C.textMuted }}>
                            Size {item.size} · {item.options}
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
                <button
                  type="button"
                  onClick={() => {
                    handleReorder(activeModalOrder);
                    setActiveModalOrder(null);
                  }}
                  style={{
                    backgroundColor: C.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Đặt lại đơn này
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
