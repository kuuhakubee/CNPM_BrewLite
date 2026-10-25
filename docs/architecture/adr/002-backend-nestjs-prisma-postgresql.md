# ADR-002: Backend NestJS + Prisma + PostgreSQL

| | |
|---|---|
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | Sprint 1 |
| **Liên quan** | Task 3.1, C-01, C-09 |

## Bối cảnh

Đề bài bắt buộc dùng **NestJS** cho backend và **PostgreSQL** làm CSDL. Cần chọn:

1. **ORM**: Prisma hay TypeORM hay raw SQL.
2. **Cách quản lý schema**: migration do ORM sinh hay SQL thủ công.
3. **Kiểu dữ liệu tiền tệ**: `float`, `decimal` hay `int` (VND).
4. **Cách biểu diễn trạng thái đơn**: `String` hay `enum`.

## Quyết định

- **NestJS** với TypeScript, module hóa theo nghiệp vụ: `products`, `auth`, `orders`, `payments`,
  `loyalty`, `promotions`, `health`, `prisma`.
- **Prisma 5** làm ORM, provider `postgresql`.
- **Migration do Prisma sinh** (`prisma/migrations/`), áp dụng bằng `prisma migrate deploy`
  trong container và trong CI/CD. Đây là cơ chế migration an toàn duy nhất được phép chạy
  trên production.
- **Tiền tệ**: `Decimal(12,2)` cho `price`, `total`, `subtotal`, `discount`, `lineTotal`.
  VND là đơn vị không có phần thập phân, nhưng `Decimal` vẫn an toàn hơn `Float` và tránh lỗi
  làm tròn do binary floating point.
- **Trạng thái đơn**: Prisma `enum OrderStatus` (`PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`,
  `READY`, `COMPLETED`, `CANCELLED`), kèm hàm domain `assertTransition()` chặn chuyển trạng thái
  không hợp lệ.
- **Khóa chính**: `Int` auto-increment cho tất cả entity (đủ dùng ở quy mô bài tập).
- **Tối ưu tồn kho**: `Product.version` (optimistic locking) được tăng trong mỗi lần trừ kho.

## Lý do

- **NestJS + Prisma** là tổ hợp phổ biến, tài liệu dễ tra, hỗ trợ TypeScript end-to-end.
- **Prisma sinh type cho client**: `OrderStatus` dùng chung giữa DTO, service và UI → giảm lỗi
  gõ sai chuỗi trạng thái.
- **Ràng buộc UNIQUE cho `Payment.idempotencyKey`** được khai báo tại schema → tính idempotency
  được *đảm bảo bởi database*, không phụ thuộc logic ứng dụng.
- **`enum` thay cho `String`**: `Payment.status`/`Order.status` không còn nhận giá trị bất kỳ ngoài
  danh sách hợp lệ.

## Hệ quả

**Tích cực**

- Schema là nguồn sự thật duy nhất; sinh client tự động, không lệch với DB.
- `prisma migrate deploy` idempotent → chạy lại an toàn trong pipeline.
- Test tích hợp dễ viết: dựng DB test bằng `prisma migrate deploy` rồi rollback bằng transaction.

**Tiêu cực**

- Prisma dùng query engine riêng → image Docker lớn hơn TypeORM/raw SQL.
- `Decimal` trả về dạng `Decimal.js` ở JS → cần ép về `number`/string khi trả ra DTO để JSON
  serialize đúng.
- Prisma chưa hỗ trợ `SELECT ... FOR UPDATE` trực tiếp → phải dùng `updateMany` với điều kiện
  `version` (optimistic locking) thay vì pessimistic lock. Đây là quyết định có chủ đích
  (xem ADR-004).

## Các lựa chọn đã cân nhắc và bác bỏ

| Lựa chọn | Lý do bác bỏ |
|---|---|
| TypeORM | API `repository` kém trực quan hơn Prisma; migration sinh ra dễ đụng độ với schema hiện có. |
| Raw SQL + `pg` | Tốn sức cho CRUD, khó sinh type, tăng rủi ro lỗi injection nếu không cẩn thận. |
| `Float` cho tiền tệ | Lỗi làm tròn số thực nhị phân (VD: 0.1 + 0.2 ≠ 0.3) → sai tổng tiền. Vi phạm NFR-01 & AC-09-5. |
| `String` cho `Order.status` | Cho phép giá trị rác; không ép buộc logic chuyển trạng thái; khó sinh test ma trận chuyển trạng thái. |
