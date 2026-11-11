# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
COPY . .
ARG DATABASE_URL=postgresql://watchrr:watchrr@postgres:5432/watchrr
ARG AUTH_JWT_SECRET=build-placeholder
ARG THEMOVIEDB_ACCESS_TOKEN=build-placeholder
ARG CRON_SECRET=build-placeholder
ENV HUSKY=0 \
  DOCKER_BUILD=1 \
  NEXT_TELEMETRY_DISABLED=1 \
  DATABASE_URL=$DATABASE_URL \
  AUTH_JWT_SECRET=$AUTH_JWT_SECRET \
  THEMOVIEDB_ACCESS_TOKEN=$THEMOVIEDB_ACCESS_TOKEN \
  CRON_SECRET=$CRON_SECRET
RUN npm run build \
  && node_modules/.bin/esbuild docker/migrate.ts \
    --bundle --platform=node --format=esm --minify \
    --outfile=/app/migrate.mjs

FROM node:26-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
  HOSTNAME=0.0.0.0 \
  PORT=3000 \
  HUSKY=0 \
  HOME=/home/nextjs

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home --home-dir /home/nextjs nextjs \
  && chown nextjs:nodejs /app

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /app/migrate.mjs ./migrate.mjs
COPY --chown=nextjs:nodejs --chmod=755 docker/entrypoint.sh ./docker/entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--", "./docker/entrypoint.sh"]
