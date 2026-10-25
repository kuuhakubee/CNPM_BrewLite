# Use-case trọng tâm: Đặt và thanh toán đơn hàng

| | |
|---|---|
| **Tài liệu** | `docs/requirements/use-case-checkout.md` |
| **Phiên bản** | 1.0 |
| **Task** | Assignment 2 – Task 1.3 |
| **Mã use-case** | `UC-07` |
| **Trạng thái** | Được duyệt (Sprint 1) |

---

## 1. Tổng quan

| Thuộc tính | Nội dung |
|---|---|
| **Mã** | UC-07 |
| **Tên** | Đặt và thanh toán đơn hàng |
| **Actor chính** | Khách hàng (ST-01) |
| **Actor phụ** | Hệ thống thanh toán mô phỏng (ST-06), Hệ thống quản lý tồn kho (DB) |
| **Trigger** | Khách bấm nút **"Đặt hàng"** ở màn hình giỏ hàng (sau khi đã đăng nhập). |
| **Mức ưu tiên** | Must |
| **Yêu cầu liên quan** | FR-05, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, NFR-02, NFR-03 |
| **Tiêu chí nghiệm thu chính** | AC-05-8, AC-08-1…4, AC-09-1…9, AC-10-1…7, AC-11-1…4, AC-12-1…5, AC-13-2, AC-15-1…4 |

---

## 2. Điều kiện

### 2.1 Tiền điều kiện (Preconditions)

1. Khách hàng đã **đăng nhập** và có JWT hợp lệ (nếu chưa, hệ thống chuyển sang luồng đăng nhập — xem §5.2).
2. Giỏ hàng có **ít nhất 1 dòng** hợp lệ.
3. Mỗi dòng giỏ đã có `productId`, `size` thuộc {S, M, L} và `qty ≥ 1`.
4. Menu đã được nạp từ CSDL (các sản phẩm trong giỏ đều tồn tại và còn hàng).
5. Hệ thống thanh toán mô phỏng đang sẵn sàng phản hồi.

### 2.2 Hậu điều kiện (Postconditions)

**Khi thành công:**

- Tồn tại đúng 1 bản ghi `Order` với `status = PAID`, `code` dạng `#<số>` và `total` = tổng tiền sau khuyến mãi.
- Tồn tại các `OrderItem` tương ứng; `Product.stock` được trừ đúng tổng qty.
- Tồn tại 1 bản ghi `Payment` (`status = SUCCESS`, `method` theo lựa chọn, `idempotencyKey` duy nhất).
- `User.loyaltyPoints` được cộng thêm `floor(total / 1000)`; có 1 `LoyaltyTransaction` loại `EARN`.
- Lịch sử chuyển trạng thái ghi nhận `PENDING → PAID`.
- Giỏ hàng **được xóa**; UI hiển thị màn hình xác nhận với mã đơn.

**Khi thất bại (thanh toán lỗi):**

- `Order` tồn tại với `status = PAYMENT_FAILED`; có 1 `Payment` (`status = FAILED`) và lý do lỗi.
- `Product.stock` **đã được hoàn lại** (đơn không còn giữ tồn kho) — hoặc giữ nguyên theo chính sách chốt ở Task 4; mặc định: hoàn lại khi đơn ở `PAYMENT_FAILED`.
- `User.loyaltyPoints` **không đổi**.
- **Giỏ hàng được giữ nguyên** để khách thử lại.

---

## 3. Sơ đồ use-case

Nguồn: [`../diagrams/usecase-checkout.puml`](../diagrams/usecase-checkout.puml) · Bản ảnh: [`../diagrams/usecase-checkout.svg`](../diagrams/usecase-checkout.svg)

Phạm vi của sơ đồ: các use-case liên quan trực tiếp đến UC-07 trong hệ thống BrewLite.

---

## 4. Luồng chính (Main Flow / Basic Flow)

| Bước | Actor | Hệ thống | Ghi chú / FR |
|---|---|---|---|
| 1 | Khách hàng | | Bấm **"Đặt hàng"** tại màn hình giỏ hàng. UI kiểm tra token; nếu chưa đăng nhập → chuyển sang §5.2 |
| 2 | Khách hàng | | Chọn phương thức thanh toán: **Ví điện tử** hoặc **Thẻ ngân hàng** (FR-10) |
| 3 | Khách hàng | | (Tùy chọn) Nhập mã khuyến mãi (FR-14) |
| 4 | Khách hàng | | Bấm **"Xác nhận thanh toán"** → UI gửi `POST /orders` kèm giỏ hàng và `Authorization: Bearer <JWT>` (FR-08, FR-09) |
| 5 | | **API** | `JwtAuthGuard` xác thực token → 401 nếu không hợp lệ (AC-08-1…2) |
| 6 | | **API** | `class-validator` kiểm tra body: `qty ≥ 1`, `productId` hợp lệ, `size ∈ {S,M,L}` → 400 nếu sai (AC-09-4) |
| 7 | | **API** | **Mở transaction**: tính lại giá từ DB, kiểm tra tồn kho, tạo `Order (PENDING)` + `OrderItem`, trừ `stock` với optimistic locking (FR-09, AC-09-5…9) |
| 8 | | **API** | Nếu thiếu tồn kho → rollback, trả **409** "Sản phẩm đã hết hàng" (AC-09-6) → §5.3 |
| 9 | | **API** | Nếu có mã khuyến mãi hợp lệ → tính `discount`, cập nhật `total`; không hợp lệ → giữ nguyên `total` và báo lý do (FR-14, AC-14-2) |
| 10 | | **API** | Commit transaction → trả **201** `{ id, code, status: "PENDING", total, items[] }` (AC-09-2) |
| 11 | Khách hàng | | UI hiển thị tổng tiền cuối cùng và nút xác nhận thanh toán (nếu chưa bấm ở bước 4, UI gộp bước 4–10) |
| 12 | Khách hàng | | Bấm **"Xác nhận thanh toán"** → UI tạo `Idempotency-Key` (UUID) và gửi `POST /payments` `{ orderId, method, amount }` + header `Idempotency-Key` (FR-10) |
| 13 | | **API** | `JwtAuthGuard` xác thực; kiểm tra `Payment.idempotencyKey` đã tồn tại chưa (AC-10-5) |
| 14 | | **API** | Nếu key đã tồn tại → trả lại **kết quả cũ** (200, `idempotent: true`), không tạo giao dịch mới (AC-10-5, NFR-03) |
| 15 | | **API** | Nếu đơn không thuộc user → 403; đơn không ở `PENDING` → 409 (AC-10-3, AC-10-4) |
| 16 | | **API** | Gọi **Payment Service (mô phỏng)** `POST /payment-gateway/charge` với `orderId`, `amount`, `method` |
| 17 | | **Payment Service** | Trả kết quả: **thành công** hoặc **thất bại** (mô phỏng ngẫu nhiên theo `PAYMENT_SUCCESS_RATE`, hoặc theo test cố định) |
| 18 | | **API** | Nếu **thành công**: tạo `Payment (SUCCESS)`, `assertTransition(PENDING → PAID)`, cộng `loyaltyPoints`, ghi `LoyaltyTransaction`, trả **200** `{ paymentId, status: "PAID", orderCode, loyaltyPointsEarned }` (AC-10-1, AC-13-2, AC-15-1…2) |
| 19 | | **API** | Nếu **thất bại**: tạo `Payment (FAILED)`, `assertTransition(PENDING → PAYMENT_FAILED)`, **không** cộng điểm, hoàn lại tồn kho, trả **402** `{ statusCode, message }` (AC-11-1, AC-15-3) → §5.4 |
| 20 | Khách hàng | | UI hiển thị màn hình **xác nhận đơn**: mã đơn `#1042`, trạng thái `PAID`, tổng tiền, phương thức thanh toán; xóa giỏ hàng; điều hướng `/orders/{code}` (FR-12, AC-12-1) |
| 21 | Khách hàng | | Người dùng có thể mở **Lịch sử đơn** (`GET /orders/me`) để xem lại đơn vừa đặt (FR-12, AC-12-2) |

---

## 5. Luồng thay thế (Alternative Flows)

### 5.1 A1 – Người dùng dừng giữa chừng và quay lại

| Bước | Mô tả |
|---|---|
| A1.1 | Người dùng đóng trình duyệt ở bước 12 (đã có đơn `PENDING`) |
| A1.2 | Giỏ hàng được khôi phục từ `localStorage` (AC-05-7); đơn `PENDING` vẫn nằm trong DB và hiển thị ở Lịch sử đơn với trạng thái `PENDING` |
| A1.3 | Người dùng có thể tiếp tục thanh toán đơn `PENDING` đó từ Lịch sử đơn, hoặc hủy đơn (`CANCELLED`) |

### 5.2 A2 – Chưa đăng nhập

| Bước | Mô tả |
|---|---|
| A2.1 | Tại bước 1, hệ thống phát hiện không có token hợp lệ |
| A2.2 | UI chuyển tới màn hình **Đăng nhập / Đăng ký**, lưu giỏ hàng hiện tại |
| A2.3 | Sau khi đăng nhập thành công (`POST /auth/login` → JWT), UI quay lại màn hình giỏ hàng với giỏ **không bị mất** |
| A2.4 | Luồng tiếp tục từ bước 2 |

*(Liên quan: FR-06, FR-07, AC-05-7, AC-07-1)*

### 5.3 A3 – Khuyến mãi không hợp lệ

| Bước | Mô tả |
|---|---|
| A3.1 | Tại bước 9, mã khuyến mãi không tồn tại / hết hạn / hết lượt / chưa đủ điều kiện |
| A3.2 | Hệ thống giữ nguyên `total` (không áp dụng giảm giá) và trả cảnh báo kèm **lý do cụ thể** |
| A3.3 | Người dùng có thể sửa hoặc xóa mã và tiếp tục thanh toán với giá gốc |

*(Liên quan: FR-14, AC-14-2)*

### 5.4 A4 – Thanh toán thành công nhưng client mất kết nối

| Bước | Mô tả |
|---|---|
| A4.1 | Server đã xử lý thanh toán thành công, nhưng response không tới được client (mạng lỗi) |
| A4.2 | Client tự động **retry** với **cùng `Idempotency-Key`** |
| A4.3 | Server nhận key đã tồn tại → trả lại kết quả lần trước (200, `idempotent: true`), không trừ tiền/điểm lần hai |
| A4.4 | Client hiển thị màn hình xác nhận đơn như bình thường |

*(Liên quan: FR-10, AC-10-5, NFR-03)*

### 5.5 A5 – Đơn được thanh toán bởi người khác (thiết bị dùng chung)

| Bước | Mô tả |
|---|---|
| A5.1 | Token không khớp `order.userId` |
| A5.2 | Hệ thống trả **403 Forbidden**, không tiết lộ thông tin đơn |

*(Liên quan: AC-10-3, AC-12-4)*

---

## 6. Luồng ngoại lệ (Exception Flows)

### 6.1 E1 – Giỏ hàng rỗng

| Bước | Mô tả |
|---|---|
| E1.1 | Tại bước 4, giỏ không có dòng nào |
| E1.2 | API trả **400 Bad Request** "Giỏ hàng đang trống"; không tạo đơn |

*(Liên quan: AC-09-1)*

### 6.2 E2 – Dữ liệu giỏ không hợp lệ

| Bước | Mô tả |
|---|---|
| E2.1 | Tại bước 6, có dòng `qty ≤ 0`, `size` không hợp lệ hoặc `productId` không tồn tại |
| E2.2 | API trả **400** kèm chi tiết lỗi theo từng field (class-validator) |
| E2.3 | Không ghi bản ghi nào vào DB |

*(Liên quan: AC-09-4)*

### 6.3 E3 – Sản phẩm hết hàng

| Bước | Mô tả |
|---|---|
| E3.1 | Tại bước 7, `stock` của một sản phẩm không đủ cho `qty` yêu cầu |
| E3.2 | Transaction **rollback** toàn bộ; API trả **409 Conflict** "Cà phê sữa đã hết hàng" |
| E3.3 | Tồn kho của các sản phẩm khác **không bị trừ** (atomic) |

*(Liên quan: AC-09-6, AC-09-9, NFR-03)*

### 6.4 E4 – Đặt đồng thời vượt tồn kho

| Bước | Mô tả |
|---|---|
| E4.1 | Nhiều request `POST /orders` cùng lúc cho cùng 1 sản phẩm |
| E4.2 | Optimistic locking (`version`) khiến các transaction bị xung đột bị rollback và retry |
| E4.3 | Kết quả: tổng số lượng bán ≤ tồn kho ban đầu; các request thất bại trả 409 |

*(Liên quan: AC-09-7, NFR-03)*

### 6.5 E5 – Token hết hạn / không hợp lệ

| Bước | Mô tả |
|---|---|
| E5.1 | Tại bước 5 hoặc 13, token thiếu/hỏng/hết hạn |
| E5.2 | API trả **401 Unauthorized** |
| E5.3 | UI chuyển về màn hình đăng nhập, giữ nguyên giỏ hàng |

*(Liên quan: AC-08-1…2, AC-07-4)*

### 6.6 E6 – Cổng thanh toán từ chối

| Bước | Mô tả |
|---|---|
| E6.1 | Tại bước 17, Payment Service trả kết quả **thất bại** (VD: cổng bị từ chối, timeout) |
| E6.2 | API tạo `Payment (FAILED)`, chuyển đơn `PENDING → PAYMENT_FAILED`, **không** cộng điểm, hoàn lại tồn kho |
| E6.3 | API trả **402 Payment Required** kèm lý do lỗi thân thiện (không lộ stack trace) |
| E6.4 | UI hiển thị thông báo lỗi và **giữ nguyên giỏ hàng**; hiển thị nút "Thử lại thanh toán" |

*(Liên quan: AC-11-1…4, AC-05-8, AC-15-3)*

### 6.7 E7 – Không kết nối được Payment Service

| Bước | Mô tả |
|---|---|
| E7.1 | Tại bước 16, không gọi được cổng thanh toán (timeout, 5xx) |
| E7.2 | Hệ thống ghi log lỗi, đơn ở `PAYMENT_FAILED`, trả **503 Service Unavailable** |
| E7.3 | Không cộng điểm, không tạo `Payment` thành công; giỏ hàng giữ nguyên |

*(Liên quan: AC-11-4, NFR-04)*

### 6.8 E8 – Thanh toán trùng do double-click

| Bước | Mô tả |
|---|---|
| E8.1 | Người dùng bấm nút xác nhận 2 lần, gửi 2 request **cùng `Idempotency-Key`** |
| E8.2 | Request thứ nhất tạo `Payment`; request thứ hai bị ràng buộc UNIQUE chặn và nhận kết quả cũ |
| E8.3 | Kết quả: đúng **1** bản ghi `Payment`, đúng **1** lần cộng điểm thưởng |

*(Liên quan: AC-10-5, AC-15-4)*

---

## 7. Bảng trạng thái liên quan

| Trạng thái | Ý nghĩa | Hành động tiếp theo được phép |
|---|---|---|
| `PENDING` | Đơn đã tạo, chưa thanh toán | `→ PAID`, `→ PAYMENT_FAILED`, `→ CANCELLED` |
| `PAID` | Thanh toán thành công | `→ PREPARING`, `→ CANCELLED` |
| `PAYMENT_FAILED` | Thanh toán thất bại | `→ PAID` (thử lại), `→ CANCELLED` |
| `PREPARING` | Barista đang pha | `→ READY` |
| `READY` | Đồ uống đã xong, chờ lấy | `→ COMPLETED` |
| `COMPLETED` | Hoàn tất (kết thúc) | — |
| `CANCELLED` | Đơn bị hủy (kết thúc) | — |

*(Xem sơ đồ máy trạng thái trong `docs/diagrams/class-domain.puml` và FR-13.)*

---

## 8. Liên kết truy vết

| Yêu cầu | Bước trong luồng | AC liên quan | Test (dự kiến Task 4–5) |
|---|---|---|---|
| FR-05 | 1, 4 | AC-05-1…8 | API-T02, UI-T05 |
| FR-08 | 4, 5, 12, 13 | AC-08-1…4 | API-T03 |
| FR-09 | 4, 6, 7, 8, 9, 10 | AC-09-1…9 | API-T04, INT-T01, INT-T05 |
| FR-10 | 2, 12, 13, 14, 16, 18 | AC-10-1…7 | API-T06, INT-T02, INT-T03 |
| FR-11 | 18, 19 | AC-11-1…4 | INT-T04 |
| FR-12 | 20, 21 | AC-12-1…5 | UI-T06, API-T07 |
| FR-13 | 18, 19 | AC-13-2, AC-13-5 | UNIT-T01 |
| FR-14 | 3, 9 | AC-14-1…4 | UNIT-T03, INT-T06 |
| FR-15 | 18 | AC-15-1…5 | UNIT-T04, INT-T07 |
| NFR-03 | 7, 13, 14 | AC-N03-1…4 | INT-T05, INT-T08 |

Danh sách test đầy đủ: [`../traceability-matrix.md`](../traceability-matrix.md)

---

## 9. Liên kết

- SRS (FR/NFR): [`srs.md`](./srs.md)
- Bối cảnh & phạm vi: [`context-and-scope.md`](./context-and-scope.md)
- Sơ đồ use-case: [`../diagrams/usecase-checkout.puml`](../diagrams/usecase-checkout.puml)
- Sơ đồ activity: [`../diagrams/activity-checkout.puml`](../diagrams/activity-checkout.puml)
- Sơ đồ sequence: [`../diagrams/sequence-checkout.puml`](../diagrams/sequence-checkout.puml)
