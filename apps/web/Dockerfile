# ==========================================================
# BrewLite Web – Next.js (App Router, standalone output)
# Multi-stage build, chạy non-root với output standalone.
# ==========================================================

# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# next.config.js phải bật output: 'standalone'
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

# ---------- Stage 2: production ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy các file tĩnh và standalone output từ Next.js
# Lưu ý: do outputFileTracingRoot trỏ về thư mục cha, trong container standalone nằm tại /app/.next/standalone/app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/app ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
