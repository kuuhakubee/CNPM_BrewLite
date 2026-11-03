'use client';

import AuthContainer from '../../components/auth/AuthContainer';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function LoginPage() {
  const { user } = useAuth();
  const { itemCount } = useCart();
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
          <a href="/" style={{ fontSize: '14px', color: '#78766c', textDecoration: 'none' }}>Thực đơn</a>
          <a href="#" style={{ fontSize: '14px', color: '#78766c', textDecoration: 'none' }}>Cửa hàng</a>
          <a href="#" style={{ fontSize: '14px', color: '#78766c', textDecoration: 'none' }}>Lịch sử đơn</a>
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

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AuthContainer initialMode="login" />
      </div>
    </main>
  );
}
