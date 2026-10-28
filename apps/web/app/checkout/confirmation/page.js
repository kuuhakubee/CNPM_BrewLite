'use client';

import CheckoutStepper from '../../../components/checkout/CheckoutStepper';

export default function ConfirmationPage() {
  return (
    <>
      <CheckoutStepper currentStep={4} />
      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--brand-forest)', marginBottom: '12px' }}>
          Xác nhận đơn hàng
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Giao diện bước 4: Hoàn tất đặt hàng và mã nhận đồ tại quầy.
        </p>
      </main>
    </>
  );
}
