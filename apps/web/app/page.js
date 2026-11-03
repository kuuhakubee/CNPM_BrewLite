'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function HomePage() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả đồ uống');

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

  const categories = [
    { name: 'Tất cả đồ uống', count: products.length },
    { name: 'Cà phê', count: products.filter((p) => p.category === 'coffee').length },
    { name: 'Trà & Matcha', count: products.filter((p) => p.category === 'tea').length },
    { name: 'Đồ uống trái cây', count: products.filter((p) => p.category === 'juice' || p.category === 'smoothie').length },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tất cả đồ uống' ||
      (selectedCategory === 'Cà phê' && p.category === 'coffee') ||
      (selectedCategory === 'Trà & Matcha' && p.category === 'tea') ||
      (selectedCategory === 'Đồ uống trái cây' && (p.category === 'juice' || p.category === 'smoothie'));
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5ef', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ fontSize: '16px', color: '#78766c' }}>Đang tải thực đơn...</p>
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
        <nav style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'center', padding: '0 24px', flex: 1 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: '170px', justifyContent: 'flex-end' }}>
          <a href="/login" style={{ fontSize: '14px', color: '#302b24', fontWeight: 500, textDecoration: 'none' }}>
            {user ? user.name || user.email : 'Đăng nhập'}
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eaf0e8', borderRadius: '8px', padding: '12px 16px', textDecoration: 'none', color: '#285446', fontWeight: 600, fontSize: '14px' }}>
            <span>Giỏ hàng · {itemCount || 0}</span>
          </a>
        </div>
      </header>

      {/* Store Info */}
      <section style={{ padding: '24px 64px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: '13px', color: '#302b24', fontWeight: 500 }}>
          <span style={{ color: '#285446', fontWeight: 600 }}>Nhận tại</span> BrewLite Nguyễn Huệ · Quận 1
          <a href="#" style={{ color: '#78766c', textDecoration: 'underline', marginLeft: '8px', fontWeight: 400 }}>Thay đổi ↗</a>
        </div>
        <div style={{ fontSize: '13px', color: '#78766c' }}>
          Nhận tại quầy · 15-20 phút
        </div>
      </section>

      {/* Main Content */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 64px 80px', display: 'flex', gap: '60px' }}>
        {/* Sidebar - Categories */}
        <aside style={{ width: '240px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#285446', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>
            DANH MỤC
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name === selectedCategory ? 'Tất cả đồ uống' : cat.name)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  border: 'none',
                  background: cat.name === selectedCategory ? '#eaf0e8' : 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: cat.name === selectedCategory ? '#285446' : '#78766c',
                  fontWeight: cat.name === selectedCategory ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <span>{cat.name}</span>
                <span style={{ fontSize: '12px', color: '#b5b09c', fontWeight: 500 }}>{cat.count}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Area */}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: 'Noto Serif, Georgia, serif',
              fontSize: '48px',
              fontWeight: 500,
              color: '#302b24',
              marginBottom: '4px',
              letterSpacing: '-0.02em',
            }}
          >
            Hôm nay, bạn uống gì?
          </h1>
          <p style={{ fontSize: '16px', color: '#78766c', marginBottom: '28px' }}>
            Chọn một món yêu thích. Tùy chỉnh theo đúng gu của bạn.
          </p>

          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#fff',
              border: '1px solid #dedcd2',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '32px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78766c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên đồ uống..."
              style={{
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: '14px',
                color: '#302b24',
                fontFamily: 'Inter, sans-serif',
                background: 'transparent',
              }}
            />
            <span style={{ fontSize: '13px', color: '#b5b09c' }}>⌘ K</span>
          </div>

          {/* Product Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '28px',
            }}
          >
            {filteredProducts.map((p) => (
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
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80'}
                  alt={p.name}
                  style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: '20px 24px 24px' }}>
                  <h2
                    style={{
                      fontFamily: 'Noto Serif, Georgia, serif',
                      fontSize: '24px',
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
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '24px 64px',
          borderTop: '1px solid #dedcd2',
          background: '#f7f5ef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', color: '#78766c' }}>
          BrewLite / Một chút chậm, một ngày thật ngon.
        </span>
        <span style={{ fontSize: '12px', color: '#78766c' }}>
          Hỗ trợ &nbsp;•&nbsp; Điều khoản &nbsp;•&nbsp; Quyền riêng tư
        </span>
      </footer>
    </main>
  );
}
