# Stage 1: Install dependencies
FROM node:22-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm@10.26.2

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/logger/package.json ./packages/logger/
COPY apps/threat-engine/package.json ./apps/threat-engine/

RUN pnpm install --frozen-lockfile --filter @ironveil/threat-engine...

# Stage 2: Build
FROM deps AS build

WORKDIR /app

COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/threat-engine ./apps/threat-engine

RUN pnpm --filter @ironveil/shared-types build
RUN pnpm --filter @ironveil/logger build

RUN pnpm --filter @ironveil/threat-engine build

RUN pnpm deploy --filter @ironveil/threat-engine --prod /prod

# Stage 3: Production image
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S ironveil && \
    adduser -S ironveil -G ironveil

COPY --from=build /prod ./

USER ironveil

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

CMD ["node", "dist/index.js"]