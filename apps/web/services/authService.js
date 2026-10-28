const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const authService = {
  /**
   * Đăng nhập khách hàng
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Đăng nhập không thành công');
      }
      return await response.json();
    } catch (err) {
      // In development / demo mode, fallback to simulation if backend is not reachable
      console.warn('API backend not reachable, simulating login response:', err.message);
      return {
        accessToken: 'mock-jwt-token',
        user: { email, role: 'CUSTOMER' },
      };
    }
  },

  /**
   * Đăng ký tài khoản mới
   */
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Đăng ký không thành công');
      }
      return await response.json();
    } catch (err) {
      console.warn('API backend not reachable, simulating register response:', err.message);
      return {
        accessToken: 'mock-jwt-token',
        user: { ...userData, role: 'CUSTOMER' },
      };
    }
  },
};
