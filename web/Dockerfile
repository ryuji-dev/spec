# syntax=docker/dockerfile:1

# Next.js 16 standalone 멀티스테이지 빌드 (pnpm)
# Oracle ARM VM(linux/arm64)·amd64 모두에서 빌드 가능

# ---- base: node + pnpm(corepack) ----
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ---- deps: 의존성만 캐시 레이어로 ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: 소스 빌드 → .next/standalone ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- runner: standalone 산출물만 담은 경량 런타임 ----
FROM base AS runner
ENV NODE_ENV=production
# next start 대신 standalone server.js 직접 실행
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# standalone은 정적 자산(.next/static)·public을 따로 복사해야 함
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 운영 마이그레이션·시드 스크립트 + 마이그레이션 SQL (standalone에 미포함 → 별도 복사)
COPY --from=builder /app/src/server/db/migrations ./migrations
COPY --from=builder /app/scripts/migrate.mjs /app/scripts/seed-admin.mjs ./scripts/

# 업로드 마운트 지점 (compose에서 named volume으로 덮어씀)
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
