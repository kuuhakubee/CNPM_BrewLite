'use client';

import React from 'react';
import { useCheckout } from '../context/CheckoutContext';

export default function HomePage() {
  const { startCartFlow, startAuthFlow } = useCheckout();

  return (
    <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', fontWeight: '700', color: '#1b221d', marginBottom: '16px' }}>
        Cà phê chuẩn vị.<br />Đặt trước, nhận ngay.
      </h1>
      <p style={{ fontSize: '18px', color: '#657169', marginBottom: '40px', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.5 }}>
        Chọn món yêu thích từ thực đơn, thanh toán tiện lợi và ghé nhận tại quầy BrewLite.
      </p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={startCartFlow}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#1e382b',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(30,56,43,0.25)',
          }}
        >
          Đặt hàng ngay
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        <button
          type="button"
          onClick={startAuthFlow}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#ffffff',
            color: '#1e382b',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            border: '1px solid #dbe1dc',
            cursor: 'pointer',
          }}
        >
          Đăng nhập tài khoản
        </button>
      </div>
    </main>
  );
}
