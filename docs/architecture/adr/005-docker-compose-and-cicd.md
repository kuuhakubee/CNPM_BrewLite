# ADR-005: Docker Compose cho local, GitHub Actions cho CI/CD

| | |
|---|---|
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | Sprint 1 |
| **Liên quan** | Task 4.4, Task 5.3, C-02, C-03, NFR-05 |

## Bối cảnh

Đề bài yêu cầu hai mức độ tự động hóa khác nhau:

- **CI (Task 4.4)**: khi mở Pull Request → `Install → Lint → Unit Test → Build`; PR **không được
  merge** nếu pipeline thất bại.
- **CD (Task 5.3)**: khi push/tag → `Lint & Test → Build → Docker Image → Push Registry → Deploy →
  Smoke Test`, kèm rollback.

Nhóm cần chọn nền tảng CI, cách đóng gói và cách quản lý secret.

## Quyết định

- **CI/CD: GitHub Actions** trong `.github/workflows/` (repo đã ở GitHub → tích hợp tự nhiên,
  không cần tài khoản nền tảng thứ ba).
- **Đóng gói: Docker** (`Dockerfile` multi-stage cho cả `apps/api` và `apps/web`).
- **Local: `docker-compose.yml`** dựng PostgreSQL + API + Web bằng 1 lệnh; PostgreSQL có
  `healthcheck` và API chỉ khởi động sau khi DB `healthy`.
- **Registry: Docker Hub** (image tag theo commit SHA short + tag `latest` cho `main`).
- **Tách 2 workflow**:
  - `.github/workflows/ci.yml` — chạy trên `pull_request` (và push lên `main`): quality gate.
  - `.github/workflows/cd.yml` — chạy khi push tag `v*` hoặc khi merge vào `main`: build & push
    image, deploy, smoke test.
- **Quality gate** trong CI: `npm ci` → `npm run lint` → `npm run test` → `npm run build`
  cho cả hai ứng dụng, chạy song song bằng `strategy.matrix`.
- **Cache** `~/.npm` và `~/.cache/next` giữa các lần chạy.
- **Secret** lưu trong *GitHub Actions Secrets* (`POSTGRES_PASSWORD`, `JWT_SECRET`,
  `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_API_KEY`, `RENDER_WEB_SERVICE_ID`,
  `RENDER_API_SERVICE_ID`). **Không** ghi trong file workflow hay log.
- **Migration trước khi cắt traffic**: `npx prisma migrate deploy` chạy trong entrypoint của
  container API (chỉ chạy migration *additive*).
- **Rollback**: deploy lại image tag trước đó (commit SHA trước) qua Render API; tài liệu hóa
  trong `docs/deployment.md`.

## Lý do

- GitHub Actions tích hợp sẵn với GitHub PR → đúng yêu cầu "CI chạy tự động khi mở pull request".
- Docker Compose là cách tái tạo môi trường local đáng tin cậy nhất: cùng image với production.
- Multi-stage build giữ image nhỏ và chạy non-root → giảm bề mặt tấn công.
- Tách CI/CD giúp PR không bị deploy, đúng nguyên tắc "Pull request không được merge nếu lint,
  test hoặc build thất bại".

## Hệ quả

**Tích cực**

- Một người ngoài nhóm clone repo → `cp .env.example .env` → `docker compose up` → có hệ thống
  chạy được (tiêu chí nghiệm thu Task 5.4).
- Lịch sử build rõ ràng, tag image theo SHA → truy vết được đúng phiên bản đang chạy.
- Smoke test sau deploy phát hiện sớm lỗi cấu hình/migration.

**Tiêu cực**

- Pipeline dài hơn pipeline đơn giản → cần cache và chạy song song.
- Phụ thuộc GitHub Actions (trạng thái dịch vụ, quota 2000 phút/tháng cho free tier) → đủ dùng cho
  nhóm nhỏ.
- Docker Hub có giới hạn pull rate cho anonymous → nếu vượt, dùng GHCR thay thế.

## Các lựa chọn đã cân nhắc và bác bỏ

| Lựa chọn | Lý do bác bỏ |
|---|---|
| GitLab CI / CircleCI | Repo ở GitHub → thêm tích hợp thừa, cần tài khoản ngoài. |
| Deploy trực tiếp từ máy local (`docker push` + SSH) | Không có audit trail, không chạy smoke test tự động, không đáp ứng yêu cầu CD. |
| Deploy tự động theo mỗi commit vào `main` (thay vì tag) | Rủi ro hơn; dùng tag `v*` cho bản phát hành và `main` cho môi trường staging. |
