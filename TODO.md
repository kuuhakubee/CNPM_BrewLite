# BrewLite — How to Run (Debian / Linux & Windows)

> **Mục đích:** hướng dẫn từng bước để **chạy toàn bộ app** (PostgreSQL + NestJS API + Next.js web)
> bằng Docker, và **kiểm tra database** đã đúng chưa. Viết cho cả **Debian/Linux** và **Windows**.
>
> **TL;DR** (sau khi đã cài Docker):
>
> ```bash
> cp .env.example .env
> docker compose up --build -d
> curl http://localhost:4000/health
> ```

---

## 0. Kiến trúc & cổng (đọc trước)

| Thành phần  | Cổng trên HOST | Cổng trong Docker | Ghi chú                                              |
| ----------- | -------------- | ----------------- | ---------------------------------------------------- |
| PostgreSQL  | **5433**       | 5432              | Đổi ra 5433 để không đụng PostgreSQL hệ thống ở 5432 |
| NestJS API  | **4000**       | 4000              | `GET /health`, `GET /api/v1/...`                     |
| Next.js web | **3000**       | 3000              | Mở `http://localhost:3000`                           |

> ⚠️ **Quan trọng:** DB của app nằm ở **host port 5433**. Cổng **5432** là PostgreSQL của hệ điều hành
> (nếu có) — **không phải** DB của BrewLite.

---

## 1. Cài đặt một lần (Prerequisites)

### 1.1 Debian / Linux

```bash
# Cài Docker Engine + Compose plugin (khuyến nghị)
sudo apt update
sudo apt install -y docker.io docker-compose-plugin

# (Hoặc nếu dùng Docker Desktop / bản khác thì bỏ qua bước trên)

# Cho phép user hiện tại chạy docker không cần sudo
sudo usermod -aG docker $USER

# ⚠️ BẮT BUỘC: đăng xuất rồi đăng nhập lại (hoặc reboot) để group có hiệu lực.
# Nếu không muốn logout, có thể chạy tạm:  newgrp docker
```

Kiểm tra:

```bash
docker --version
docker compose version
docker run hello-world     # nếu in "Hello from Docker!" là OK
```

### 1.2 Windows

1. Cài **Docker Desktop**: <https://www.docker.com/products/docker-desktop/>
   - Bật **WSL2 backend** (Settings → General → _Use the WSL 2 based engine_).
   - Cần bật virtualization trong BIOS và cài WSL2 (`wsl --install` trong PowerShell nếu chưa có).
2. Mở **Docker Desktop** và đợi trạng thái **Engine running** (icon xanh).
3. Kiểm tra trong **PowerShell**:

```powershell
docker --version
docker compose version
docker run hello-world
```

> Trên Windows không cần `usermod`/`sudo`. Docker Desktop chạy dịch vụ nền và cấp quyền qua UI.

---

## 2. Chuẩn bị file môi trường

File `.env` **không** được commit (đã có trong `.gitignore`). Mỗi máy phải tự tạo từ mẫu.

### 2.1 Debian / Linux (bash)

```bash
# Từ thư mục gốc repository
cp .env.example .env

# (Tùy chọn) Nếu muốn chạy API trực tiếp trên host, không qua Docker:
cp apps/api/.env.example apps/api/.env
```

### 2.2 Windows (PowerShell)

```powershell
# Từ thư mục gốc repository
Copy-Item .env.example .env

# (Tùy chọn) Nếu muốn chạy API trực tiếp trên host, không qua Docker:
Copy-Item apps/api/.env.example apps/api/.env
```

### 2.3 Giá trị mặc định (đủ để chạy local)

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-local
POSTGRES_DB=brewlite_db
POSTGRES_PORT=5433
JWT_SECRET=replace-with-a-long-random-secret
```

> 🔒 **Bảo mật:** đây là mật khẩu **local dev**. Khi deploy production, đặt secret thật trong
> Render Environment Variables / GitHub Actions Secrets — **không** commit.
> Nếu đổi `POSTGRES_PORT`, nhớ đổi cả `localhost:<port>` trong `apps/api/.env`.

---

## 3. Chạy app

Các lệnh **giống nhau** trên Debian và Windows (PowerShell hay Git Bash đều được).

```bash
# Build lần đầu + chạy nền (detached)
docker compose up --build -d
```

Lần đầu sẽ mất vài phút (tải image + build). Kiểm tra trạng thái:

```bash
docker compose ps
```

Kết quả mong đợi:

```
brewlite_postgres   Up ... (healthy)   0.0.0.0:5433->5432/tcp
brewlite_api        Up ... (healthy)   0.0.0.0:4000->4000/tcp
brewlite_web        Up ...             0.0.0.0:3000->3000/tcp
```

Mở trình duyệt:

- Web: <http://localhost:3000>
- API health: <http://localhost:4000/health>

Dừng app:

```bash
docker compose down            # giữ dữ liệu DB (volume)
docker compose down -v         # ⚠️ XÓA luôn dữ liệu DB (volume)
```

---

## 4. Kiểm tra database đã đúng chưa

Có 3 cách. **Cách 1** là nhanh nhất.

### 4.1 Cách 1 — vào thẳng PostgreSQL trong container (không cần password)

```bash
docker exec -it brewlite_postgres psql -U postgres -d brewlite_db
```

Trong `psql`:

```sql
\dt                          -- liệt kê bảng
SELECT * FROM products;      -- xem sản phẩm
SELECT count(*) FROM users;  -- số user
\q                           -- thoát
```

### 4.2 Cách 2 — kết nối từ host bằng mật khẩu trong `.env`

**Debian/Linux:**

```bash
PGPASSWORD=change-me-local psql -h localhost -p 5433 -U postgres -d brewlite_db
```

**Windows (PowerShell):**

```powershell
$env:PGPASSWORD="change-me-local"
psql -h localhost -p 5433 -U postgres -d brewlite_db
```

> Nếu PowerShell báo không có `psql`: cài PostgreSQL client, hoặc dùng **Cách 1** (docker exec)
> — không cần cài gì thêm. Mật khẩu phải khớp `POSTGRES_PASSWORD` trong `.env`.

### 4.3 Cách 3 — Prisma Studio (giao diện web xem dữ liệu)

Chạy từ thư mục `apps/api` trên host (cần đã `npm install`):

```bash
cd apps/api
npx prisma studio        # mở http://localhost:5555
```

> `apps/api/.env` phải trỏ `DATABASE_URL` tới `localhost:5433` (file mẫu đã đúng).

### 4.4 Kiểm tra bằng API + migration

```bash
# API trả 200 + database "up" là DB thông
curl http://localhost:4000/health
# {"status":"ok","database":"up","uptime":...,"timestamp":"..."}

# Trạng thái migration
docker compose exec api npx prisma migrate status
# → "No pending migrations"

# Chạy seed (idempotent — chạy lại không bị trùng)
docker compose exec api npm run prisma:seed
# → "Seed done. Demo user id=1, products=8, toppings=4."
```

### 4.5 Số liệu mong đợi sau seed

```bash
docker exec brewlite_postgres psql -U postgres -d brewlite_db -c "
  SELECT 'users='||count(*) FROM users UNION ALL
  SELECT 'products='||count(*) FROM products UNION ALL
  SELECT 'toppings='||count(*) FROM toppings UNION ALL
  SELECT 'promotions='||count(*) FROM promotions;"
```

```
 users=1
 products=8
 toppings=4
 promotions=1
```

---

## 5. Lệnh hữu ích hằng ngày

```bash
docker compose ps                      # xem trạng thái
docker compose logs -f api             # xem log API realtime
docker compose logs -f web             # xem log web realtime
docker compose restart api             # restart 1 service
docker compose up --build -d           # rebuild sau khi sửa code
docker compose down                    # dừng tất cả
docker compose exec api sh             # vào shell trong container API
docker compose exec postgres sh        # vào shell trong container DB
```

Chạy test / lint / build của API (trong container):

```bash
docker compose exec api npm run build
docker compose exec api npm run lint
docker compose exec api npm test
```

---

## 6. Troubleshooting

| Lỗi                                                      | Nguyên nhân                            | Cách sửa                                                                                                                                                      |
| -------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `permission denied ... docker.sock` (Debian)             | User chưa ở group `docker`             | `sudo usermod -aG docker $USER` rồi **logout/login**; hoặc `newgrp docker`                                                                                    |
| `ports are not available: 5432`                          | Cổng 5432 bị PostgreSQL hệ thống chiếm | Đã tránh bằng host port **5433**. Nếu vẫn lỗi, đổi `POSTGRES_PORT` trong `.env` (vd 5434) và sửa `localhost:5434` trong `apps/api/.env`                       |
| `ports are not available: 4000` / `3000`                 | Cổng đang bị dùng                      | Tắt app khác, hoặc đổi port mapping trong `docker-compose.yml`                                                                                                |
| `password authentication failed for user "postgres"`     | Sai mật khẩu / nhầm instance           | Dùng `docker exec ... psql` (Cách 1), hoặc mật khẩu phải khớp `POSTGRES_PASSWORD` trong `.env`                                                                |
| API restart loop, lỗi Prisma `libssl`/`binaryTargets`    | Prisma thiếu binary cho Alpine         | Đã cấu hình `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` + `apk add openssl` trong Dockerfile. Nếu vẫn lỗi: `docker compose build --no-cache api` |
| `Cannot connect to the Docker daemon` (Windows)          | Docker Desktop chưa chạy               | Mở Docker Desktop, đợi "Engine running"                                                                                                                       |
| `docker compose` not found                               | Thiếu Compose plugin                   | Cài `docker-compose-plugin` (Debian) / cập nhật Docker Desktop (Windows)                                                                                      |
| Web build lỗi `Couldn't find any pages or app directory` | Thiếu thư mục `app/`                   | Đảm bảo `apps/web/app/page.js` + `layout.js` tồn tại                                                                                                          |
| `.env` không được nạp                                    | Chưa tạo `.env`                        | `cp .env.example .env` (Debian) / `Copy-Item` (Windows)                                                                                                       |

### Reset sạch từ đầu (⚠️ mất dữ liệu DB)

```bash
docker compose down -v
docker compose up --build -d
```

---

## 7. Ghi chú cho Windows

- Dùng **PowerShell** hoặc **Git Bash**. Nếu dùng PowerShell, `curl` là alias của
  `Invoke-WebRequest`; muốn dùng đúng curl thì gọi `curl.exe`:
  ```powershell
  curl.exe http://localhost:4000/health
  ```
- **Không** chạy `sudo`/`usermod` — đó là lệnh Linux.
- Nếu repo nằm trên ổ Windows (`C:\...`), build có thể chậm. Nên clone trong **WSL2 filesystem**
  (`\\wsl$\...`) để nhanh hơn (tùy chọn).
- Nếu Docker Desktop hỏi quyền firewall, chọn **Allow**.
- Xuống dòng (line endings): giữ nguyên như repo (LF). Không cần đổi.

---

## 8. Checklist "app đã chạy đúng"

- [ ] `docker compose ps` → 3 container, postgres + api **healthy**
- [ ] `http://localhost:3000` mở được
- [ ] `http://localhost:4000/health` → `{"status":"ok","database":"up"}`
- [ ] `docker compose exec api npx prisma migrate status` → _No pending migrations_
- [ ] `docker exec ... psql` thấy `products=8, users=1, toppings=4`
- [ ] `docker compose exec api npm test` → pass

---

## 9. Liên kết

- Hướng dẫn chi tiết hơn: [`README.md`](./README.md)
- Yêu cầu & SRS: [`docs/requirements/`](./docs/requirements/)
- Kiến trúc & ADR: [`docs/architecture/`](./docs/architecture/)
- Triển khai production (Render): [`docs/deployment.md`](./docs/deployment.md)
