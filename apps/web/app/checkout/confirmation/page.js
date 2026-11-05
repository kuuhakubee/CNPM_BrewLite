'use client';

import CheckoutStepper from '../../../components/checkout/CheckoutStepper';

export default function ConfirmationPage() {
  const order = {
    code: '#1042',
    status: 'PAID',
    createdAt: '2026-10-31T10:30:00',
    items: [
      { name: 'Cappuccino', size: 'M', qty: 1, total: 45000 },
      { name: 'Trà đào', size: 'L', qty: 2, total: 86000 },
    ],
    total: 131000,
  };

  return (
    <>
      <CheckoutStepper currentStep={4} />
      <main
        style={{
          maxWidth: '720px',
          margin: '40px auto',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            border: '2px solid #2d6a4f',
            borderRadius: '16px',
            padding: '32px 24px',
            background: '#fff',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '28px',
              color: '#2d6a4f',
              marginBottom: '8px',
            }}
          >
            Đặt hàng thành công
          </h2>
          <p style={{ color: '#495057', fontSize: '14px', marginBottom: '20px' }}>
            Mã đơn: <strong style={{ color: '#2d6a4f' }}>{order.code}</strong>
          </p>
          <div
            style={{
              display: 'inline-block',
              background: '#e9f5f1',
              color: '#2d6a4f',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: '24px',
            }}
          >
            Trạng thái: {order.status}
          </div>

          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#2d6a4f', marginBottom: '12px' }}>
              Chi tiết đơn hàng
            </h3>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                style={{ display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #e9ecef',
                }}
              >
                <span style={{ color: '#495057' }}>
                  {item.name} {item.size ? `(${item.size})` : ''} × {item.qty}
                </span>
                <span style={{ color: '#2d6a4f', fontWeight: 600 }}>
                  {item.total.toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '2px solid #2d6a4f',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#2d6a4f' }}>Tổng cộng</span>
            <span style={{ color: '#2d6a4f' }}>
              {order.total.toLocaleString('vi-VN')}đ
            </span>
          </div>
<p
            style={{
              marginTop: '20px',
              color: '#6c757d',
              fontSize: '14px',
            }}
          >
            Mời tới quầy lấy nước
          </p>
        </div>
      </main>
    </>
  );
}
