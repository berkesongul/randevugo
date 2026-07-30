# VPS Docker Deploy

This project is prepared for a single-container Next.js production deploy.

## First setup on the VPS

1. Install Docker and the Docker Compose plugin.
2. Clone the repository on the VPS.
3. Create the production env file:

```bash
cp .env.production.example .env.production
nano .env.production
```

4. Build and start:

```bash
docker compose --env-file .env.production up -d --build
```

5. Check status:

```bash
docker compose ps
docker compose logs -f web
```

The app listens on `APP_PORT` on the host and `3000` inside the container.

## Updating after changes

```bash
git pull
docker compose --env-file .env.production up -d --build
```

## Reverse proxy

For production, put Nginx, Caddy, Traefik, or another reverse proxy in front of
the container and point it to `http://127.0.0.1:APP_PORT`.

Recommended proxy responsibilities:

- TLS certificate
- HTTP to HTTPS redirect
- request size and rate limits
- forwarding `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`

## Important environment note

`NEXT_PUBLIC_*` variables are embedded during `next build`, so they must be
available while Docker builds the image. The compose command above passes
`.env.production` both to the build and to the running container.
