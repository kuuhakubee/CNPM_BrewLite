# BrewLite – Ma trận truy vết (Traceability Matrix)

| | |
|---|---|
| **Tài liệu** | `docs/traceability-matrix.md` |
| **Task** | Assignment 2 – §8 Truy vết |
| **Trạng thái** | Sống – cập nhật trong mỗi PR khi có yêu cầu/sơ đồ/code/test thay đổi |
| **Quy tắc** | Task sau chỉ được tính điểm phần truy vết khi task trước đã có tạo phẩm tương ứng trên kho mã nguồn. |

---

## 1. Giải thích ký hiệu

| Cột | Ý nghĩa | Nguồn |
|---|---|---|
| **Mã yêu cầu** | FR-xx / NFR-xx từ [`requirements/srs.md`](requirements/srs.md) | Task 1.2 |
| **Use-case / User Story** | UC-xx ([`use-case-checkout.md`](requirements/use-case-checkout.md), `usecase-overview`) / US-xx | Task 1.3, 1.2 |
| **Thiết kế / Sơ đồ** | Activity-xx, Sequence-xx, Class-xx, Deployment-xx trong [`diagrams/`](diagrams/) | Task 2, 3.2 |
| **Code / API** | Endpoint hoặc module chịu trách nhiệm trong `apps/api`, `apps/web` | Task 4, 5 |
| **Test** | Mã test; tiền tố = loại test (xem §2) | Task 4.3, 5.2 |

**Tiền tố loại test**

| Tiền tố | Loại | Vị trí (dự kiến) |
|---|---|---|
| `UNIT-Txx` | Unit test nghiệp vụ thuần (state machine, tính giá, khuyến mãi, loyalty) | `apps/api/src/**/*.spec.ts` |
| `API-Txx` | API/component test từng endpoint hoặc component UI | `apps/api/test/api/*.e2e-spec.ts`, `apps/web/**/*.test.tsx` |
| `INT-Txx` | Integration test (transaction, idempotency, concurrency) | `apps/api/test/integration/*.int-spec.ts` |
| `E2E-Txx` | End-to-end test menu → xác nhận đơn | `tests/e2e/*.spec.ts` (Playwright) |

**Trạng thái**: ✅ đã có · 🚧 đang làm · ⬜ chưa bắt đầu. Test đánh dấu ⬜ là *dự kiến* — điền mã thật khi hiện thực (Task 4.3 / 5.2).

---

## 2. Truy vết bắt buộc – Yêu cầu chức năng (FR)

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code / API | Test | Trạng thái |
|---|---|---|---|---|---|
| **FR-01** Xem menu | UC-01, US-01 | Activity-01, Sequence-01 (§1), Class-01 | `GET /api/v1/products` — `apps/api/src/modules/products` | API-T01, API-T04 | ⬜ |
| **FR-02** Chi tiết sản phẩm | UC-02, US-02 | Activity-01, Sequence-01 (§2), Class-01 | `GET /api/v1/products/:id` — `modules/products` | API-T02, API-T05 | ⬜ |
| **FR-03** Lọc theo danh mục | UC-01 | Activity-01 | `GET /api/v1/products?category=` | API-T03 | ⬜ |
| **FR-04** Size/topping & tính giá | UC-03, US-04 | Activity-01, Sequence-01 (§2), Class-01 (`ProductSize`, `Topping`) | `modules/products` (options) + `apps/web` (price calc) | UNIT-T02, API-T06 | ⬜ |
| **FR-05** Giỏ hàng | UC-04, US-05 | Activity-01, Sequence-01 (§2) | `apps/web` cart store (Zustand + localStorage) | UNIT-T05, API-T07 | ⬜ |
| **FR-06** Đăng ký | UC-05, US-07 | Activity-03, Sequence-01 (§3), Class-01 (`User`) | `POST /api/v1/auth/register` — `modules/auth` | API-T08 | ⬜ |
| **FR-07** Đăng nhập / JWT | UC-05, US-07 | Activity-03, Sequence-01 (§3) | `POST /api/v1/auth/login` — `modules/auth` | API-T09 | ⬜ |
| **FR-08** Guard JWT | UC-05, UC-07 | Sequence-01 (§3, §4, §5) | `JwtAuthGuard` — `modules/auth` | API-T10, INT-T09 | ⬜ |
| **FR-09** Tạo đơn hàng | UC-06, US-06 | Activity-02, Sequence-01 (§4), Class-01 (`Order`, `OrderItem`) | `POST /api/v1/orders` — `modules/orders` | INT-T01, INT-T05 | ⬜ |
| **FR-10** Thanh toán Ví/Thẻ | UC-07, US-08 | Activity-02, Sequence-01 (§5), Class-01 (`Payment`) | `POST /api/v1/payments` + `payment-gateway/charge` — `modules/payments` | INT-T02, INT-T03 | ⬜ |
| **FR-11** Thanh toán thất bại | UC-07 (E6/E7), US-08 | Activity-02, Sequence-01 (§5 – nhánh FAILED) | `modules/payments` (failure + stock restore) | INT-T04 | ⬜ |
| **FR-12** Xác nhận & lịch sử đơn | UC-08, US-09 | Activity-04, Sequence-01 (§6), Class-01 (`Order`) | `GET /api/v1/orders/me`, `GET /api/v1/orders/:id` | API-T11, API-T12, E2E-T01 | ⬜ |
| **FR-13** State machine đơn | UC-07, US-10 | Class-01 (`OrderStatus`, `assertTransition`), Activity-02 | `modules/orders` (`assertTransition`, `OrderStatusHistory`) | UNIT-T01, INT-T10 | ⬜ |
| **FR-14** Khuyến mãi | UC-07 (A3), US-10 | Sequence-01 (§4), Class-01 (`Promotion`) | `POST /api/v1/promotions/validate` — `modules/promotions` | UNIT-T03, INT-T06 | ⬜ |
| **FR-15** Điểm thưởng | UC-07, US-10 | Sequence-01 (§5), Class-01 (`LoyaltyTransaction`) | `modules/loyalty` | UNIT-T04, INT-T07 | ⬜ |
| **FR-16** Seed & migration | UC-00 (hạ tầng) | Class-01 (toàn bộ schema) | `apps/api/prisma/migrations`, `prisma/seed.ts` | INT-T11 | ⬜ |

---

## 3. Truy vết – Yêu cầu phi chức năng (NFR)

| Mã yêu cầu | Thiết kế / Sơ đồ | Code / API | Test / Bằng chứng | Trạng thái |
|---|---|---|---|---|
| **NFR-01** Hiệu năng < 500ms | Architecture §7 | `GET /health`, caching | Benchmark script | ⬜ |
| **NFR-02** Bảo mật | ADR-003, Deployment-01 (secret) | `JwtStrategy`, bcrypt, env schema | API-T13, INT-T09 + kiểm tra `.gitignore` | ⬜ |
| **NFR-03** Transaction & idempotency | ADR-004, Sequence-01 (§4, §5) | `modules/orders` ($transaction), `Payment.idempotencyKey` UNIQUE | INT-T05, INT-T08 | ⬜ |
| **NFR-04** Khả dụng & phục hồi | ADR-006, Deployment-01 | `GET /health`, CD smoke test | INT-T12 + log pipeline | ⬜ |
| **NFR-05** Khả năng triển khai | ADR-005, ADR-006, Deployment-01 | `docker-compose.yml`, `Dockerfile`, `.env.example` | `docker compose up` + log pipeline | 🚧 |
| **NFR-06** Mobile-first / PWA | Architecture §8, Container-01 | `apps/web` (manifest, SW, Tailwind) | API-T14 + Lighthouse | ⬜ |
| **NFR-07** Khả năng kiểm thử | Architecture §4.1 | `*.spec.ts`, `test/`, `tests/e2e/` | Báo cáo test CI | ⬜ |
| **NFR-08** Bảo trì & mở rộng | Architecture §4, ADR-001 | Module NestJS theo nghiệp vụ, ADR 001–006 | Kiểm tra cấu trúc + ma trận này | 🚧 |

---

## 4. Truy vết theo Diagram (Diagram → Yêu cầu → Code)

| Diagram | File | Yêu cầu liên quan | Code liên quan |
|---|---|---|---|
| **Activity-01** Menu → Checkout end-to-end | [`diagrams/activity-checkout.puml`](diagrams/activity-checkout.puml) | FR-01…FR-12 | `apps/web`, `modules/orders`, `modules/payments` |
| **Activity-02** Tạo đơn + thanh toán | [`diagrams/activity-checkout.puml`](diagrams/activity-checkout.puml) | FR-09, FR-10, FR-11, FR-13 | `modules/orders`, `modules/payments` |
| **Activity-03** Đăng nhập | [`diagrams/activity-checkout.puml`](diagrams/activity-checkout.puml) | FR-06, FR-07, FR-08 | `modules/auth` |
| **Activity-04** Theo dõi đơn | [`diagrams/activity-checkout.puml`](diagrams/activity-checkout.puml) | FR-12 | `modules/orders` |
| **Sequence-01** UC-07 checkout | [`diagrams/sequence-checkout.puml`](diagrams/sequence-checkout.puml) | FR-05, FR-08…FR-12, NFR-03 | `modules/orders`, `modules/payments`, `apps/web` |
| **Class-01** Domain model | [`diagrams/class-domain.puml`](diagrams/class-domain.puml) | FR-01…FR-16, NFR-03 | `apps/api/prisma/schema.prisma` |
| **UseCase-00** Tổng quát | [`diagrams/usecase-overview.puml`](diagrams/usecase-overview.puml) | Toàn bộ FR | Toàn bộ `apps/` |
| **UseCase-07** Checkout | [`diagrams/usecase-checkout.puml`](diagrams/usecase-checkout.puml) | FR-05, FR-08…FR-15 | `modules/orders`, `modules/payments` |
| **Context-01** C4 L1 | [`diagrams/context.puml`](diagrams/context.puml) | C-01, C-09 | — |
| **Container-01** C4 L2 | [`diagrams/container.puml`](diagrams/container.puml) | NFR-05, NFR-08 | `docker-compose.yml`, `Dockerfile` |
| **Deployment-01** Production | [`diagrams/deployment-production.puml`](diagrams/deployment-production.puml) | C-04, NFR-02, NFR-04, NFR-05 | `docker-compose.yml`, CI/CD (Task 5.3), [`deployment.md`](deployment.md) |

---

## 5. Truy vết theo Cấu trúc Nghiệp vụ (Business Rule → Yêu cầu → Test)

Ba nghiệp vụ bắt buộc của A1 Task 10 được truy vết như sau:

| Nghiệp vụ | Nguồn yêu cầu | Thiết kế | Code | Test bắt buộc | Trạng thái |
|---|---|---|---|---|---|
| **(a) Chặn chuyển trạng thái sai** | FR-13, AC-13-1 | Class-01 (`assertTransition`), Activity-02 | `modules/orders` (`assertTransition`) | UNIT-T01, INT-T10 | ⬜ |
| **(b) 1 Idempotency-Key → 1 thanh toán** | FR-10, AC-10-5, NFR-03 | ADR-004 §2, Sequence-01 (§5) | `modules/payments` (`Payment.idempotencyKey` UNIQUE) | INT-T03, INT-T08 | ⬜ |
| **(c) Đặt đồng thời không vượt tồn kho** | FR-09, AC-09-7, NFR-03 | ADR-004 §3 (optimistic locking `Product.version`) | `modules/orders` (`updateMany` + version) | INT-T05 | ⬜ |

---

## 6. Truy ngược (Code → Yêu cầu) – kiểm tra không có code thừa / không có yêu cầu mồ côi

| Module / Thành phần | Yêu cầu phục vụ | Ghi chú |
|---|---|---|
| `apps/api/src/main.ts` | C-01, NFR-05 | Bootstrap, global prefix, CORS, ValidationPipe |
| `modules/health` | NFR-04 | `GET /health` |
| `modules/products` | FR-01, FR-02, FR-03, FR-04 | Menu & chi tiết |
| `modules/auth` | FR-06, FR-07, FR-08, NFR-02 | JWT, bcrypt |
| `modules/orders` | FR-09, FR-12, FR-13, NFR-03 | Transaction, state machine |
| `modules/payments` | FR-10, FR-11, NFR-03 | Idempotency, mock gateway |
| `modules/promotions` | FR-14 | Khuyến mãi |
| `modules/loyalty` | FR-15 | Điểm thưởng |
| `apps/web` (menu, cart, checkout, auth, orders) | FR-01…FR-12, NFR-06 | Next.js PWA |
| `docker-compose.yml` | NFR-05, C-01 | Local: web + api + db |
| `.github/workflows/` | C-02, C-03, NFR-07 | CI/CD (Task 4.4, 5.3) |

> Không có module nào phục vụ ngoài danh sách FR/NFR → không có "code thừa".
> Mọi FR/NFR Must đều truy về được ít nhất 1 module hoặc thành phần hạ tầng → không có "yêu cầu mồ côi".

---

## 7. Nhật ký cập nhật

| Ngày | Phiên bản | Người | Nội dung thay đổi | Lý do |
|---|---|---|---|---|
| Sprint 1 | 1.0 | Nhóm | Khởi tạo ma trận từ SRS, use-case và sơ đồ Task 1–3 | Yêu cầu §8 |
