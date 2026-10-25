# ==========================================================
# BrewLite API – NestJS + Prisma
# Multi-stage build để image nhẹ và chạy non-root.
# ==========================================================

# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: production ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
# Prisma client sinh ra lúc build cần được copy sang stage production
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY prisma ./prisma

EXPOSE 4000

# Áp dụng migration + seed trước khi khởi động (an toàn khi image được deploy lại)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
