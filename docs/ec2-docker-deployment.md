# EC2 Docker Deployment

This guide adds a self-hosted deployment option for SideSpark on a single AWS EC2 instance using Docker and Nginx.

## Architecture

- `frontend` runs as a Next.js production container
- `backend` runs as an Express + Prisma production container
- `nginx` terminates public HTTP traffic and reverse-proxies by hostname
- PostgreSQL stays external to this stack, for example on Amazon RDS or another managed PostgreSQL provider

Recommended public routing:

- `app.example.com` -> frontend
- `api.example.com` -> backend

This split is intentional. The frontend already uses NextAuth under `/api/auth/*`, so putting the backend under the same `/api/*` path behind Nginx would create route conflicts.

## Files

- `frontend/Dockerfile`
- `backend/Dockerfile`
- `deploy/ec2/docker-compose.yml`
- `deploy/ec2/.env.example`
- `deploy/ec2/nginx/default.conf.template`

## Prerequisites

- Ubuntu EC2 instance with Docker Engine and Docker Compose plugin installed
- A PostgreSQL database reachable from the instance
- Two DNS records pointing at the EC2 instance:
  - `app.example.com`
  - `api.example.com`

## 1. Prepare the server

Install Docker on the EC2 host, then clone the repository onto the instance.

Example directories in this guide assume:

```bash
cd /srv
git clone <your-repo-url> SideSpark
cd SideSpark
```

## 2. Create the EC2 env file

Copy the example file:

```bash
cp deploy/ec2/.env.example deploy/ec2/.env
```

Set real values in `deploy/ec2/.env`:

```env
APP_DOMAIN=app.example.com
APP_URL=https://app.example.com
API_DOMAIN=api.example.com
API_URL=https://api.example.com

DATABASE_URL=postgresql://user:password@db-host:5432/sidespark?schema=public

NEXTAUTH_SECRET=<strong-random-secret>
JWT_SECRET=<strong-random-secret>
REFRESH_TOKEN_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

Optional mail settings can also be set there if production email is needed.

## 3. Start the stack

Run from the repository root:

```bash
docker compose --env-file deploy/ec2/.env -f deploy/ec2/docker-compose.yml up -d --build
```

This does the following:

- builds the frontend image from `frontend/Dockerfile`
- builds the backend image from `backend/Dockerfile`
- starts Nginx on port `80`
- runs `prisma migrate deploy` automatically before the backend process starts

## 4. Verify

Check container status:

```bash
docker compose --env-file deploy/ec2/.env -f deploy/ec2/docker-compose.yml ps
```

Check logs:

```bash
docker compose --env-file deploy/ec2/.env -f deploy/ec2/docker-compose.yml logs -f
```

Verify endpoints:

- `http://app.example.com`
- `http://api.example.com/health`

## 5. Updating

Pull the latest code, then rebuild and restart:

```bash
git pull
docker compose --env-file deploy/ec2/.env -f deploy/ec2/docker-compose.yml up -d --build
```

## HTTPS

The provided Nginx template is HTTP-ready. For production HTTPS, put this stack behind one of these:

- an AWS Application Load Balancer with TLS termination
- Cloudflare proxy with Full/Strict SSL
- Certbot/Nginx certificates mounted into the Nginx container

If you enable HTTPS, keep these values aligned:

- `APP_URL=https://app.example.com`
- `API_URL=https://api.example.com`

## Notes

- Backend CORS should allow the frontend domain through `FRONTEND_URL=${APP_URL}`
- `NEXT_PUBLIC_API_URL` should point to the public API domain, not the internal Docker hostname
- This deployment path does not provision PostgreSQL for you
