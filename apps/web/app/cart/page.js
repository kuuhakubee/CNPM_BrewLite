'use client';

import CheckoutStepper from '../../components/checkout/CheckoutStepper';
import CartView from '../../components/checkout/CartView';

export default function CartPage() {
  return (
    <>
      <CheckoutStepper currentStep={1} />
      <CartView />
    </>
  );
}
