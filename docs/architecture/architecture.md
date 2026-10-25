# BrewLite – Mô tả kiến trúc phần mềm

| | |
|---|---|
| **Tài liệu** | `docs/architecture/architecture.md` |
| **Phiên bản** | 1.0 |
| **Task** | Assignment 2 – Task 3.1 |
| **Phương pháp** | C4 (Context → Container → Component) kết hợp kiến trúc phân lớp (Layered) |
| **ADR liên quan** | [ADR-001](adr/001-monorepo.md) · [ADR-002](adr/002-backend-nestjs-prisma-postgresql.md) · [ADR-003](adr/003-authentication-jwt.md) · [ADR-004](adr/004-payment-idempotency-and-stock-locking.md) · [ADR-005](adr/005-docker-compose-and-cicd.md) · [ADR-006](adr/006-deployment-platform-render.md) |

---

## 1. Tổng quan

BrewLite là ứng dụng đặt đồ uống không tiền mặt, gồm ba thành phần bắt buộc (C-01):

- **Frontend**: Next.js (App Router) theo hướng mobile-first / PWA
- **Backend**: NestJS (REST API), tổ chức theo module nghiệp vụ
- **CSDL**: PostgreSQL 15, truy cập qua Prisma ORM
- **Đóng gói & vận hành**: Docker, Docker Compose (local), GitHub Actions (CI/CD), Render (production)

Hệ thống là **kiến trúc phân lớp 3 tầng** ở phía backend (Controller → Service → Repository/Prisma),
với ranh giới rõ ràng giữa:

1. **Tầng trình bày** (Next.js UI) — chịu trách nhiệm render, quản lý state giỏ hàng phía client, gọi REST API.
2. **Tầng ứng dụng** (NestJS) — chứa toàn bộ nghiệp vụ, kiểm tra dữ liệu, xác thực, giao dịch.
3. **Tầng hạ tầng** (PostgreSQL + Payment Gateway) — lưu trữ và tích hợp hệ thống bên ngoài.

Frontend **không** chứa logic nghiệp vụ (giá, trạng thái đơn, quy tắc khuyến mãi) — mọi quyết định
được server tính lại (AC-09-5). Frontend chỉ giữ state hiển thị và giỏ hàng tạm.

---

## 2. C4 – Level 1: System Context

```
        ┌──────────────┐        HTTPS        ┌───────────────────────────────┐
        │  Khách hàng  │ ───────────────────► │                               │
        │  (Browser /  │                      │        Hệ thống BrewLite      │
        │   PWA)       │ ◄─────────────────── │                               │
        └──────────────┘   JSON / REST        └───────────────────────────────┘
                                                     │
              ┌──────────────────────────────────────┼──────────────────────┐
              │ (nội bộ, HTTPS)                      │                      │
      ┌───────▼────────┐                  ┌──────────▼─────────┐   ┌────────▼────────┐
      │ Cổng thanh toán│                  │  Hệ thống quản lý │   │ Hệ thống thanh  │
      │ (mock)         │                  │  tồn kho / menu    │   │ toán ngoài       │
      └────────────────┘                  └────────────────────┘   └─────────────────┘
```

**Bên trong ranh giới hệ thống** (cần tự xây dựng): Next.js, NestJS API, PostgreSQL, Mock Payment
Service. **Bên ngoài**: người dùng và cổng thanh toán (mô phỏng trong phạm vi bài tập).

---

## 3. C4 – Level 2: Container

| Container | Công nghệ | Trách nhiệm | Cổng | Giao tiếp |
|---|---|---|---|---|
| **Web App** | Next.js 20 (App Router), React, TailwindCSS, Zustand | Menu, chi tiết sản phẩm, giỏ hàng, đăng nhập, checkout, lịch sử đơn; PWA manifest + service worker | `$PORT` (Render cấp) | `GET/POST /api/v1/*` qua HTTPS |
| **REST API** | NestJS 10, TypeScript, class-validator, Passport JWT | Nghiệp vụ: menu, giỏ→đơn, thanh toán, trạng thái đơn, khuyến mãi, loyalty, health | `$PORT` (Render cấp) | REST/JSON |
| **Database** | PostgreSQL 15 (Prisma ORM) | Lưu User, Product, Order, OrderItem, Payment, Promotion, LoyaltyTransaction; migration + seed | 5432 (internal) | Prisma client / SQL |
| **Mock Payment Service** | Module NestJS (`payments/gateway`) | Mô phỏng cổng Ví/Thẻ: nhận `charge`, trả `SUCCESS`/`FAILED` | nội bộ | `POST /api/v1/payment-gateway/charge` |
| **CI/CD** | GitHub Actions | Lint, test, build, đóng gói image, push registry, deploy, smoke test | – | – |
| **Container Registry** | Docker Hub | Lưu image theo tag commit SHA | 443 | Docker Registry API |

Sơ đồ: [`../diagrams/container.puml`](../diagrams/container.puml) ·
[`../diagrams/container.svg`](../diagrams/container.svg)

---

## 4. C4 – Level 3: Component (Backend NestJS)

```text
apps/api/src/
├── main.ts                    # Bootstrap, global prefix /api/v1, CORS, ValidationPipe
├── app.module.ts              # Gom module
├── config/
│   └── configuration.ts       # Đọc & validate biến môi trường (env schema)
├── common/
│   ├── filters/               # ExceptionFilter → response lỗi thống nhất
│   ├── interceptors/          # LoggingInterceptor (requestId, log JSON)
│   └── dto/                   # DTO dùng chung
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts      # PrismaClient wrapper
├── modules/
│   ├── health/                # GET /health
│   ├── products/              # Controller → Service → Prisma
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── dto/
│   ├── auth/                  # register, login, JwtStrategy, JwtAuthGuard
│   ├── orders/                # tạo đơn (transaction), state machine, lịch sử đơn
│   ├── payments/              # thanh toán idempotent + mock gateway
│   ├── promotions/            # áp dụng & kiểm tra khuyến mãi
│   └── loyalty/               # cộng/trừ điểm, ghi LoyaltyTransaction
└── ...test/                   # unit test đặt cạnh module
```

### 4.1 Phân lớp trong mỗi module

| Tầng | Trách nhiệm | Quy tắc |
|---|---|---|
| **Controller** (`*.controller.ts`) | HTTP: routing, `@Body`/`@Query`/`@Param`, `@UseGuards`, trả DTO | Không chứa logic nghiệp vụ, không truy cập Prisma trực tiếp |
| **Service** (`*.service.ts`) | Toàn bộ nghiệp vụ, transaction, gọi service khác | Nhận entity/DTO đã chuẩn hóa, trả kết quả hoặc ném lỗi domain |
| **Repository / Prisma** | Truy cập dữ liệu | Chỉ nằm trong `*.service.ts` qua `PrismaService` (giảm thay đổi khi đổi ORM) |

### 4.2 Các module và API endpoint

| Method | Endpoint | Module | Auth | FR |
|---|---|---|---|---|
| GET | `/health` | health | – | NFR-04 |
| GET | `/api/v1/products` | products | – | FR-01, FR-03 |
| GET | `/api/v1/products/:id` | products | – | FR-02 |
| POST | `/api/v1/auth/register` | auth | – | FR-06 |
| POST | `/api/v1/auth/login` | auth | – | FR-07 |
| POST | `/api/v1/orders` | orders | JWT | FR-09 |
| GET | `/api/v1/orders/me` | orders | JWT | FR-12 |
| GET | `/api/v1/orders/:id` | orders | JWT | FR-12 |
| PATCH | `/api/v1/orders/:id/status` | orders | JWT (role) | FR-13 |
| POST | `/api/v1/payments` | payments | JWT | FR-10, FR-11 |
| POST | `/api/v1/payment-gateway/charge` | payments (mock) | – | FR-10 |
| POST | `/api/v1/promotions/validate` | promotions | JWT | FR-14 |

---

## 5. Quản lý dữ liệu và migration

- **Schema**: `apps/api/prisma/schema.prisma` — nguồn sự thật duy nhất cho mô hình dữ liệu.
- **Migration**: `prisma/migrations/*` do Prisma sinh, commit vào repo, áp dụng bằng `prisma migrate deploy`
  (idempotent, an toàn chạy lại).
- **Seed**: `prisma/seed.ts` — tạo menu mẫu (≥ 8 sản phẩm), 3 size, ≥ 4 topping, ≥ 1 khuyến mãi,
  1 user demo. Chạy lại nhiều lần không sinh dữ liệu trùng (AC-16-3).
- **Tiền tệ**: `Decimal(12,2)`; **trạng thái**: Prisma `enum`; **khóa idempotency**: UNIQUE.
- **Đồng thời**: `Product.version` (optimistic locking) — xem [ADR-004](adr/004-payment-idempotency-and-stock-locking.md).

---

## 6. Dịch vụ thanh toán mô phỏng

- Interface `PaymentGateway` (`charge(input): Promise<PaymentResult>`) với `MockPaymentGateway`.
- Xác suất thành công cấu hình bằng `PAYMENT_SUCCESS_RATE`; trong `NODE_ENV=test` dùng kết quả
  **deterministic** để test ổn định.
- Lý do chọn mô phỏng: xem [ADR-004](adr/004-payment-idempotency-and-stock-locking.md) §1.

---

## 7. Logging, Health check và Quản lý cấu hình

| Nội dung | Thiết kế |
|---|---|
| **Logging** | `LoggingInterceptor` ghi log JSON ra stdout: `timestamp`, `level`, `requestId`, `method`, `url`, `statusCode`, `durationMs`, `userId`. Container thu stdout → Render log stream. |
| **Error handling** | `ExceptionFilter` toàn cục → response `{ statusCode, message, error, path, timestamp, requestId }`; không lộ stack trace ra ngoài (AC-11-4). |
| **Health check** | `GET /health` → `{ status: 'ok', database: 'up', uptime, timestamp }`; dùng làm *Health Check Path* của Render và smoke test của pipeline CD. |
| **Cấu hình** | `ConfigModule` đọc biến môi trường, có **env schema** validate lúc khởi động → fail fast nếu thiếu `JWT_SECRET`/`DATABASE_URL`. Biến môi trường được mô tả trong `.env.example`; giá trị thật nằm ở `.env` (local) và Render/GitHub Secrets (CI/production). |
| **Secret** | Không hardcode, không commit. Xem [ADR-006](adr/006-deployment-platform-render.md). |

---

## 8. Frontend – Next.js mobile-first / PWA

| Khía cạnh | Thiết kế |
|---|---|
| **Rendering** | App Router; trang menu dùng **Server Component** để SEO/tốc độ, phần giỏ hàng & checkout dùng **Client Component**. |
| **State giỏ hàng** | **Zustand** + persist middleware vào `localStorage` (FR-05, AC-05-7). |
| **Fetch dữ liệu** | TanStack Query (hoặc fetch wrapper) cho cache/invalidate; trạng thái loading / empty / error rõ ràng (AC-01-4/5). |
| **Styling** | TailwindCSS, thiết kế mobile-first, breakpoint ≥ 768px mở rộng lên desktop. |
| **PWA** | `manifest.webmanifest` + service worker cache tài nguyên tĩnh → có thể cài lên home screen, hỗ trợ offline ở mức cơ bản (AC-N06-3). |
| **Auth** | Access token lưu trong `localStorage`, gắn vào header `Authorization`; interceptor tự đăng nhập lại khi gặp 401 (nếu có refresh token trong phiên bản sau). |
| **Thanh toán** | Sinh `Idempotency-Key` UUID **một lần mỗi lần bấm xác nhận** và tái sử dụng khi retry (ADR-004). |

---

## 9. Kiến trúc triển khai

- Sơ đồ: [`../diagrams/deployment-production.puml`](../diagrams/deployment-production.puml) ·
  [`../diagrams/deployment-production.svg`](../diagrams/deployment-production.svg)
- Hướng dẫn vận hành: [`../deployment.md`](../deployment.md)
- Nền tảng thực tế: **Render** (2 Web Service + 1 PostgreSQL managed) — [ADR-006](adr/006-deployment-platform-render.md)

| Môi trường | Mục đích | Cách chạy | Cơ sở dữ liệu |
|---|---|---|---|
| **Local** | Phát triển | `docker compose up` | Container PostgreSQL, volume `postgres_data` |
| **CI** | Kiểm thử & build | GitHub Actions | PostgreSQL service container, tạo/huỷ mỗi job |
| **Production** | Bàn giao | Render Web Service | Render managed Postgres, internal URL, persistent disk |

---

## 10. Đánh đổi kiến trúc (Trade-off)

| Quyết định | Ưu điểm | Nhược điểm | Đánh giá |
|---|---|---|---|
| **Monorepo** (ADR-001) | Tài liệu & code đồng bộ, 1 pipeline, đúng cấu trúc đề bài | Repo lớn dần, PR có thể chậm | ✅ Được chấp nhận |
| **Prisma ORM** (ADR-002) | Type-safe, migration sinh tự động, UNIQUE constraint cho idempotency | Query engine nặng hơn, `Decimal` cần ép kiểu | ✅ Được chấp nhận |
| **JWT thay vì session** (ADR-003) | Stateless, đúng đề bài yêu cầu | Không thu hồi được token ngay; token trong `localStorage` | ⚠️ Chấp nhận rủi ro, giới hạn TTL 1h |
| **Mock payment gateway** (ADR-004) | Demo độc lập, không cần tài khoản merchant | Không mô phỏng 3DS/webhook/refund | ✅ Đúng phạm vi bài tập |
| **Optimistic locking** (ADR-004) | Không giữ lock, an toàn khi tranh chấp | Trả 409 thay vì retry tự động | ⚠️ Có thể thêm retry backoff sau |
| **Optimistic UI không** (chờ server) | Không lệch trạng thái với server, đơn giản hơn | Cảm giác chậm hơn trên mạng yếu | ✅ Ổn với NFR-01 (<500ms) |
| **Render PaaS** (ADR-006) | HTTPS tự động, Postgres có sẵn, deploy qua API | Cold start free tier, giới hạn quota | ✅ Nhanh nhất để có URL production |
| **Không dùng refresh token** | Giảm độ phức tạp | Người dùng phải đăng nhập lại sau 1h | ⚠️ Chấp nhận cho MVP |

---

## 11. Đối chiếu với yêu cầu bắt buộc của Task 3.1

| Yêu cầu đề bài | Nơi đáp ứng |
|---|---|
| Frontend Next.js/PWA | §8 |
| Backend NestJS theo module/domain | §4 |
| PostgreSQL và cơ chế migration | §5 |
| Dịch vụ thanh toán mô phỏng | §6 |
| Logging, health check, quản lý cấu hình | §7 |
| Lý do chọn kiến trúc, ưu điểm, hạn chế, trade-off | §1, §10 |
| ADR cho mỗi quyết định quan trọng | `adr/001…006` |

---

## 12. Liên kết

- Yêu cầu: [`../requirements/srs.md`](../requirements/srs.md)
- Sơ đồ: [`../diagrams/`](../diagrams/)
- Deployment & rollback: [`../deployment.md`](../deployment.md)
- Ma trận truy vết: [`../traceability-matrix.md`](../traceability-matrix.md)
