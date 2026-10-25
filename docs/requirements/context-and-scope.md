# BrewLite – Bối cảnh, Stakeholder và Phạm vi

|                |                                          |
| -------------- | ---------------------------------------- |
| **Tài liệu**   | `docs/requirements/context-and-scope.md` |
| **Phiên bản**  | 1.0                                      |
| **Task**       | Assignment 2 – Task 1.1                  |
| **Trạng thái** | Được duyệt (Sprint 1)                    |

---

## 1. Bối cảnh vấn đề nghiệp vụ

### 1.1 Vấn đề

Quán cà phê BrewLite là quán nhỏ với 1 quầy pha chế và 1–2 nhân viên trong khung giờ cao điểm
(07:30–09:00 và 13:00–14:30). Hiện trạng vận hành:

1. **Xếp hàng vật lý** – khách phải xếp hàng để gọi món, đặc biệt tệ vào giờ cao điểm; thời gian
   chờ trung bình ước tính 5–8 phút/chuyến.
2. **Ghi chép đơn thủ công** – nhân viên ghi tay tên món, size, topping vào sổ, dễ sai sót
   ("cà phê sữa" vs "cà phê sữa đá", số lượng topping sai).
3. **Thanh toán tiền mặt, lưu lượng tiền mặt lẫn lộn** – thu tiền mặt vào hộp, vào sổ sổ,
   khó đối soát cuối ngày và rủi ro thất thoát tiền mặt.
4. **Không có dữ liệu đơn hàng để ra quyết định** – chủ quán không biết món nào bán chạy,
   tỷ lệ khách quay lại, tỷ lệ khách từ bỏ giỏ hàng là bao nhiêu.
5. **Không có dấu hiệu trạng thái đơn** – khách không biết đơn của mình đang ở bước nào, dẫn đến
   hỏi lại nhân viên và chen vào quầy.

### 1.2 Product Vision

> "BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm,
> giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."

### 1.3 Giải pháp trong phạm vi Assignment

Ứng dụng web **mobile-first / PWA** cho phép khách: xem menu → chọn size/topping → thêm giỏ hàng
→ đăng nhập → đặt đơn → thanh toán không tiền mặt (Ví/Thẻ mô phỏng) → theo dõi trạng thái đơn.
Nhân viên vẫn ghi nhận đơn trên hệ thống quầy riêng (mở rộng), nhưng trong MVP hệ thống đóng vai
trò "kênh đặt trước" để giảm xếp hàng.

---

## 2. Bảng Stakeholder

| #     | Stakeholder                                              | Vai trò với hệ thống                                                                               | Mục tiêu / Kỳ vọng                                                                                                                         | Mức ảnh hưởng | Yêu cầu liên quan           |
| ----- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | --------------------------- |
| ST-01 | **Khách hàng** (Actor chính)                             | Người dùng cuối: xem menu, đặt món, thanh toán, theo dõi đơn                                       | Đặt món trong **< 60 giây**, không phải xếp hàng, biết rõ trạng thái đơn, thanh toán không tiền mặt, không mất giỏ hàng khi thanh toán lỗi | Cao           | FR-01…FR-11, NFR-01…NFR-04  |
| ST-02 | **Nhân viên quầy / Barista**                             | Tiếp nhận đơn đã trả tiền và cập nhật trạng thái pha chế                                           | Nhìn thấy đơn đúng size/topping, giảm lỗi ghi chép, cập nhật trạng thái nhanh                                                              | Trung bình    | FR-13 (phần mở rộng)        |
| ST-03 | **Quản lý cửa hàng / Product Owner**                     | Xác định yêu cầu, ưu tiên backlog, nghiệm thu Increment sau mỗi Sprint, cài đặt món/giá/khuyến mãi | Có báo cáo doanh thu & món bán chạy, kiểm soát giá và khuyến mãi, quyết định thứ tự backlog                                                | Cao           | FR-14, FR-15, FR-16, NFR-05 |
| ST-04 | **Giảng viên / Khách hàng nghiệm thu**                   | Đánh giá quy trình (Scrum, CI/CD), sản phẩm và mức đáp ứng tiêu chí chấp nhận                      | Tài liệu đầy đủ, truy vết được từ yêu cầu → test, pipeline CI/CD chạy thật, bàn giao tái lập được                                          | Cao           | Toàn bộ §4, §5              |
| ST-05 | **Nhóm phát triển (Dev Team)**                           | Phân tích, thiết kế, lập trình, kiểm thử, vận hành CI/CD                                           | Stack ổn định, môi trường local chạy được bằng 1 lệnh, tài liệu cập nhật, không phát sinh secret trong repo                                | Cao           | NFR-04…NFR-08               |
| ST-06 | **Đơn vị thanh toán** (mô phỏng: Momo/VNPay/Stripe mock) | Cung cấp cổng thanh toán Ví/Thẻ qua API                                                            | Nhận yêu cầu thanh toán idempotent, trả kết quả xác định, có idempotency key                                                               | Trung bình    | FR-10, FR-11, NFR-03        |

---

## 3. Phạm vi sản phẩm

### 3.1 Phạm vi trong MVP (In-scope)

| ID    | Hạng mục                 | Mô tả ngắn                                                                                 |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------ |
| IS-01 | Menu sản phẩm            | Xem danh sách đồ uống (tên, ảnh, giá, mô tả, còn hàng) – `GET /products`                   |
| IS-02 | Chi tiết sản phẩm        | Xem chi tiết 1 món – `GET /products/:id`                                                   |
| IS-03 | Tùy chọn sản phẩm        | Chọn size S/M/L và topping, giá cập nhật theo tùy chọn                                     |
| IS-04 | Giỏ hàng                 | Thêm / sửa số lượng / xóa, tự tính tổng tiền, badge số lượng                               |
| IS-05 | Xác thực                 | Đăng ký, đăng nhập, JWT, đăng xuất, bảo vệ route đặt đơn                                   |
| IS-06 | Đặt đơn                  | `POST /orders` (validate, transaction, trừ tồn kho, trả mã đơn)                            |
| IS-07 | Thanh toán               | `POST /payments` mô phỏng Ví/Thẻ, idempotent bằng `Idempotency-Key`                        |
| IS-08 | Xác nhận & lịch sử đơn   | Màn hình xác nhận (mã đơn, trạng thái), `GET /orders/me`                                   |
| IS-09 | Quản lý trạng thái đơn   | State machine PENDING → PAID → PREPARING → READY → COMPLETED (+ PAYMENT_FAILED, CANCELLED) |
| IS-10 | Khuyến mãi & điểm thưởng | Áp mã giảm giá hợp lệ, cộng loyalty points sau khi đơn PAID                                |
| IS-11 | PWA / mobile-first       | Responsive UI, manifest, service worker, có thể cài lên home screen                        |
| IS-12 | Hạ tầng vận hành         | Docker Compose (web + API + DB), `GET /health`, migration + seed, CI/CD                    |

### 3.2 Phạm vi mở rộng (Out-of-scope trong Assignment 2, giữ cho backlog sau)

| ID    | Hạng mục                                                     | Lý do hoãn                                                         |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| OS-01 | Màn hình quản lý của Barista (tiếp nhận đơn, đổi trạng thái) | A1 §3.2 nêu rõ nằm ngoài phạm vi MVP; cần thêm thiết bị quầy riêng |
| OS-02 | Báo cáo doanh thu / dashboard quản lý                        | Cần dữ liệu lịch sử tích luỹ đủ lớn và vai trò phân quyền          |
| OS-03 | Tích hợp cổng thanh toán thật (Momo/VNPay/Stripe API thật)   | Bài nói rõ chỉ dùng mock payment service                           |
| OS-04 | Đặt bàn, đặt lịch, giao hàng                                 | Ngoài luồng MVP "xem menu → thanh toán"                            |
| OS-05 | Chat với barista, đánh giá món, đề xuất món                  | Tính năng tăng trải nghiệm, không cốt lõi                          |
| OS-06 | Quản trị menu/khuyến mãi qua UI (admin panel)                | Trong MVP khuyến mãi được cấu hình bằng seed/migration             |
| OS-07 | Đa chi nhánh, đa ngôn ngữ, dark mode                         | Mở rộng về sau                                                     |

### 3.3 Nội dung không thực hiện (ngoài phạm vi dự án)

- Xử lý đơn tiền thật, xuất hóa đơn VAT, kế toán tài chính.
- Tích hợp đơn vị vận chuyển, ship COD.
- Quản lý nhân sự, chấm công, tính lương.
- Phân tích hành vi người dùng nâng cao (recommendation engine).
- Bảo đảm tuân thủ PCI-DSS thật (chỉ mô phỏng).

---

## 4. Giả định, Ràng buộc và Rủi ro ban đầu

### 4.1 Giả định (Assumptions)

| ID   | Giả định                                                                                     | Nếu sai thì ảnh hưởng                                                |
| ---- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| A-01 | Khách hàng sở hữu smartphone và có kết nối Internet khi đặt món                              | Nếu không, cần kênh offline/kiosk → tăng phạm vi                     |
| A-02 | Hệ thống thanh toán chỉ cần **mô phỏng** trong phạm vi bài tập                               | Nếu cần thật → cần tài khoản merchant, hợp đồng, PCI (ngoài phạm vi) |
| A-03 | Nhân viên quầy sẽ dùng một thiết bị riêng hoặc tài khoản quản trị để cập nhật trạng thái đơn | Nếu không có thiết bị → cần màn hình quầy riêng (OS-01)              |
| A-04 | Dữ liệu món, giá và topping do nhóm seed sẵn và cập nhật qua migration                       | Nếu cần admin UI → thêm phạm vi                                      |
| A-05 | Không yêu cầu xác thực 2 lớp hay xác minh OTP thực cho bài tập                               | Nếu cần → thêm provider OTP, tăng NFR bảo mật                        |
| A-06 | Hạ tầng triển khai dùng dịch vụ PaaS có sẵn Postgres miễn phí (Render)                       | Nếu đổi nền tảng → cập nhật ADR-006 và deployment diagram            |
| A-07 | Nhóm phát triển gồm 3–5 thành viên, phát triển song song nhưng merge qua PR                  | Nếu nhóm nhỏ hơn → giảm số nhánh, tăng rủi ro merge conflict         |
| A-08 | Giá lưu dưới dạng số nguyên VND (hoặc Decimal) để tránh lỗi làm tròn số thực                 | Nếu dùng Float → lỗi làm tròn tổng tiền                              |

### 4.2 Ràng buộc (Constraints)

| ID   | Ràng buộc                                                                                                                             | Nguồn          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| C-01 | Bắt buộc dùng **Next.js** (frontend), **NestJS** (backend), **PostgreSQL** (CSDL), **Docker** (đóng gói)                              | Đề bài A2 §1.1 |
| C-02 | Phải có CI chạy `Install → Lint → Unit Test → Build` khi mở Pull Request; PR không được merge nếu pipeline fail                       | Đề bài A2 §6.4 |
| C-03 | Phải có CD: build image tag theo commit SHA/semver, push registry, deploy production, chạy migration an toàn, smoke test, có rollback | Đề bài A2 §7.3 |
| C-04 | Phải có **URL production truy cập được qua HTTPS** + URL API + health check; DB production không public trực tiếp                     | Đề bài A2 §7.4 |
| C-05 | Secret **không** được xuất hiện trong repository hoặc log CI                                                                          | Đề bài A2 §7.4 |
| C-06 | Thời gian phản hồi API **< 500 ms** với dữ liệu mẫu                                                                                   | Đề bài A1 §4.2 |
| C-07 | Phải có unit test, integration test cho tạo đơn/thanh toán, ít nhất 1 E2E test menu → xác nhận đơn                                    | Đề bài A2 §7.2 |
| C-08 | Thực hiện 5 task theo **đúng thứ tự**, tạo phẩm của task trước phải có trên kho mã nguồn kèm lịch sử thay đổi rõ ràng                 | Đề bài A2 §1   |
| C-09 | Stack bắt buộc: Next.js + NestJS + PostgreSQL + Docker; không thay thế các thành phần này                                             | Đề bài A2 §1.1 |
| C-10 | Mô hình lớp tối thiểu: User, Product, Order, OrderItem, Payment, Promotion, LoyaltyTransaction                                        | Đề bài A2 §4.3 |

### 4.3 Rủi ro ban đầu (Initial Risks)

| ID   | Rủi ro                                                                          | Xác suất   | Tác động   | Mức        | Biện pháp giảm thiểu                                                                                     |
| ---- | ------------------------------------------------------------------------------- | ---------- | ---------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| R-01 | Đặt đồng thời vượt tồn kho (overselling)                                        | Cao        | Cao        | **Cao**    | Transaction + optimistic locking (`version`) + kiểm thử đồng thời (A1 Task 10)                           |
| R-02 | Thanh toán bị trừ tiền/đặt đơn 2 lần do người dùng double-click hoặc retry mạng | Cao        | Cao        | **Cao**    | `Idempotency-Key` + unique constraint ở DB + trả lại kết quả cũ                                          |
| R-03 | Rò rỉ secret (DB password, JWT secret) vào repo hoặc log CI                     | Trung bình | Cao        | **Cao**    | `.gitignore` + `.env.example`, secret trong CI/CD Settings, `prisma migrate deploy` dùng biến môi trường |
| R-04 | Pipeline CI chạy lâu (>10 phút) làm giảm tần suất merge                         | Trung bình | Thấp       | Trung bình | Cache npm, chạy lint/test song song, matrix test                                                         |
| R-05 | Frontend không build được trong CI vì khác biệt môi trường/Node version         | Trung bình | Trung bình | Trung bình | Ghim `node:20-alpine`, `engines` trong package.json, cache `~/.npm`                                      |
| R-06 | Deploy production thất bại giữa chừng, DB ở trạng thái nửa cũ nửa mới           | Trung bình | Cao        | Cao        | Migration chỉ **additive**, chạy `migrate deploy` trước khi cắt traffic, rollback bằng image tag trước   |
| R-07 | Phạm vi tăng trưởng (thêm màn hình quản trị, thanh toán thật) làm trễ deadline  | Cao        | Trung bình | **Cao**    | Danh sách out-of-scope đã chốt §3.2; mọi đề xuất mới vào backlog Sprint sau                              |
| R-08 | Tài liệu lệch với code khi refactor                                             | Trung bình | Trung bình | Trung bình | Ma trận truy vết cập nhật trong mỗi PR; CI check tồn tại endpoint                                        |
| R-09 | Hết hạn quota DB PaaS (free tier) làm sập production                            | Trung bình | Cao        | Trung bình | Chọn nền tảng có free tier ổn định, ghi rõ giới hạn, có kịch bản migrate dữ liệu ra ngoài                |
| R-10 | Nhóm thiếu thiết bị/điều kiện deploy                                            | Thấp       | Cao        | Thấp       | Dùng PaaS miễn phí; không phụ thuộc thẻ tín dụng                                                         |

### 4.4 Rủi ro nghiệp vụ cần xác nhận với PO

- Xác nhận **ngưỡng cảnh báo hết hàng** (ví dụ `stock < 5` → hiển thị "sắp hết").
- Xác nhận quy tắc **điểm thưởng**: 1 điểm = 1.000đ hay tỷ lệ khác; điểm có hạn dùng không.
- Xác nhận **cách giảm giá**: mã giảm giá theo %, theo số tiền hay theo tặng món.

---

## 5. Liên kết

- Yêu cầu chi tiết (FR/NFR, MoSCoW, tiêu chí chấp nhận): [`srs.md`](./srs.md)
- Đặc tả use-case trọng tâm: [`use-case-checkout.md`](./use-case-checkout.md)
- Ma trận truy vết: [`../traceability-matrix.md`](../traceability-matrix.md)
- Kiến trúc & ADR: [`../architecture/architecture.md`](../architecture/architecture.md)
