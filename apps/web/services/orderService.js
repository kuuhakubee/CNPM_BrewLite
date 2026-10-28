const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const orderService = {
  /**
   * Tạo đơn hàng mới – yêu cầu JWT accessToken
   */
  async createOrder(orderData, accessToken) {
    const response = await fetch(`${API_BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Không thể tạo đơn hàng');
    }

    return await response.json();
  },

  /**
   * Lấy lịch sử đơn hàng của người dùng hiện tại
   */
  async getMyOrders(accessToken) {
    const response = await fetch(`${API_BASE_URL}/api/v1/orders`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Không thể lấy danh sách đơn');
    }

    return await response.json();
  },
};
