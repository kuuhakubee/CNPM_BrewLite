# BrewLite – README

> **BrewLite** is a coffee-ordering application built with NestJS (backend) + Next.js (frontend),
> PostgreSQL (database), and Docker (containerisation). This README guides you through setting
> up the project locally, verifying the database, and running the system end-to-end.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick setup](#quick-setup)
3. [Environment configuration](#environment-configuration)
4. [Running with Docker Compose](#running-with-docker-compose)
5. [Verifying the database is set up correctly](#verifying-the-database-is-set-up-correctly)
6. [Running the API manually (outside Docker)](#running-the-api-manually-outside-docker)
7. [Troubleshooting](#troubleshooting)
8. [Known issues & decisions](#known-issues--decisions)

---

## 1. Prerequisites

- **Docker** and **Docker Compose** must be installed and functional.
- If you are on Linux/macOS and Docker is installed but `docker compose` gives
  `permission denied`, add your user to the `docker` group and re-login:
  ```bash
  sudo usermod -aG docker $USER
  # then log out and log back in (or reboot)
  ```
  _(In this terminal session you can use `sg docker -c "docker compose ..."` to run commands
  without logging out.)_
- **Node.js 20** and **npm** (if running the API/web containers manually, not via Docker).
- The project structure assumes you are in the repository root
  `/home/sang/School/SWE/CNPM_BrewLite`.

---

## 2. Quick setup

```bash
# 1. Copy environment files (these are gitignored — never commit real secrets!)
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# 2. (Optional) Edit the passwords if you want something other than the defaults.
#    The defaults are fine for local development.
#    - .env (root): POSTGRES_PASSWORD, JWT_SECRET, etc.
#    - apps/api/.env: DATABASE_URL points at the correct port (see below).

# 3. Start the stack (Postgres first, then API + Web):
docker compose up --build
```

That's it — the command above will start **three containers**:

- `brewlite_postgres` — PostgreSQL 15, listening on **host port 5433** (see §4).
- `brewlite_api` — NestJS API on host port **4000**.
- `brewlite_web` — Next.js on host port **3000**.

---

## 3. Environment configuration

### 3.1 Root `.env`

This file is **gitignored** (never commit it). Default contents (copied from `.env.example`):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-local        # ← local dev password; change if you wish
POSTGRES_DB=brewlite_db
POSTGRES_PORT=5433                       # ← maps host 5433 → container 5432
DATABASE_URL=postgresql://postgres:change-me-local@localhost:5433/brewlite_db?schema=public
NODE_ENV=development
PORT=4000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
PAYMENT_PROVIDER=mock
PAYMENT_SUCCESS_RATE=0.9

NEXT_PUBLIC_API_URL=http://localhost:4000
PRODUCTION_API_URL=https://brewlite-api.onrender.com
```

### 3.2 `apps/api/.env`

Also gitignored. Contains the host-level connection string used when the API runs
directly on the machine (not inside the Docker network):

```env
# Nếu chạy API BẰNG DOCKER COMPOSE, service "api" dùng DATABASE_URL trỏ tới
# host "postgres" (tên service) và cổng NỘI BỘ 5432 thay vì localhost – xem docker-compose.yml.
# Lưu ý: cổng HOST là 5433 (tránh đụng PostgreSQL hệ thống ở 5432).
DATABASE_URL="postgresql://postgres:change-me-local@localhost:5433/brewlite_db?schema=public"
PORT=4000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
PAYMENT_PROVIDER=mock
PAYMENT_SUCCESS_RATE=0.9
```

### Why port **5433**?

Your host machine already runs a system PostgreSQL on port **5432**. To avoid a port
conflict, BrewLite maps the PostgreSQL container's internal port **5432** to **host port 5433**.
All internal Docker communication (api ↔ postgres) still uses the default port **5432** —
only the host-facing endpoint is 5433.

---

## 4. Running with Docker Compose

```bash
# From the repository root:
docker compose up --build
```

What starts:

| Service    | Port (host → container) | Purpose                                    |
| ---------- | ----------------------- | ------------------------------------------ |
| `postgres` | `5433 → 5432`           | BrewLite's PostgreSQL                      |
| `api`      | `4000 → 4000`           | NestJS REST API (`/api/v1/...`, `/health`) |
| `web`      | `3000 → 3000`           | Next.js frontend (mobile-first)            |

**Health check**: After the containers start, verify the API is up:

```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","database":"up",...}
```

If the database is reachable you'll see `status: "ok"` and `database: "up"`. If the DB
is not ready yet, the container will return `503` (this is by design — see §5).

To stop the stack:

```bash
docker compose down
```

---

## 5. Verifying the database is set up correctly

The most important verification is that **Prisma can connect, migrate, and seed** against
the running database. Run these commands **inside the API container** (or on the host if your
Docker group permission is fixed):

### 5.1 Check migration status

```bash
# From the repo root (requires Docker group access):
docker compose exec api npx prisma migrate status
# Expected: "No pending migrations"
```

### 5.2 Run the seed (idempotent — safe to run multiple times)

```bash
docker compose exec api npm run prisma:seed
# Or: npx prisma db seed
# Output: "Seed done. Demo user id=1, products=8, toppings=4."
# Running it a second time produces the same counts — no duplicates (AC-16-3).
```

### 5.3 Verify data in the database

```bash
# Query via psql inside the container:
docker exec brewlite_postgres psql -U postgres -d brewlite_db -c "
  SELECT 'users=' || count(*) FROM users UNION ALL
  SELECT 'products=' || count(*) FROM products UNION ALL
  SELECT 'toppings=' || count(*) FROM toppings UNION ALL
  SELECT 'promotions=' || count(*) FROM promotions;
"
# Expected output:
#  users=1
#  products=8
#  toppings=4
#  promotions=1
```

### 5.4 Test the API health endpoint

```bash
curl http://localhost:4000/health
# Expected (DB up):
# {"status":"ok","database":"up","uptime":...,"timestamp":"..."}

# If the DB is somehow down, the same call returns 503:
# {"status":"error","database":"down",...}
```

All three checks (migration status, seed idempotency, data counts + health endpoint)
prove the database is correctly set up and connected.

---

## 6. Running the API manually (outside Docker)

If you prefer not to use Docker compose, you can run the API directly on the host.
First install dependencies and build:

```bash
cd apps/api
npm install          # or: npm ci
npm run build        # compiles ts → dist/
```

Then ensure a PostgreSQL server is reachable at `localhost:5433` (or adjust
`DATABASE_URL` in `apps/api/.env` to point at your own DB). Then:

```bash
npm start              # runs dist/main.js
# or:
npm run start:dev     # nodemon for hot-reload
```

The API will start, expose `GET /health`, and accept the usual endpoints
(`GET /api/v1/products`, `POST /api/v1/orders`, etc.).

> **Note**: The `docker-compose.yml` maps host `5433` → container `5432`. If you run the
> API outside Docker, point `DATABASE_URL` at the host port you actually have PostgreSQL
> listening on (e.g. `localhost:5432` if you're using the system PG, or `localhost:5433`
> if you kept the BrewLite container mapping).

---

## 7. Troubleshooting

| Symptom                                                                             | Likely cause                                | Fix                                                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `docker compose up` fails with `permission denied`                                  | User not in `docker` group                  | `sudo usermod -aG docker $USER` then re-login, **or** use `sg docker -c "docker compose ..."`                   |
| `curl http://localhost:4000/health` returns `503`                                   | DB container not yet healthy, or wrong port | Wait a few seconds; verify `docker compose ps postgres` shows `healthy`                                         |
| `docker compose up` fails with `Ports are not available: 0.0.0.0:5432`              | System PostgreSQL occupies port 5432        | Already solved by mapping to host **5433** (change `POSTGRES_PORT` in `.env` if you want a different host port) |
| `prisma migrate deploy` says "no pending migrations" but you just added a migration | Migration already applied in this DB        | Use `prisma migrate resolve --rolled-back <name>` or simply `prisma migrate make <name>` to create a new one    |
| `npm test` exits with code 1 (no tests found)                                       | No `.spec.ts` files yet                     | Add spec files under `apps/api/src/` or run `npm run prisma:seed` instead                                       |

---

## 8. Known issues & decisions

- **PostgreSQL host port 5433** — chosen because your development machine already has
  PostgreSQL on 5432. The internal Docker network still uses 5432; only the host-facing
  endpoint changed.
- **`Decimal(12,2)` for money** — the Prisma schema uses `Decimal` (not `Float`) to avoid
  binary floating-point rounding errors. Prisma returns `Decimal.js` objects; the NestJS
  DTOs coerce them to `number` for JSON serialization.
- **Idempotency via `Payment.idempotencyKey UNIQUE`** — guaranteed by the database, not
  application logic (ADR-004). The seed is also idempotent (upsert by unique keys).
- **CI gate** — once you `docker compose up --build`, you can verify the quality gate:
  ```bash
  cd apps/api && npm run build   # ✅
  npm run lint                  # ✅
  npm test                      # ✅ (3 health.controller.spec.ts tests pass)
  ```

---

---

_Generated from the BrewLite Assignment 2 codebase. For questions about the assignment
requirements, see the PDF assignment files or the `docs/` directory._
