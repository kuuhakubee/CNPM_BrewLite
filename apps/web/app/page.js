'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('http://localhost:4000/api/v1/products');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#78766c', fontSize: '16px' }}>
          Đang tải thực đơn...
        </p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f7f5ef', fontFamily: 'Inter, sans-serif' }}>
      {/* Banner */}
      <div
        style={{
          background: '#285446',
          color: '#ffffff',
          textAlign: 'center',
          padding: '12px 24px',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.05em',
        }}
      >
        BẢN THIẾT KẾ MVP • Nhận tại quầy • Thanh toán mẫu, không phát sinh giao dịch
      </div>

      {/* Header */}
      <header
        style={{
          height: '96px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px',
          background: '#f7f5ef',
          borderBottom: '1px solid #dedcd2',
        }}
      >
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#285446" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
          <span style={{ fontFamily: 'Noto Serif, Georgia, serif', fontSize: '30px', fontWeight: 600, color: '#302b24', letterSpacing: '-0.02em' }}>
            BrewLite
          </span>
        </a>
        <nav style={{ display: 'flex', gap: '32px' }}>
          <a href="/" style={{ fontSize: '14px', color: '#285446', fontWeight: 600, textDecoration: 'none', borderBottom: '2px solid #285446', paddingBottom: '2px' }}>
            Thực đơn
          </a>
          <a href="#" style={{ fontSize: '14px', color: '#78766c', textDecoration: 'none' }}>
            Cửa hàng
          </a>
          <a href="#" style={{ fontSize: '14px', color: '#78766c', textDecoration: 'none' }}>
            Lịch sử đơn
          </a>
        </nav>
      </header>

      {/* Menu Content */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px 80px' }}>
        <h1
          style={{
            fontFamily: 'Noto Serif, Georgia, serif',
            fontSize: '48px',
            fontWeight: 500,
            color: '#302b24',
            textAlign: 'center',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          Thực đơn BrewLite
        </h1>
        <p style={{ textAlign: 'center', color: '#78766c', fontSize: '16px', marginBottom: '48px' }}>
          Cà phê chuẩn vị, đặt trước nhận ngay tại quầy
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '28px',
          }}
        >
          {products.map((p) => (
            <a
              key={p.id}
              href={`/product/${p.id}`}
              style={{
                textDecoration: 'none',
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #e9ecef',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                display: 'block',
                color: '#302b24',
              }}
            >
              <img
                src={p.imageUrl || `https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80`}
                alt={p.name}
                style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '20px 24px 24px' }}>
                <h2
                  style={{
                    fontFamily: 'Noto Serif, Georgia, serif',
                    fontSize: '22px',
                    fontWeight: 500,
                    color: '#302b24',
                    margin: '0 0 6px',
                    lineHeight: '30px',
                  }}
                >
                  {p.name}
                </h2>
                <p style={{ fontSize: '14px', color: '#78766c', margin: '0 0 14px', lineHeight: '21.7px', minHeight: '42px' }}>
                  {p.description || 'Thức uống thơm ngon từ BrewLite.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: 600, color: '#285446' }}>
                    {Number(p.price).toLocaleString('vi-VN')}đ
                  </span>
                  <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: 500 }}>
                    {p.category || 'coffee'}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#78766c' }}>
            <p>Không có sản phẩm nào. Hãy thêm sản phẩm từ bảng điều khiển quản lý.</p>
          </div>
        )}
      </section>
    </main>
  );
}
