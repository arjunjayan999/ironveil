# Stage 1: Install dependencies
FROM node:22-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm@10.26.2

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile --filter @ironveil/frontend...

# Stage 2: Build
FROM deps AS build

WORKDIR /app

COPY tsconfig.base.json biome.json ./
COPY packages ./packages
COPY apps/frontend ./apps/frontend

RUN pnpm --filter @ironveil/shared-types build
RUN pnpm --filter @ironveil/frontend build

# Stage 3: Production image
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s \
  CMD wget -qO- http://localhost:80/ || exit 1