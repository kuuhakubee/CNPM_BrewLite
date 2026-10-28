'use client';

import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Mock cart items based on the mockup (3 món · 175.000 VNĐ)
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Cà phê Muối Signature', size: 'M', quantity: 1, price: 55000 },
    { id: 2, name: 'Trà Đào Cam Sả', size: 'L', quantity: 1, price: 65000 },
    { id: 3, name: 'Bạc Xỉu Sữa Tươi', size: 'M', quantity: 1, price: 55000 },
  ]);

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const formattedTotal = new Intl.NumberFormat('vi-VN').format(totalAmount) + ' VNĐ';

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ cartItems, itemCount, totalAmount, formattedTotal, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
