# BrewLite – Tài liệu yêu cầu phần mềm (SRS rút gọn)

|                        |                                                  |
| ---------------------- | ------------------------------------------------ |
| **Tài liệu**           | `docs/requirements/srs.md`                       |
| **Phiên bản**          | 1.0                                              |
| **Task**               | Assignment 2 – Task 1.2                          |
| **Trạng thái**         | Được duyệt (Sprint 1)                            |
| **Bối cảnh & phạm vi** | [`context-and-scope.md`](./context-and-scope.md) |

---

## 0. Quy ước

### 0.1 Mã định danh

| Tiền tố  | Ý nghĩa                                            | Ví dụ     |
| -------- | -------------------------------------------------- | --------- |
| `FR-xx`  | Functional Requirement – yêu cầu chức năng         | `FR-05`   |
| `NFR-xx` | Non-Functional Requirement – yêu cầu phi chức năng | `NFR-01`  |
| `UC-xx`  | Use-case                                           | `UC-01`   |
| `US-xx`  | User Story                                         | `US-01`   |
| `AC-xx`  | Acceptance Criteria (tiêu chí chấp nhận)           | `AC-05-1` |
| `ST-xx`  | Stakeholder                                        | `ST-01`   |

### 0.2 Thang ưu tiên MoSCoW

| Mức        | Ý nghĩa                                     | Xử lý khi thiếu thời gian               |
| ---------- | ------------------------------------------- | --------------------------------------- |
| **Must**   | Bắt buộc có để MVP hợp lệ                   | Không cắt; phải làm trước               |
| **Should** | Rất quan trọng, cắt được nếu bị ép deadline | Cắt sau, ghi vào backlog Sprint kế tiếp |
| **Could**  | Có thì tốt, không có cũng chạy              | Cắt được ngay                           |
| **Won't**  | Ngoài phạm vi lần này                       | Xem §3.2 `context-and-scope.md`         |

### 0.3 Quy ước tiêu chí chấp nhận

Mỗi AC phải **kiểm chứng được** bằng test tự động hoặc kiểm tra thủ công có tiêu chí rõ ràng.
Ký hiệu: `(T)` = kiểm thử tự động, `(M)` = kiểm tra thủ công.

---

## 1. Yêu cầu chức năng

### 1.1 FR-01 – Xem danh sách sản phẩm (Menu)

|                 |                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stakeholder** | ST-01                                                                                                                                                                                      |
| **Ưu tiên**     | **Must**                                                                                                                                                                                   |
| **Endpoint**    | `GET /products`                                                                                                                                                                            |
| **Mô tả**       | Hệ thống trả về danh sách đồ uống gồm `id`, `name`, `description`, `price`, `imageUrl`, `category`, `isAvailable`, `stock`, `sizes`, `toppings`. Hỗ trợ phân trang và lọc theo `category`. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                                 | Kiểm chứng           |
| ------- | -------------------------------------------------------------------------------------------------------- | -------------------- |
| AC-01-1 | `GET /products` trả HTTP 200 với mảng JSON, mỗi phần tử có đủ `id`, `name`, `price` (số ≥ 0), `imageUrl` | (T) Integration test |
| AC-01-2 | Mỗi sản phẩm có ít nhất 1 size hợp lệ trong `sizes[]` và danh sách `toppings[]`                          | (T) Unit test        |
| AC-01-3 | Trang menu hiển thị lưới sản phẩm trên màn hình 360px không tràn ngang                                   | (M) Responsive check |
| AC-01-4 | Có trạng thái **loading** (skeleton/spinner) và **empty** ("Chưa có món nào") khi API trả mảng rỗng      | (T) Component test   |
| AC-01-5 | Có trạng thái **error** khi API lỗi, kèm nút "Thử lại" gọi lại API                                       | (T) Component test   |
| AC-01-6 | Sản phẩm hết hàng (`stock = 0`) hiển thị nhãn "Hết hàng" và không bấm được nút thêm vào giỏ              | (T) Component test   |

---

### 1.2 FR-02 – Xem chi tiết sản phẩm

|                 |                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                                                                            |
| **Ưu tiên**     | **Must**                                                                                                         |
| **Endpoint**    | `GET /products/:id`                                                                                              |
| **Mô tả**       | Trả chi tiết một sản phẩm kèm bảng giá theo size và giá của từng topping, để người dùng chọn trước khi thêm giỏ. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                                             | Kiểm chứng           |
| ------- | -------------------------------------------------------------------------------------------------------------------- | -------------------- |
| AC-02-1 | `GET /products/:id` với id hợp lệ trả 200 kèm đầy đủ thông tin sản phẩm và options                                   | (T) Integration test |
| AC-02-2 | `GET /products/:id` với id không tồn tại trả HTTP 404 với thông báo lỗi có cấu trúc `{ statusCode, message, error }` | (T) Integration test |
| AC-02-3 | `GET /products/:id` với id không phải số trả HTTP 400 (validation)                                                   | (T) Integration test |
| AC-02-4 | Màn hình chi tiết hiển thị ảnh, tên, mô tả, giá, nhóm size và nhóm topping                                           | (M) UI check         |

---

### 1.3 FR-03 – Lọc menu theo danh mục

|                 |                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                                                             |
| **Ưu tiên**     | **Could**                                                                                         |
| **Endpoint**    | `GET /products?category=coffee`                                                                   |
| **Mô tả**       | Người dùng lọc menu theo danh mục (Cà phê, Trà, Sữa, Đá xay…). Thanh nhóm danh mục trên đầu menu. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                         | Kiểm chứng           |
| ------- | -------------------------------------------------------------------------------- | -------------------- |
| AC-03-1 | `GET /products?category=<c>` chỉ trả sản phẩm thuộc danh mục `<c>`               | (T) Integration test |
| AC-03-2 | `GET /products?category=<không tồn tại>` trả mảng rỗng (200), không phải lỗi 500 | (T) Integration test |
| AC-03-3 | Chọn danh mục trên UI cập nhật danh sách mà không tải lại trang                  | (T) Component test   |

---

### 1.4 FR-04 – Chọn size và topping, tính giá theo tùy chọn

|                 |                                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                                                                                                                                                    |
| **Ưu tiên**     | **Must**                                                                                                                                                                                 |
| **Mô tả**       | Người dùng chọn đúng 1 size (S/M/L) và 0–n topping. Giá hiển thị cập nhật tức thì theo công thức: `unitPrice = basePrice + sizeDelta + Σ(topping.price)`; `lineTotal = unitPrice × qty`. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                             | Kiểm chứng              |
| ------- | ------------------------------------------------------------------------------------ | ----------------------- |
| AC-04-1 | Chưa chọn size thì nút "Thêm vào giỏ" bị disable và hiện thông báo yêu cầu chọn size | (T) Component test      |
| AC-04-2 | Giá hiển thị cập nhật đúng công thức khi đổi size hoặc bật/tắt topping               | (T) Unit test logic giá |
| AC-04-3 | Tổng tiền trên màn hình chi tiết = `unitPrice × qty`, là số nguyên VND               | (T) Unit test           |
| AC-04-4 | Tối đa 3 topping mỗi món; chọn vượt giới hạn bị chặn kèm thông báo                   | (T) Component test      |
| AC-04-5 | Server **không** tin giá do client gửi; giá luôn được tính lại từ DB khi tạo đơn     | (T) Integration test    |

---

### 1.5 FR-05 – Giỏ hàng

|                 |                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                                                                                                                               |
| **Ưu tiên**     | **Must**                                                                                                                                                            |
| **Mô tả**       | Người dùng thêm / sửa số lượng / xóa sản phẩm trong giỏ. Tổng tiền được hệ thống tự tính. Giỏ hàng được lưu cục bộ (`localStorage`) để không mất khi tải lại trang. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                | Kiểm chứng                     |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------ |
| AC-05-1 | Thêm cùng 1 sản phẩm với **cùng size và topping** sẽ tăng số lượng thay vì tạo dòng mới | (T) Unit test                  |
| AC-05-2 | Thêm cùng 1 sản phẩm với **khác size/topping** tạo dòng giỏ riêng                       | (T) Unit test                  |
| AC-05-3 | Sửa số lượng cập nhật `lineTotal` và `total` tức thì                                    | (T) Unit test                  |
| AC-05-4 | Xóa dòng giỏ làm `total` giảm tương ứng; xóa dòng cuối → giỏ rỗng, hiển thị empty state | (T) Unit test + Component test |
| AC-05-5 | Số lượng phải là số nguyên ≥ 1; nhập 0 / âm / ký tự không phải số bị chặn               | (T) Component test             |
| AC-05-6 | Badge trên icon giỏ hiển thị tổng số lượng sản phẩm, ẩn khi giỏ rỗng                    | (T) Component test             |
| AC-05-7 | Tải lại trang: giỏ hàng được khôi phục từ `localStorage`                                | (T) Component test             |
| AC-05-8 | Khi thanh toán lỗi, giỏ hàng **giữ nguyên** (không bị xóa)                              | (T) Component test             |

---

### 1.6 FR-06 – Đăng ký tài khoản

|                 |                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                                                                                        |
| **Ưu tiên**     | **Must**                                                                                                                     |
| **Endpoint**    | `POST /auth/register`                                                                                                        |
| **Mô tả**       | Người dùng tạo tài khoản bằng email + mật khẩu. Mật khẩu được băm bằng bcrypt (cost ≥ 10), không bao giờ lưu dạng plaintext. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                      | Kiểm chứng           |
| ------- | --------------------------------------------------------------------------------------------- | -------------------- |
| AC-06-1 | Đăng ký hợp lệ trả 201, tạo user, `loyaltyPoints = 0`                                         | (T) Integration test |
| AC-06-2 | Email trùng trả 409 kèm message tiếng Việt rõ ràng, không lộ stack trace                      | (T) Integration test |
| AC-06-3 | Email sai định dạng → 400; mật khẩu < 6 ký tự → 400; thiếu trường → 400                       | (T) Integration test |
| AC-06-4 | DB lưu `passwordHash` dạng bcrypt (regex `^\$2[aby]\$\d{2}\$.{53}$`), **không** lưu plaintext | (T) Integration test |
| AC-06-5 | Response không chứa `passwordHash`                                                            | (T) Integration test |

---

### 1.7 FR-07 – Đăng nhập và phát hành JWT

|                 |                                                                     |
| --------------- | ------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                               |
| **Ưu tiên**     | **Must**                                                            |
| **Endpoint**    | `POST /auth/login`                                                  |
| **Mô tả**       | Xác thực email/mật khẩu, trả JWT kèm `sub`, `email`, `role`, `exp`. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                           | Kiểm chứng           |
| ------- | -------------------------------------------------------------------------------------------------- | -------------------- |
| AC-07-1 | Đăng nhập đúng trả 200 + `accessToken` có payload `sub`, `email`, `exp` và hạn ≥ 1h                | (T) Integration test |
| AC-07-2 | Mật khẩu sai trả 401, message chung "Email hoặc mật khẩu không đúng" (không tiết lộ email tồn tại) | (T) Integration test |
| AC-07-3 | Email không tồn tại trả 401 với **cùng** message như trường hợp mật khẩu sai                       | (T) Integration test |
| AC-07-4 | Token hết hạn trả 401 khi gọi endpoint được bảo vệ                                                 | (T) Integration test |

---

### 1.8 FR-08 – Bảo vệ endpoint bằng JWT Guard

|                 |                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Stakeholder** | ST-01, ST-05                                                                                                                   |
| **Ưu tiên**     | **Must**                                                                                                                       |
| **Mô tả**       | Các endpoint nghiệp vụ (đặt đơn, thanh toán, lịch sử đơn, cập nhật trạng thái) yêu cầu `Authorization: Bearer <token>` hợp lệ. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                      | Kiểm chứng           |
| ------- | ----------------------------------------------------------------------------- | -------------------- |
| AC-08-1 | Không có header → 401                                                         | (T) Integration test |
| AC-08-2 | Token sai định dạng / hỏng / hết hạn → 401                                    | (T) Integration test |
| AC-08-3 | Token hợp lệ → request được xử lý; dữ liệu trả về chỉ thuộc về user của token | (T) Integration test |
| AC-08-4 | `GET /orders/me` của user A không chứa đơn của user B                         | (T) Integration test |

---

### 1.9 FR-09 – Tạo đơn hàng

|                 |                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                                                                                                                                                                   |
| **Ưu tiên**     | **Must**                                                                                                                                                                                                |
| **Endpoint**    | `POST /orders`                                                                                                                                                                                          |
| **Mô tả**       | Tạo đơn từ giỏ hàng. Hệ thống tính lại giá từ DB, kiểm tra tồn kho, tạo `Order` (status `PENDING`) + `OrderItem` trong **một transaction**, trừ tồn kho, áp khuyến mãi nếu có. Trả mã đơn và tổng tiền. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                                             | Kiểm chứng                     |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| AC-09-1 | Giỏ rỗng → 400, không tạo đơn                                                                                        | (T) Integration test           |
| AC-09-2 | Đơn hợp lệ → 201, trả `id`, `code` (mã đơn dạng `#1042`), `status = PENDING`, `total` đúng                           | (T) Integration test           |
| AC-09-3 | Thiếu token → 401; token hợp lệ → tạo đơn thuộc đúng user đó                                                         | (T) Integration test           |
| AC-09-4 | Payload thiếu/r sai kiểu (qty ≤ 0, productId không hợp lệ) → 400                                                     | (T) Integration test           |
| AC-09-5 | Server tính lại giá từ DB, bỏ qua `price` do client gửi lên                                                          | (T) Integration test           |
| AC-09-6 | Thiếu tồn kho → 409 với message "hết hàng", **không** tạo đơn và **không** trừ kho                                   | (T) Integration test           |
| AC-09-7 | Khi đặt đồng thời vượt tồn kho, tổng số lượng bán ≤ tồn kho ban đầu (kiểm tra bằng transaction + optimistic locking) | (T) Integration test đồng thời |
| AC-09-8 | `stock` bị trừ đúng bằng tổng qty của các dòng đơn vừa tạo                                                           | (T) Integration test           |
| AC-09-9 | Nếu một dòng trong giỏ không hợp lệ, **không** dòng nào được ghi (rollback toàn bộ transaction)                      | (T) Integration test           |

---

### 1.10 FR-10 – Thanh toán không tiền mặt (Ví/Thẻ mô phỏng)

|                 |                                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01, ST-06                                                                                                                                                  |
| **Ưu tiên**     | **Must**                                                                                                                                                      |
| **Endpoint**    | `POST /payments`                                                                                                                                              |
| **Mô tả**       | Thanh toán cho một đơn `PENDING` qua cổng mô phỏng (Ví điện tử / Thẻ ngân hàng). Hỗ trợ `Idempotency-Key` để gọi lại cùng yêu cầu không tạo thanh toán trùng. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                                                                                     | Kiểm chứng           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| AC-10-1 | Thanh toán thành công → đơn chuyển `PENDING → PAID`, tạo bản ghi `Payment` với `amount`, `method`, `status = SUCCESS`                                        | (T) Integration test |
| AC-10-2 | `method` chỉ nhận giá trị hợp lệ (`WALLET`, `CARD`); giá trị khác → 400                                                                                      | (T) Integration test |
| AC-10-3 | Thanh toán cho đơn không thuộc user → 403                                                                                                                    | (T) Integration test |
| AC-10-4 | Thanh toán cho đơn không ở `PENDING` → 409, không tạo `Payment` mới                                                                                          | (T) Integration test |
| AC-10-5 | Gửi **2 lần cùng `Idempotency-Key`** → chỉ có 1 bản ghi `Payment` và 1 lần trừ điểm thưởng; lần thứ 2 trả lại kết quả lần đầu (HTTP 200, `idempotent: true`) | (T) Integration test |
| AC-10-6 | `Idempotency-Key` khác nhau trên cùng 1 đơn đã `PAID` → 409 (không thanh toán 2 lần)                                                                         | (T) Integration test |
| AC-10-7 | `amount` thanh toán phải bằng `order.total`; lệch → 400                                                                                                      | (T) Integration test |

---

### 1.11 FR-11 – Xử lý thanh toán thất bại

|                 |                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                                                                                        |
| **Ưu tiên**     | **Must**                                                                                                                     |
| **Mô tả**       | Khi cổng thanh toán từ chối, đơn chuyển `PENDING → PAYMENT_FAILED`, ghi nhận lý do, giữ nguyên giỏ hàng và cho phép thử lại. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                   | Kiểm chứng                      |
| ------- | -------------------------------------------------------------------------- | ------------------------------- |
| AC-11-1 | Cổng trả lỗi → đơn ở `PAYMENT_FAILED`, tạo `Payment` với `status = FAILED` | (T) Integration test (mock lỗi) |
| AC-11-2 | UI hiển thị thông báo lỗi và giữ nguyên nội dung giỏ hàng                  | (T) Component test              |
| AC-11-3 | Từ `PAYMENT_FAILED` có thể thử lại thanh toán → `PAID`                     | (T) Integration test            |
| AC-11-4 | Lỗi không làm lộ stack trace hay thông tin nhạy cảm ra response            | (T) Integration test            |

---

### 1.12 FR-12 – Xác nhận đơn và lịch sử đơn

|                 |                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01                                                                                                                                                     |
| **Ưu tiên**     | **Must**                                                                                                                                                  |
| **Endpoint**    | `GET /orders/me`, `GET /orders/:id`                                                                                                                       |
| **Mô tả**       | Sau khi thanh toán thành công, hiển thị màn hình xác nhận (mã đơn, trạng thái, tổng tiền, phương thức thanh toán). Người dùng xem lại toàn bộ đơn đã đặt. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                                 | Kiểm chứng           |
| ------- | -------------------------------------------------------------------------------------------------------- | -------------------- |
| AC-12-1 | Màn hình xác nhận hiển thị mã đơn (`#1042`), trạng thái `PAID`, tổng tiền, phương thức thanh toán        | (T) Component test   |
| AC-12-2 | `GET /orders/me` trả danh sách đơn của user, **mới nhất trước**, kèm mã đơn, tổng, trạng thái, thời gian | (T) Integration test |
| AC-12-3 | `GET /orders/me` không chứa đơn của user khác                                                            | (T) Integration test |
| AC-12-4 | `GET /orders/:id` của đơn không thuộc user → 403/404, không lộ thông tin                                 | (T) Integration test |
| AC-12-5 | Danh sách rỗng → empty state "Bạn chưa có đơn nào" + nút xem menu                                        | (T) Component test   |

---

### 1.13 FR-13 – Quản lý trạng thái đơn (State Machine)

|                 |                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-02, ST-03                                                                                                                                                        |
| **Ưu tiên**     | **Must**                                                                                                                                                            |
| **Mô tả**       | Trạng thái đơn đi theo máy trạng thái: `PENDING → PAID → PREPARING → READY → COMPLETED`. Nhánh ngoại lệ: `PENDING → PAYMENT_FAILED → (thử lại) → PAID`, và `PENDING | PAID → CANCELLED`. `COMPLETED`và`CANCELLED` là trạng thái kết thúc. Mọi chuyển trạng thái không hợp lệ bị chặn. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                                             | Kiểm chứng                  |
| ------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| AC-13-1 | `assertTransition` chấp nhận đúng các cặp hợp lệ nêu trên và **từ chối** mọi cặp còn lại (bằng lỗi domain, HTTP 409) | (T) Unit test (bảng đầy đủ) |
| AC-13-2 | `PENDING → PAID` chỉ xảy ra sau khi có `Payment` thành công                                                          | (T) Integration test        |
| AC-13-3 | Chuyển sang trạng thái kết thúc (`COMPLETED`, `CANCELLED`) lần nữa bị từ chối                                        | (T) Unit test               |
| AC-13-4 | Lịch sử chuyển trạng thái được ghi lại (actor, from, to, thời gian)                                                  | (T) Integration test        |
| AC-13-5 | `PAYMENT_FAILED` có thể thử lại → `PAID`                                                                             | (T) Integration test        |

---

### 1.14 FR-14 – Khuyến mãi (Promotion)

|                 |                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Stakeholder** | ST-03                                                                                                                          |
| **Ưu tiên**     | **Should**                                                                                                                     |
| **Mô tả**       | Người dùng nhập mã khuyến mãi ở bước thanh toán. Hệ thống kiểm tra hiệu lực, hạn dùng, giá trị đơn tối thiểu và tính giảm giá. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                                             | Kiểm chứng           |
| ------- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| AC-14-1 | Mã hợp lệ → `discount` được áp dụng, `total` giảm đúng số tiền quy định                              | (T) Integration test |
| AC-14-2 | Mã không tồn tại / hết hạn / hết lượt dùng / chưa đủ điều kiện → báo rõ lý do, `total` **không** đổi | (T) Integration test |
| AC-14-3 | Không dùng 2 mã khuyến mãi cho 1 đơn                                                                 | (T) Integration test |
| AC-14-4 | `total` sau khuyến mãi không bao giờ âm (tối thiểu 0đ)                                               | (T) Unit test        |

---

### 1.15 FR-15 – Điểm thưởng (Loyalty)

|                 |                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-01, ST-03                                                                                                               |
| **Ưu tiên**     | **Should**                                                                                                                 |
| **Mô tả**       | Sau khi đơn chuyển `PAID`, khách tích lũy điểm thưởng. Giao dịch điểm được ghi thành `LoyaltyTransaction` có thể truy vết. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                       | Kiểm chứng           |
| ------- | ------------------------------------------------------------------------------ | -------------------- |
| AC-15-1 | Đơn `PAID` cộng điểm = `floor(order.total / 1000)` vào `user.loyaltyPoints`    | (T) Integration test |
| AC-15-2 | Ghi 1 dòng `LoyaltyTransaction` loại `EARN` với số điểm và `orderId` tương ứng | (T) Integration test |
| AC-15-3 | Thanh toán lỗi hoặc đơn bị hủy → **không** cộng điểm                           | (T) Integration test |
| AC-15-4 | Thanh toán idempotent lặp lại → **không** cộng điểm 2 lần                      | (T) Integration test |
| AC-15-5 | Điểm hiển thị được trên hồ sơ cá nhân của user                                 | (M) UI check         |

---

### 1.16 FR-16 – Seed dữ liệu mẫu và migration

|                 |                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Stakeholder** | ST-03, ST-05                                                                                                                              |
| **Ưu tiên**     | **Must**                                                                                                                                  |
| **Mô tả**       | Có migration Prisma đầy đủ và seed tạo sẵn menu, topping, size, khuyến mãi và tài khoản demo, để môi trường mới tái tạo được bằng 1 lệnh. |

**Tiêu chí chấp nhận**

| ID      | Tiêu chí                                                                            | Kiểm chứng          |
| ------- | ----------------------------------------------------------------------------------- | ------------------- |
| AC-16-1 | `prisma migrate deploy` trên DB rỗng tạo đủ bảng theo schema                        | (T) Script kiểm thử |
| AC-16-2 | `prisma db seed` tạo ≥ 8 sản phẩm, 3 size, ≥ 4 topping, ≥ 1 khuyến mãi, 1 user demo | (T) Script kiểm thử |
| AC-16-3 | Seed chạy lại 2 lần không sinh dữ liệu trùng (idempotent)                           | (T) Script kiểm thử |

---

## 2. Yêu cầu phi chức năng

### 2.1 NFR-01 – Hiệu năng

|                 |              |
| --------------- | ------------ |
| **Stakeholder** | ST-01, ST-05 |
| **Ưu tiên**     | **Must**     |

**Tiêu chí chấp nhận**

| ID       | Tiêu chí                                                                                                | Kiểm chứng           |
| -------- | ------------------------------------------------------------------------------------------------------- | -------------------- |
| AC-N01-1 | `GET /products` phản hồi **< 500 ms** (p95) với dữ liệu mẫu (≥ 8 sản phẩm), đo trên môi trường local/CI | (T) Benchmark script |
| AC-N01-2 | `GET /products/:id` phản hồi < 500 ms (p95)                                                             | (T) Benchmark script |
| AC-N01-3 | `POST /orders` + `POST /payments` hoàn tất < 2 s (p95) với dữ liệu mẫu                                  | (T) Benchmark script |
| AC-N01-4 | Trang menu hiển thị nội dung trong ≤ 3 giây trên mạng 4G mô phỏng                                       | (M) Lighthouse       |

---

### 2.2 NFR-02 – Bảo mật

|                 |                     |
| --------------- | ------------------- |
| **Stakeholder** | ST-01, ST-04, ST-05 |
| **Ưu tiên**     | **Must**            |

**Tiêu chí chấp nhận**

| ID       | Tiêu chí                                                                                                                               | Kiểm chứng                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-N02-1 | Mọi mật khẩu được băm bcrypt cost ≥ 10; không endpoint nào trả về `passwordHash`                                                       | (T) Unit/Integration test              |
| AC-N02-2 | JWT ký bằng `JWT_SECRET`; token được kiểm tra chữ ký + `exp`; secret đọc từ biến môi trường, **không** hardcode                        | (M) Rà soát mã nguồn                   |
| AC-N02-3 | Secret (`DATABASE_URL`, `JWT_SECRET`, `POSTGRES_PASSWORD`) **không** xuất hiện trong repository (`.gitignore` chặn `.env`) hoặc log CI | (M) `git grep` + kiểm tra log pipeline |
| AC-N02-4 | Production dùng HTTPS; `POSTGRES_PASSWORD` trong CI/CD lưu dạng **Secret**, không lộ trong log                                         | (M) Kiểm tra cấu hình CI               |
| AC-N02-5 | Endpoint `/orders`, `/payments`, `/orders/me` trả 401 khi không có token hợp lệ                                                        | (T) Integration test                   |

---

### 2.3 NFR-03 – Tính nhất quán giao dịch & idempotency

|                 |              |
| --------------- | ------------ |
| **Stakeholder** | ST-01, ST-06 |
| **Ưu tiên**     | **Must**     |

**Tiêu chí chấp nhận**

| ID       | Tiêu chí                                                                                          | Kiểm chứng                             |
| -------- | ------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-N03-1 | Tạo đơn + trừ kho thực hiện trong 1 transaction DB; lỗi bất kỳ → rollback toàn bộ                 | (T) Integration test                   |
| AC-N03-2 | Dùng optimistic locking (`version`) chặn cập nhật tồn kho trên bản ghi đã bị sửa                  | (T) Integration test                   |
| AC-N03-3 | `POST /payments` bắt buộc `Idempotency-Key`; DB có ràng buộc UNIQUE trên `Payment.idempotencyKey` | (T) Integration test + kiểm tra schema |
| AC-N03-4 | Gửi lại cùng key → không tạo bản ghi mới, không trừ/cộng điểm lần hai                             | (T) Integration test                   |

---

### 2.4 NFR-04 – Tính khả dụng & khả năng phục hồi

|                 |              |
| --------------- | ------------ |
| **Stakeholder** | ST-01, ST-05 |
| **Ưu tiên**     | **Must**     |

**Tiêu chí chấp nhận**

| ID       | Tiêu chí                                                                                                      | Kiểm chứng                                |
| -------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| AC-N04-1 | Có `GET /health` trả 200 kèm trạng thái DB; dùng làm health check của container                               | (T) Integration test + kiểm tra container |
| AC-N04-2 | Pipeline CD chạy smoke test sau khi deploy; deploy fail → pipeline đỏ, không cắt traffic                      | (M) Log pipeline                          |
| AC-N04-3 | Có tài liệu và lệnh rollback (deploy lại image tag trước đó)                                                  | (M) Kiểm tra `docs/deployment.md`         |
| AC-N04-4 | Lỗi ở một bước không làm sập toàn bộ luồng (VD: lỗi thanh toán → giữ giỏ hàng, vẫn xem được menu/lịch sử đơn) | (T) Component test                        |

---

### 2.5 NFR-05 – Khả năng triển khai

|                 |              |
| --------------- | ------------ |
| **Stakeholder** | ST-04, ST-05 |
| **Ưu tiên**     | **Must**     |

**Tiêu chí chấp nhận**

| ID       | Tiêu chí                                                                                         | Kiểm chứng                     |
| -------- | ------------------------------------------------------------------------------------------------ | ------------------------------ |
| AC-N05-1 | `docker compose up` chạy được web + API + Postgres với 1 lệnh, dùng biến môi trường trong `.env` | (M) Chạy thử                   |
| AC-N05-2 | Có `.env.example` mô tả đủ biến cần thiết                                                        | (M) Kiểm tra file              |
| AC-N05-3 | Image Docker được gắn tag theo commit SHA hoặc semver                                            | (M) Log pipeline               |
| AC-N05-4 | Có URL frontend production qua HTTPS, URL API và URL health check công khai trong README         | (M) Kiểm tra truy cập          |
| AC-N05-5 | Database production không public trực tiếp (chỉ truy cập nội bộ từ API container)                | (M) Kiểm tra cấu hình nền tảng |

---

### 2.6 NFR-06 – Tương thích trình duyệt & trải nghiệm mobile-first / PWA

|                 |            |
| --------------- | ---------- |
| **Stakeholder** | ST-01      |
| **Ưu tiên**     | **Should** |

**Tiêu chí chấp nhận**

| ID       | Tiêu chí                                                                       | Kiểm chứng               |
| -------- | ------------------------------------------------------------------------------ | ------------------------ |
| AC-N06-1 | Hoạt động trên Chrome, Edge, Firefox, Safari (desktop) và Chrome/Safari mobile | (M) Kiểm tra trình duyệt |
| AC-N06-2 | Layout dùng được ở 360×640, 390×844, 768×1024, 1440×900; không cuộn ngang      | (M) Responsive check     |
| AC-N06-3 | Có `manifest.webmanifest` và service worker đăng ký; Lighthouse PWA score ≥ 90 | (M) Lighthouse           |
| AC-N06-4 | Các nút tương tác có vùng chạm ≥ 44×44 px                                      | (M) UI check             |

---

### 2.7 NFR-07 – Khả năng kiểm thử

|                 |              |
| --------------- | ------------ |
| **Stakeholder** | ST-04, ST-05 |
| **Ưu tiên**     | **Must**     |

**Tiêu chí chấp nhận**

| ID       | Tiêu chí                                                                                      | Kiểm chứng       |
| -------- | --------------------------------------------------------------------------------------------- | ---------------- |
| AC-N07-1 | Unit test cho nghiệp vụ quan trọng: state machine, tính giá, idempotency, khuyến mãi, loyalty | (T) Báo cáo test |
| AC-N07-2 | Integration test cho `POST /orders` và `POST /payments` (gồm ca lỗi)                          | (T) Báo cáo test |
| AC-N07-3 | Có ít nhất 1 E2E test đi từ menu → xác nhận đơn                                               | (T) Báo cáo test |
| AC-N07-4 | Lint và build phải pass trước khi merge (CI quality gate)                                     | (M) Log pipeline |

---

### 2.8 NFR-08 – Khả năng bảo trì & mở rộng

|                 |              |
| --------------- | ------------ |
| **Stakeholder** | ST-03, ST-05 |
| **Ưu tiên**     | **Should**   |

**Tiêu chí chấp nhận**

| ID       | Tiêu chí                                                                                 | Kiểm chứng                                 |
| -------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| AC-N08-1 | Backend chia module theo nghiệp vụ (`products`, `auth`, `orders`, `payments`, `loyalty`) | (M) Rà soát cấu trúc                       |
| AC-N08-2 | Mỗi quyết định kiến trúc quan trọng có 1 ADR trong `docs/architecture/adr/`              | (M) Kiểm tra thư mục                       |
| AC-N08-3 | Có ma trận truy vết FR → use-case → sơ đồ → API → test                                   | (M) Kiểm tra `docs/traceability-matrix.md` |
| AC-N08-4 | Logging có cấu trúc (JSON) kèm `requestId` để truy vết lỗi                               | (M) Rà soát log mẫu                        |
| AC-N08-5 | API có versioning (`/api/v1/...`) để không phá vỡ client cũ                              | (M) Rà soát mã nguồn                       |

---

## 3. Tóm tắt ưu tiên MoSCoW

| Mức        | Yêu cầu                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Must**   | FR-01, FR-02, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-16, NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-07 |
| **Should** | FR-14, FR-15, NFR-06, NFR-08                                                                                                              |
| **Could**  | FR-03                                                                                                                                     |
| **Won't**  | Xem §3.2 của [`context-and-scope.md`](./context-and-scope.md) (màn hình barista, thanh toán thật, báo cáo, đa chi nhánh…)                 |

---

## 4. Sơ đồ use-case tổng quát

Nguồn: [`../diagrams/usecase-overview.puml`](../diagrams/usecase-overview.puml) · Bản ảnh: [`../diagrams/usecase-overview.svg`](../diagrams/usecase-overview.svg)

<!-- Được sinh tự động từ file .puml bằng PlantUML -->

| Actor            | Use-case liên quan                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Khách hàng       | Xem menu (UC-01), Xem chi tiết sản phẩm (UC-02), Chọn size/topping (UC-03), Quản lý giỏ hàng (UC-04), Đăng ký/Đăng nhập (UC-05), Đặt đơn (UC-06), Thanh toán (UC-07), Xem lịch sử đơn (UC-08) |
| Nhân viên quầy   | Cập nhật trạng thái đơn (UC-09) — _ngoài phạm vi MVP, đã ghi nhận trong backlog mở rộng_                                                                                                      |
| Quản lý cửa hàng | Quản lý menu & khuyến mãi (UC-10) — _ngoài phạm vi MVP_                                                                                                                                       |

---

## 5. Liên kết

- Đặc tả chi tiết UC-07 "Đặt và thanh toán đơn hàng": [`use-case-checkout.md`](./use-case-checkout.md)
- Ma trận truy vết: [`../traceability-matrix.md`](../traceability-matrix.md)
- Sơ đồ activity/sequence/class: [`../diagrams/`](../diagrams/)
