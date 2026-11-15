const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const authService = {
  /**
   * Đăng nhập khách hàng: chỉ cho phép đăng nhập qua API backend & cơ sở dữ liệu
   */
  async login(email, password) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch (networkErr) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra dịch vụ backend.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Email hoặc mật khẩu không chính xác');
    }

    return await response.json();
  },

  /**
   * Đăng ký tài khoản mới lưu trực tiếp vào cơ sở dữ liệu
   */
  async register(userData) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch (networkErr) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra dịch vụ backend.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Đăng ký không thành công');
    }

    return await response.json();
  },
};
