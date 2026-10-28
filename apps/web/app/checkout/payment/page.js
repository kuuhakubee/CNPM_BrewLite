'use client';

import CheckoutStepper from '../../../components/checkout/CheckoutStepper';

export default function PaymentPage() {
  return (
    <>
      <CheckoutStepper currentStep={3} />
      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--brand-forest)', marginBottom: '12px' }}>
          Phương thức thanh toán
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Giao diện bước 3: Thanh toán mẫu, chọn ví điện tử hoặc thẻ ATM / QR Code.
        </p>
      </main>
    </>
  );
}
