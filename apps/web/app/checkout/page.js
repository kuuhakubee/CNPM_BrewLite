'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { itemCount, cartItems, isLoaded } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const hasItems =
      itemCount > 0 ||
      (cartItems && cartItems.length > 0) ||
      (typeof window !== 'undefined' &&
        (() => {
          try {
            return JSON.parse(localStorage.getItem('brewlite_cart') || '[]').length > 0;
          } catch {
            return false;
          }
        })());

    if (!hasItems) {
      router.replace('/checkout/cart');
    } else if (!user) {
      router.replace('/checkout/account');
    } else {
      router.replace('/checkout/payment');
    }
  }, [itemCount, cartItems, user, isLoaded, router]);

  return null;
}
