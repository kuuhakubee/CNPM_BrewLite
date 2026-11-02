/**
 * paymentService.js
 * ─────────────────
 * Gọi POST /api/v1/payments để thực hiện thanh toán mock.
 *
 * Client sinh idempotencyKey (UUID v4) mỗi lần bấm xác nhận,
 * và KHÔNG tạo key mới khi retry cùng một lần thanh toán (lưu trong session).
 * Tuân theo ADR-004: idempotency được bảo đảm bởi UNIQUE constraint ở DB.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Sinh UUID v4 tương thích với mọi môi trường (Node + Browser).
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback cho môi trường cũ
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const paymentService = {
  /**
   * Thực hiện thanh toán cho một đơn hàng.
   *
   * @param {object} params
   * @param {number} params.orderId       - ID đơn hàng từ POST /orders
   * @param {number} params.amount        - Tổng tiền (số, không format)
   * @param {'WALLET'|'CARD'} params.method - Phương thức thanh toán
   * @param {string} params.idempotencyKey - UUID v4 do client giữ
   * @param {string} accessToken          - JWT Bearer token
   *
   * @returns {Promise<{orderStatus: 'PAID'|'PAYMENT_FAILED', payment: object, order: object, idempotent: boolean}>}
   */
  async pay({ orderId, amount, method, idempotencyKey }, accessToken) {
    const response = await fetch(`${API_BASE_URL}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ orderId, amount, method, idempotencyKey }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg =
        Array.isArray(data?.message)
          ? data.message.join('; ')
          : data?.message || 'Không thể xử lý thanh toán';
      throw new Error(msg);
    }

    return data; // { message, idempotent, payment, orderStatus, order }
  },

  /**
   * Lấy hoặc tạo idempotencyKey cho session thanh toán hiện tại.
   * Chỉ tạo key mới nếu chưa có trong sessionStorage.
   * Gọi resetPaymentKey() sau khi thanh toán hoàn tất để xóa key cũ.
   */
  getOrCreateIdempotencyKey() {
    if (typeof window === 'undefined') return generateUUID();
    const stored = sessionStorage.getItem('brewlite_idempotency_key');
    if (stored) return stored;
    const key = generateUUID();
    sessionStorage.setItem('brewlite_idempotency_key', key);
    return key;
  },

  /** Xóa key sau khi thanh toán xong (dù thành công hay thất bại), */
  resetPaymentKey() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('brewlite_idempotency_key');
    }
  },
};
