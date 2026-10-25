# ADR-006: Triển khai production trên Render (PaaS)

| | |
|---|---|
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | Sprint 1 |
| **Liên quan** | Task 3.2, Task 5.3, Task 5.4, C-04, NFR-05 |

## Bối cảnh

Task 5.4 yêu cầu bàn giao:

- URL frontend production truy cập được **qua HTTPS**;
- URL API + URL health check;
- database production **không** public trực tiếp;
- secret không xuất hiện trong repository hoặc log CI;
- hướng dẫn rollback.

Nền tảng được đề bài cho phép: Render, Railway, Fly.io, Azure, AWS, VPS hoặc tương đương.
Nhóm cần nền tảng **miễn phí hoặc rẻ**, **hỗ trợ Docker**, **có Postgres**, **deploy được bằng
CI secret** và **tự cấp HTTPS**.

## Quyết định

Chọn **Render** làm nền tảng production, với 3 tài nguyên:

| Tài nguyên | Loại | Ghi chú |
|---|---|---|
| `brewlite-web` | Web Service (Docker) | Next.js, `output: 'standalone'`, cổng `PORT` do Render cấp |
| `brewlite-api` | Web Service (Docker) | NestJS, `PORT` do Render cấp |
| `brewlite-db` | PostgreSQL (Managed) | Internal DB URL, **không** public |

- **HTTPS**: Render tự cấp chứng chỉ Let's Encrypt cho mỗi service → URL dạng
  `https://brewlite-web.onrender.com` và `https://brewlite-api.onrender.com`.
- **Deploy từ CI**: Render có **Deploy Hook** (URL webhook) và **Render API** (dùng
  `RENDER_API_KEY`). Pipeline CD gọi API để kích hoạt deploy với image tag theo commit SHA.
- **Secret**: đặt trong *Render Environment Variables* (mã hóa at rest) và trong *GitHub
  Actions Secrets*. Không ghi trong repo.
- **Health check**: `GET /health` trả 200; cấu hình làm `Health Check Path` cho service API.
- **Database**: dùng `Internal Database URL` (chỉ truy cập được từ trong Render private network).
  Không bật public connection string trong production.
- **Migration**: chạy `prisma migrate deploy` trong entrypoint container API, **trước** khi service
  nhận traffic — an toàn vì chỉ dùng migration additive.
- **Rollback**: Render giữ lại các deploy trước → rollback bằng cách deploy lại image tag cũ
  (`POST /v1/services/{serviceId}/deploys` với `image`), hoặc dùng chức năng "Rollback" trong UI.

## Lý do

- **Free tier** đủ cho bài tập: 2 web service + 1 Postgres (có giới hạn idle → ghi rõ trong
  `docs/deployment.md`).
- **Hỗ trợ Docker native** → dùng đúng `Dockerfile` đã viết, không cần sửa sang mô hình build
  khác.
- **Deploy Hook/API** cho phép CD tự động hoá đúng yêu cầu §7.3 (push registry → deploy → smoke test).
- **HTTPS tự động** → không tự cấu hình chứng chỉ/caddy/nginx như VPS.
- **Postgres managed** → không phải tự vận hành, backup có sẵn.

## Hệ quả

**Tích cực**

- Trải nghiệm triển khai gần với thực tế (build image → push registry → deploy → health check).
- Không phải cấu hình chứng chỉ, firewall, reverse proxy thủ công.
- Có sẵn log từng deploy phục vụ Sprint Retrospective.

**Tiêu cực**

- **Cold start** của free tier sau thời gian không có traffic (vài phút) → có thể vượt NFR-01
  (500ms) trong lần đầu sau khi ngủ. Ghi nhận rõ trong `docs/deployment.md`.
- **Giới hạn quota** free tier: Postgres hết hạn sau 30 ngày nếu không dùng → cần gia hạn.
- **Phụ thuộc nhà cung cấp**: nếu Render đổi chính sách, cần đổi nền tảng → phần bị ảnh hưởng
  được cô lập trong `docs/deployment.md` và file `render.yaml`.
- Không thể tùy ý mở cổng nội bộ tùy ý; mọi thứ qua public HTTPS + private network của Render.

## Các lựa chọn đã cân nhắc và bác bỏ

| Lựa chọn | Lý do bác bỏ |
|---|---|
| Railway | Dễ dùng tương tự nhưng chính sách tính phí/usage thay đổi theo tháng, khó dự báo cho bài tập. |
| Fly.io | CLI + hệ thống volumes phức tạp hơn; free allowance hạn chế hơn. |
| AWS / Azure | Cần thẻ tín dụng, IAM, VPC, security group → quá nặng cho nhóm sinh viên. |
| VPS tự quản lý | Toàn quyền kiểm soát nhưng phải tự cấu hình HTTPS, firewall, backup Postgres, cập nhật bảo mật → rủi ro vận hành cao, không phù hợp tiêu chí "một người ngoài nhóm clone repo và chạy được". |

## Hướng đổi nền tảng (nếu cần)

Chỉ cần sửa 3 chỗ: `docs/diagrams/deployment-production.puml`, `docs/deployment.md`,
và phần "Nền tảng triển khai" trong file này. Các thành phần khác (Dockerfile, entrypoint,
migration, health check) là độc lập với nền tảng.
