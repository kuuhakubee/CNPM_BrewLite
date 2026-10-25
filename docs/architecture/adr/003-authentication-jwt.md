# ADR-003: Xác thực bằng JWT (Passport) với `accessToken` lưu ở client

| | |
|---|---|
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | Sprint 1 |
| **Liên quan** | FR-06, FR-07, FR-08, NFR-02 |

## Bối cảnh

Hệ thống cần xác thực người dùng để bảo vệ các thao tác nghiệp vụ (đặt đơn, thanh toán, xem lịch
sử đơn). Quy mô nhỏ, không cần quản lý phiên phía server.

Các lựa chọn chính: **Session + cookie**, **JWT**, **OAuth2/OIDC với nhà cung cấp ngoài**.

## Quyết định

- **JWT** ký bằng thuật toán HS256 với `JWT_SECRET` lấy từ biến môi trường.
- **Access token** có thời hạn 1 giờ, chứa `sub` (userId), `email`, `role`, `iat`, `exp`.
- **Mật khẩu** băm bằng `bcrypt` với cost ≥ 10; API không bao giờ trả `passwordHash`.
- **Client** (Next.js) lưu access token trong `localStorage` và gửi qua header
  `Authorization: Bearer <token>`.
- **NestJS `AuthGuard` (Passport JWT strategy)** bảo vệ các route nghiệp vụ.
- **Không dùng refresh token** ở phiên bản này (xem "Hệ quả").
- Endpoint công khai: `POST /auth/register`, `POST /auth/login`, `GET /products*`, `GET /health`.

## Lý do

- Đề bài A1 §12.1 yêu cầu rõ `POST /auth/login` **trả JWT** → JWT là lựa chọn bắt buộc.
- Stateless: API không cần lưu phiên → dễ scale ngang và phù hợp kiến trúc container.
- Guard tập trung ở tầng middleware → không lặp logic kiểm tra token trong từng controller.

## Hệ quả

**Tích cực**

- Không cần shared session store giữa các container API.
- Token tự mang thông tin định danh → guard chỉ cần verify chữ ký + `exp`.
- Dễ test: tạo token trực tiếp trong unit/integration test.

**Tiêu cực**

- **Không thu hồi được token** trước khi hết hạn: đăng xuất chỉ xóa token ở client.
  → giảm thiểu bằng TTL 1h; nếu cần thu hồi ngay thì phải thêm blocklist (Redis) — chưa cần
  trong phạm vi bài tập.
- **Token trong `localStorage`** dễ bị đánh cắp qua XSS. → giảm thiểu bằng React (escape mặc định),
  không dùng `dangerouslySetInnerHTML`, CSP header, và `httpOnly cookie` sẽ là hướng nâng cấp.
- Mật khẩu không thể "quên mật khẩu" (đã nằm ngoài phạm vi MVP).

## Các lựa chọn đã cân nhắc và bác bỏ

| Lựa chọn | Lý do bác bỏ |
|---|---|
| Session + cookie | Đề bài yêu cầu trả JWT; session cần shared store, tăng độ phức tạp vận hành. |
| OAuth2/OIDC (Google, GitHub) | Phụ thuộc dịch vụ ngoài, cần client id/secret, khó kiểm soát trong môi trường lớp học; ngoài phạm vi MVP. |
| Refresh token | Tốn công (lưu trữ, thu hồi, xoay vòng) so với giá trị nhận được ở quy mô bài tập. |
