'use client';

import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Mock cart items based exactly on the Figma / visual designs:
  // 3 món · 175.000 VNĐ
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Latte yến mạch',
      size: 'M',
      options: '50% đường · Ít đá',
      topping: 'Sữa yến mạch (+10.000 VNĐ)',
      unitPrice: 65000,
      price: 65000,
      quantity: 2,
      image: '/images/latte-yen-mach.png',
      note: '50% đường · Ít đá',
    },
    {
      id: 2,
      name: 'Cold Brew nguyên bản',
      size: 'M',
      options: 'Không đường · Đá thường',
      topping: 'Không topping',
      unitPrice: 45000,
      price: 45000,
      quantity: 1,
      image: '/images/cold-brew.png',
      note: 'Không đường · Đá thường',
    },
  ]);

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const formattedTotal = new Intl.NumberFormat('vi-VN').format(totalAmount) + ' VNĐ';

  /**
   * Cập nhật số lượng: delta = +1 hoặc -1.
   * Nếu số lượng mới <= 0 → tự động xóa món khỏi giỏ.
   */
  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  /**
   * Xóa hoàn toàn một món khỏi giỏ hàng theo id.
   */
  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Thêm món vào giỏ hàng.
   * Nếu đã có món cùng id + size → tăng số lượng.
   * Nếu chưa có → thêm mới.
   */
  const addItem = (newItem) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === newItem.id && item.size === newItem.size
      );
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id && item.size === newItem.size
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        );
      }
      return [...prev, { quantity: 1, ...newItem }];
    });
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        totalAmount,
        formattedTotal,
        updateQuantity,
        removeItem,
        addItem,
        clearCart,
      }}
    >
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

