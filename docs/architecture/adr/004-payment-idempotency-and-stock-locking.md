# ADR-004: Cổng thanh toán mô phỏng + Idempotency-Key + Optimistic Locking tồn kho

| | |
|---|---|
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | Sprint 1 |
| **Liên quan** | FR-09, FR-10, FR-11, FR-13, FR-14, FR-15, NFR-03 |

## Bối cảnh

Đề bài yêu cầu thanh toán "không tiền mặt" nhưng chỉ trong phạm vi **mô phỏng** cổng Ví/Thẻ
(Momo/VNPay/Stripe). Đồng thời bài toán nghiệp vụ bắt buộc (A1 Task 10) có ba rủi ro thực tế:

1. **Thanh toán trùng** — người dùng double-click hoặc retry khi mạng chập chờn → trừ tiền 2 lần,
   tạo 2 đơn.
2. **Vượt tồn kho** — nhiều khách đặt cùng lúc món cuối cùng → bán quá số lượng thực có.
3. **Chuyển trạng thái đơn sai** — ví dụ `PENDING → COMPLETED` bỏ qua bước thanh toán.

## Quyết định

### 1. Cổng thanh toán mô phỏng

- Một module riêng `payments/gateway` đặt sau interface `PaymentGateway`, cài đặt
  `MockPaymentGateway`.
- Endpoint mô phỏng: `POST /api/v1/payment-gateway/charge` nhận `{ orderId, amount, method, idempotencyKey }`.
- Kết quả `SUCCESS` với xác suất `PAYMENT_SUCCESS_RATE` (mặc định 0.9), ngược lại `FAILED` kèm lý do.
- **Deterministic trong test**: khi `NODE_ENV=test`, gateway dùng kết quả cố định lấy từ request
  hoặc từ `amount` hằng đặc biệt → test ổn định, không flaky.
- Interface này là "seam" để sau này thay bằng SDK Momo/VNPay thật mà không sửa nghiệp vụ đơn hàng.

### 2. Idempotency-Key

- Client sinh `Idempotency-Key` (UUID v4) **mỗi lần bấm xác nhận thanh toán**, gửi kèm header.
- `Payment.idempotencyKey` có ràng buộc **UNIQUE** ở tầng DB → tính idempotency được bảo đảm
  bởi database, không phụ thuộc logic ứng dụng.
- Luồng xử lý: `SELECT` theo key → nếu đã có, trả lại **kết quả cũ** (HTTP 200, `idempotent: true`);
  nếu chưa có, xử lý thanh toán rồi `INSERT` (bắt lỗi unique violation → trả lại kết quả cũ).
- Vì `Payment` được tạo trong **cùng transaction** với `assertTransition(PENDING → PAID)` và cộng
  điểm thưởng → gửi lại cùng key sẽ không cộng điểm lần hai.

### 3. Optimistic locking tồn kho

- `Product.version` (Int, mặc định 0) được tăng mỗi lần cập nhật.
- Trừ kho bằng `updateMany({ where: { id, stock: { gte: qty }, version }, data: { stock: { decrement: qty }, version: { increment: 1 } } })`.
- Nếu `count === 0` → bị xung đột hoặc hết hàng → `ROLLBACK` → trả `409 Conflict`.
- Toàn bộ thao tác tạo đơn nằm trong **một transaction** (`prisma.$transaction`).

### 4. Máy trạng thái đơn

- Hàm domain thuần `assertTransition(from, to)` với bảng chuyển trạng thái hợp lệ.
- Chuyển trạng thái không hợp lệ → ném `InvalidOrderTransitionError` → HTTP `409`.
- Mỗi lần chuyển trạng thái ghi 1 dòng `OrderStatusHistory` (from, to, actor, thời gian).

## Lý do

- **Idempotency ở tầng DB** mạnh hơn kiểm tra ở tầng ứng dụng: kể cả khi có 2 request song song,
  DB vẫn chỉ nhận 1 bản ghi `Payment`.
- **Optimistic locking** phù hợp hơn pessimistic lock (`SELECT ... FOR UPDATE`) cho tranh chấp
  kiểu "đọc rồi cập nhật" và tránh giữ lock lâu; Prisma không hỗ trợ `FOR UPDATE` trực tiếp.
- **Transaction bao trọn** đảm bảo "đơn tạo" và "tồn kho trừ" cùng thành công hoặc cùng không
  (AC-09-9).
- **Mock gateway có interface** giữ được ranh giới với hệ thống thanh toán thật.

## Hệ quả

**Tích cực**

- Đáp ứng trực tiếp tiêu chí chấm A1 Task 10: (a) chặn chuyển trạng thái sai, (b) 1 key → 1 đơn,
  (c) không vượt tồn kho.
- Test đồng thời viết được bằng cách gọi song song `Promise.all` các request `POST /orders`.
- Không phụ thuộc dịch vụ bên ngoài khi demo trước lớp.

**Tiêu cực**

- Xung đột optimistic lock → trả 409 thay vì tự retry; người dùng phải thử lại. (Có thể thêm
  retry có backoff ở Task 5 nếu cần.)
- `Idempotency-Key` là chi phí phía client; nếu client tạo key mới cho mỗi lần bấm thì mất tác
  dụng → quy tắc bắt buộc trong mã nguồn frontend và ghi rõ trong tài liệu.
- Mock gateway không mô phỏng đủ thực tế (3DS, webhook, hoàn/refund) → ngoài phạm vi bài tập.

## Các lựa chọn đã cân nhắc và bác bỏ

| Lựa chọn | Lý do bác bỏ |
|---|---|
| Dùng cổng thanh toán thật (Momo/VNPay sandbox) | Cần tài khoản merchant, ký số webhook, xử lý chữ ký, ngoài phạm vi và không bảo đảm chạy được trong lớp. |
| Chống trùng chỉ bằng logic ứng dụng (`findFirst` rồi `create`) | Vẫn cửa sổ race condition giữa hai request song song; cần ràng buộc UNIQUE ở DB. |
| Pessimistic lock `SELECT ... FOR UPDATE` | Prisma không hỗ trợ trực tiếp; phải dùng raw query, kém portable. |
| Giữ `idempotencyKey` ở tầng Redis | Thêm hạ tầng không cần thiết; Postgres đã đủ cho quy mô này. |
