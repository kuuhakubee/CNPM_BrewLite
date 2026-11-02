'use client';

export default function OrdersPage() {
  // Dữ liệu mô phỏng từ backend GET /orders/me
  const orders = [
    {
      code: '#1042',
      status: 'PAID',
      createdAt: '2026-10-31T10:30:00',
      total: 131000,
      items: [
        { name: 'Cappuccino', size: 'M', qty: 1 },
        { name: 'Trà đào', size: 'L', qty: 2 },
      ],
    },
    {
      code: '#1041',
      status: 'COMPLETED',
      createdAt: '2026-10-30T15:20:00',
      total: 87000,
      items: [{ name: 'Americano', size: 'M', qty: 1 }],
    },
    {
      code: '#1040',
      status: 'COMPLETED',
      createdAt: '2026-10-29T09:00:00',
      total: 42000,
      items: [{ name: 'Trà sữa trân châu', size: 'L', qty: 1 }],
    },
  ];

  const statusColor = (status) => {
    switch (status) {
      case 'PAID':
        return { bg: '#e9f5f1', color: '#2d6a4f' };
      case 'COMPLETED':
        return { bg: '#f8f9fa', color: '#6c757d' };
      default:
        return { bg: '#fff5e6', color: '#b38600' };
    }
  };

  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 24px',
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
        Lịch sử đơn hàng
      </h2>
      <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '28px' }}>
        Theo dõi trạng thái và chi tiết các đơn đã đặt
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.map((order) => (
          <div
            key={order.code}
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '20px',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#2d6a4f' }}>
                  {order.code}
                </h3>
                <p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: '13px' }}>
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <span
                style={{
                  background: statusColor(order.status).bg,
                  color: statusColor(order.status).color,
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                {order.status}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '12px' }}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {order.items.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      color: '#495057',
                      fontSize: '14px',
                    }}
                  >
                    <span>
                      {item.name} {item.size ? `(${item.size})` : ''} × {item.qty}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px dashed #dee2e6',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#2d6a4f',
                }}
              >
                <span>Tổng cộng</span>
                <span>{order.total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
