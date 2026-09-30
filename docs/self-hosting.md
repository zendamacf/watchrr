# Self-hosting watchrr

This guide covers a typical Docker Compose deployment on a VPS. Adjust paths and hostnames for your setup.

## Prerequisites

- Docker Engine and Docker Compose v2
- A domain name (recommended for HTTPS)
- Secrets: database password, `AUTH_JWT_SECRET`, `THEMOVIEDB_ACCESS_TOKEN`, `CRON_SECRET`

Copy [`.env.example`](../.env.example) next to `docker-compose.yml` and fill in values before starting the stack.

## HTTPS and reverse proxy

The app container speaks plain HTTP on port 3000. Put a reverse proxy in front of it for TLS:

1. Point DNS for your hostname at the server.
2. Run Caddy, nginx, or Traefik on the host (or as another container) terminating HTTPS.
3. Proxy `https://watchrr.example.com` → `http://127.0.0.1:3000` (or the published `APP_PORT`).
4. Forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto` so cookies and redirects behave correctly.

Example nginx location block:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Cron sidecar

Scheduled metadata refresh uses the `cron` service with profile `production`:

```bash
docker compose --profile production up -d
```

The sidecar calls `GET /api/refresh` with `Authorization: Bearer $CRON_SECRET`. Keep `CRON_SECRET` long and private; rotate it if leaked.

## PostgreSQL backups

Data lives in the `pgdata` Docker volume. Back up regularly before upgrades.

**Logical dump (recommended for restore to another Postgres):**

```bash
docker compose exec -T postgres pg_dump -U watchrr -Fc watchrr > "watchrr-$(date +%F).dump"
```

**Restore into a fresh volume:**

```bash
docker compose exec -T postgres pg_restore -U watchrr -d watchrr --clean --if-exists < watchrr-YYYY-MM-DD.dump
```

Test restores on a non-production copy of the database periodically.

## Private instances

Set `ALLOW_SIGNUP=false` in `.env` to block new registrations while existing users keep signing in.

## Umami analytics (optional)

Set `UMAMI_WEBSITE_ID` in `.env` for privacy-friendly page analytics in production. For self-hosted Umami, set `UMAMI_HOST_URL` to your instance origin. Use `trackUmamiEvent` from `@/lib/analytics/umami/track` for custom events.
