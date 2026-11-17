'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Nạp giỏ hàng từ localStorage khi ứng dụng khởi chạy
  useEffect(() => {
    try {
      const saved = localStorage.getItem('brewlite_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Lỗi khi nạp giỏ hàng từ localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Đồng bộ giỏ hàng vào localStorage mỗi khi cartItems thay đổi (chỉ sau khi đã nạp ban đầu)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('brewlite_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Lỗi khi lưu giỏ hàng vào localStorage:', e);
    }
  }, [cartItems, isLoaded]);

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
      const qtyToAdd = newItem.quantity || 1;
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id && item.size === newItem.size
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: qtyToAdd }];
    });
  };

  const addToCart = addItem;

  /**
   * Khôi phục giỏ hàng khi người dùng hủy hoặc thanh toán không thành công
   */
  const restoreCart = (items) => {
    if (Array.isArray(items) && items.length > 0) {
      setCartItems(items);
      try {
        localStorage.setItem('brewlite_cart', JSON.stringify(items));
      } catch {}
    }
  };

  /**
   * Chỉ dọn giỏ hàng khi đơn hàng ĐÃ THANH TOÁN THÀNH CÔNG
   */
  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('brewlite_cart');
    } catch {}
  };

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
        addToCart,
        clearCart,
        restoreCart,
        isLoaded,
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
