# ADR-001: Sử dụng Monorepo với `apps/` và `docs/`

| | |
|---|---|
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | Sprint 1 |
| **Người quyết định** | Nhóm phát triển |
| **Liên quan** | Task 3.1, `docs/architecture/architecture.md` §2 |

## Bối cảnh

Bài tập yêu cầu một hệ thống gồm frontend Next.js, backend NestJS và PostgreSQL, đồng thời yêu cầu
tài liệu (SRS, sơ đồ, ADR, ma trận truy vết) nằm trong cùng một repository với lịch sử thay đổi
rõ ràng. Nhóm có 3–5 thành viên làm việc song song trên cả hai ứng dụng.

Các lựa chọn chính:

- **(a) Monorepo** – một repo chứa `apps/web`, `apps/api`, `docs/`, `tests/`.
- **(b) Polyrepo** – mỗi ứng dụng một repo riêng + một repo tài liệu.
- **(c) Monorepo có công cụ quản lý (Nx / Turborepo / pnpm workspace)**.

## Quyết định

Chọn **(a) Monorepo** với cấu trúc thư mục **đúng theo mẫu bắt buộc** của đề bài:

```text
brewlite/
|-- apps/web/          # Next.js mobile-first/PWA
|-- apps/api/          # NestJS
|-- docs/              # requirements, diagrams, architecture, adr
|-- tests/             # Integration / E2E
|-- .github/workflows/ # CI/CD
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

Không dùng công cụ quản lý workspace (Nx/Turborepo) ở phiên bản này.

## Lý do

- **Khớp yêu cầu bắt buộc** của đề bài §9 – cấu trúc repository được chấm điểm trực tiếp.
- **Tài liệu và mã nguồn cùng version**: khi đổi yêu cầu (FR) hoặc kiến trúc, tài liệu và code được
  commit trong cùng một Pull Request → bảo đảm ma trận truy vết không bị lệch.
- **Một pipeline CI duy nhất** chạy cho cả hai ứng dụng, đúng yêu cầu "CI chạy tự động khi mở PR".
- **Tránh Over-engineering**: nhóm nhỏ, 2 sprint; thêm Nx/Turborepo là thêm độ phức tạp dự án
  mà không mang lại giá trị nghiệp vụ.

## Hệ quả

**Tích cực**

- Truy vết yêu cầu → mã nguồn → test → tài liệu diễn ra trong một repo, dễ nghiệm thu.
- Một lệnh `docker compose up` dựng được toàn bộ hệ thống.
- Không cần đồng bộ version giữa nhiều repo.

**Tiêu cực**

- Repo có thể lớn nhanh; phải chịu trách nhiệm `.gitignore` (đã có trong Phase 0).
- Khi có nhiều nhóm phát triển trên cùng một ứng dụng, việc review PR có thể chậm.
- CI chạy cho cả web lẫn API → tổng thời gian pipeline dài hơn nếu không chia job song song
  (giảm thiểu bằng `strategy.matrix` và cache npm trong CI).

## Các lựa chọn đã cân nhắc và bác bỏ

| Lựa chọn | Lý do bác bỏ |
|---|---|
| Polyrepo | Tài liệu và mã nguồn lệch phiên bản; nhiều pipeline, nhiều nơi cấu hình secret; khó đối chiếu với yêu cầu "tạo phẩm của task trước phải có trên kho mã nguồn". |
| Monorepo + Nx/Turborepo | Quá nặng cho quy mô nhóm; thêm dependency và khái niệm mới cần học; đề bài không yêu cầu. Có thể chuyển đổi sau nếu repo phình to. |

## Trạng thái

Đã chấp nhận — không dự kiến thay đổi trong phạm vi Assignment 2.
