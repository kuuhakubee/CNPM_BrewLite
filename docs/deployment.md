# BrewLite – Tài liệu triển khai (Deployment)

| | |
|---|---|
| **Tài liệu** | `docs/deployment.md` |
| **Task** | Assignment 2 – Task 3.2 / 5.3 / 5.4 |
| **Nền tảng production** | **Render** (xem [ADR-006](architecture/adr/006-deployment-platform-render.md)) |
| **Sơ đồ** | [`diagrams/deployment-production.puml`](diagrams/deployment-production.puml) · [`.svg`](diagrams/deployment-production.svg) |
| **Trạng thái** | 🚧 Môi trường production sẽ hoàn thiện ở Task 5.4 |

---

## 1. Tổng quan 3 môi trường

| Môi trường | Mục đích | Cách chạy | CSDL | Bí mật |
|---|---|---|---|---|
| **Local** | Phát triển | `docker compose up` | Container PostgreSQL, volume `postgres_data` | `.env` (local, gitignored) |
| **CI** | Lint, test, build, image | GitHub Actions | PostgreSQL service container (tạo/hủy mỗi job) | GitHub Actions Secrets |
| **Production** | Bàn giao | Render (Web Service + Managed Postgres) | Render Managed PostgreSQL, internal URL, persistent disk | Render Environment Variables |

---

## 2. Chạy local

```bash
# 1. Tạo file env từ mẫu và điền giá trị
cp .env.example .env

# 2. Build và chạy cả 3 dịch vụ (web :3000, api :4000, db :5432)
docker compose up --build

# 3. Kiểm tra health check
curl http://localhost:4000/health   # → { "status": "ok", "database": "up", ... }
```

**Lưu ý quan trọng khi chạy local ngoài Docker:**

- Nếu chạy API bằng `npm run start:dev` trên host (không qua container), đổi `DATABASE_URL`
  trong `.env` trỏ tới `localhost` thay vì `postgres` (service name của Docker network).
  Xem chú thích trong [`.env.example`](../.env.example).
- Áp dụng migration + seed lần đầu:
  ```bash
  cd apps/api
  npx prisma migrate deploy
  npx prisma db seed
  ```

---

## 3. Cấu trúc triển khai Production (Render)

Ba tài nguyên trên Render (chi tiết [ADR-006](architecture/adr/006-deployment-platform-render.md)):

| Tài nguyên | Loại | Cổng / Health | Ghi chú |
|---|---|---|---|
| `brewlite-web` | Web Service (Docker) | `$PORT` (Render cấp) · HTTPS | Next.js `output: 'standalone'` |
| `brewlite-api` | Web Service (Docker) | `$PORT` (Render cấp) · `GET /health` | NestJS + Prisma |
| `brewlite-db` | PostgreSQL (Managed) | Internal URL (5432) | **Không public** |

- **HTTPS**: Render tự cấp chứng chỉ Let's Encrypt →
  `https://brewlite-web.onrender.com`, `https://brewlite-api.onrender.com`.
- **Database không public**: chỉ truy cập qua **Internal Database URL** (mạng riêng của Render).
  Không dùng public connection string trong production (đáp ứng C-04).

---

## 4. Biến môi trường & Secret

### 4.1 Local (`.env` – gitignored)

Mô tả đầy đủ trong [`.env.example`](../.env.example). Bao gồm:
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `DATABASE_URL`,
`PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PAYMENT_PROVIDER`, `PAYMENT_SUCCESS_RATE`,
`NEXT_PUBLIC_API_URL`.

### 4.2 Production (Render Environment Variables – mã hóa at-rest)

**API (`brewlite-api`)**

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Internal DB URL của `brewlite-db` | Không public |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ≥ 32 byte | Sinh bằng `openssl rand -hex 32` |
| `NODE_ENV` | `production` | |
| `PORT` | Do Render cấp | Không hardcode |
| `PAYMENT_PROVIDER` | `mock` | |
| `JWT_EXPIRES_IN` | `1d` | |

**Web (`brewlite-web`)**

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://brewlite-api.onrender.com` | URL public của API |
| `NODE_ENV` | `production` | |

> ⚠️ **Bí mật KHÔNG bao giờ nằm trong repository hay log CI.** `.env` bị `.gitignore` chặn;
> giá trị thật nằm ở Render Environment Variables và GitHub Actions Secrets.

### 4.3 Secret trong GitHub Actions (cho pipeline CD – Task 5.3)

`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_API_KEY`,
`RENDER_WEB_SERVICE_ID`, `RENDER_API_SERVICE_ID`, (`POSTGRES_PASSWORD`, `JWT_SECRET` nếu cần cho job test).

---

## 5. Pipeline Continuous Delivery (Task 5.3)

Pipeline đầy đủ phải thể hiện (đúng yêu cầu §7.3 của đề bài):

```
Push/Tag  →  Lint & Test  →  Build  →  Docker Image  →  Push Registry  →  Deploy  →  Smoke Test
```

Các bước bắt buộc:

1. **Quality gate**: chạy `lint`, `unit test`, `build`. Bất kỳ bước nào fail → dừng pipeline.
2. **Tạo image** gắn tag bằng **commit SHA** hoặc **semantic version**.
3. **Push image** lên container registry (Docker Hub) nếu nền tảng yêu cầu.
4. **Deploy** vào production bằng **secret của CI** (Render API / Deploy Hook).
5. **Chạy migration** an toàn: `prisma migrate deploy` chạy trong entrypoint container API,
   **trước** khi nhận traffic. Chỉ dùng migration **additive**.
6. **Smoke test**: gọi `GET /health` sau deploy → phải trả 200.
7. **Dừng pipeline và cung cấp cách rollback** nếu deploy thất bại → xem §7.

> 🚧 Pipeline CI (Task 4.4) và CD (Task 5.3) sẽ được hiện thực trong `.github/workflows/`
> ở các task tương ứng.

---

## 6. Health check & Logging

| Hạng mục | Thiết kế |
|---|---|
| **Health endpoint** | `GET /health` → `{ status, database, uptime, timestamp }` |
| **Dùng cho** | Health Check Path của Render + smoke test của pipeline CD |
| **Logging** | Log JSON ra stdout (`timestamp`, `level`, `requestId`, `method`, `url`, `statusCode`, `durationMs`, `userId`) → Render log stream |
| **Truy vết lỗi** | `requestId` xuyên suốt request để đối chiếu log |

---

## 7. Rollback

Khi deploy thất bại hoặc phát hiện lỗi ở production:

### 7.1 Rollback nhanh bằng Render UI

1. Vào service (`brewlite-web` / `brewlite-api`) → tab **Deploys**.
2. Chọn deploy trước đó đang **Active/Successful**.
3. Bấm **Rollback to this deploy** → Render redeploy image cũ.

### 7.2 Rollback bằng Render API (từ CI hoặc terminal)

```bash
# Liệt kê các deploy gần nhất
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$RENDER_API_SERVICE_ID/deploys?limit=5"

# Deploy lại một image tag cũ (commit SHA trước)
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"image": "docker.io/<user>/brewlite-api:<old-commit-sha>"}' \
  "https://api.render.com/v1/services/$RENDER_API_SERVICE_ID/deploys"
```

### 7.3 Rollback migration (nếu migration gây lỗi)

- Migration chỉ **additive** (thêm bảng/cột) → thường không phá vỡ version cũ.
- Nếu migration thật sự cần lùi: tạo **migration sửa đổi mới** (không sửa migration cũ) rồi
  deploy lại. Không bao giờ sửa/xóa file trong `prisma/migrations/` đã deploy lên production.

---

## 8. Giới hạn & lưu ý của Free Tier (Render)

- **Cold start**: service free tier ngủ sau thời gian không có request → lần đầu có thể mất
  vài giây (vượt NFR-01 500ms). Ảnh hưởng trực tiếp tới lần truy cập đầu tiên.
- **Hạn dùng Postgres free tier**: database có thể bị tạm dừng sau ~30 ngày ít hoạt động →
  cần gia hạn định kỳ trước khi nghiệm thu.
- **Không dùng dữ liệu production cho local** và ngược lại.

---

## 9. Checklist nghiệm thu triển khai (Task 5.4)

- [ ] URL frontend production truy cập được qua **HTTPS**
- [ ] URL API + URL health check (`/health`) hoạt động
- [ ] Database production **không** public trực tiếp (internal URL)
- [ ] Secret **không** xuất hiện trong repository hay log CI
- [ ] Release/tag phiên bản + release notes
- [ ] README hướng dẫn chạy local, test, build, deploy và rollback
- [ ] Video/demo trực tiếp luồng end-to-end
- [ ] Sprint Review + Sprint Retrospective

---

## 10. Liên kết

- ADR nền tảng: [ADR-006 – Render](architecture/adr/006-deployment-platform-render.md)
- ADR CI/CD: [ADR-005 – Docker Compose & GitHub Actions](architecture/adr/005-docker-compose-and-cicd.md)
- Kiến trúc: [`architecture/architecture.md`](architecture/architecture.md)
- Ma trận truy vết: [`traceability-matrix.md`](traceability-matrix.md)
