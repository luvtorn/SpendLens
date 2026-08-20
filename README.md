# SpendLens

SpendLens is organized as two independently deployable Node.js applications:

- `apps/web` — Next.js frontend on port `3000`.
- `apps/api` — NestJS REST API on port `3001`, the sole owner of Prisma, PostgreSQL, and financial business logic.

The browser-facing application communicates with the API over HTTP. The applications do not require a shared domain, process, filesystem, or hosting provider.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 16-compatible database

Install workspace dependencies:

```bash
npm install
```

## Environment

Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env.local`.

Backend variables:

```text
DATABASE_URL=postgresql://spendlens:spendlens@localhost:5432/spendlens?schema=public
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_ACCESS_SECRET=replace-with-at-least-32-random-characters
JWT_REFRESH_SECRET=replace-with-a-different-32-character-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CSRF_SECRET=replace-with-another-32-character-random-secret
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
```

Frontend variable:

```text
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Production values must use the independently deployed HTTPS origins. `FRONTEND_URL` is an explicit CORS allowlist and may contain multiple comma-separated approved origins.

Access and refresh tokens are delivered only through HttpOnly cookies. In local development, `SameSite=lax` and non-secure cookies work through the Next.js same-origin auth proxy. Production must use HTTPS; set `COOKIE_SECURE=true`. If direct cross-site cookies are required, use `COOKIE_SAME_SITE=none` together with secure cookies. Leave `COOKIE_DOMAIN` unset unless an explicitly shared parent domain is intended.

## Local PostgreSQL

Use an existing local PostgreSQL installation, or start the official open-source image without adding a paid service:

```bash
docker run --name spendlens-postgres -e POSTGRES_USER=spendlens -e POSTGRES_PASSWORD=spendlens -e POSTGRES_DB=spendlens -p 5432:5432 -d postgres:16
```

Then generate Prisma Client, apply migrations, and load the deterministic demo dataset:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The development seed creates this local-only account:

```text
email: demo@spendlens.local
password: SpendLensDemo123!
```

The password is hashed with Argon2id before it is written to PostgreSQL.

## Development

Run the applications in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Useful workspace-wide checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

No paid service is required for local development. Uploaded-document persistence is not implemented in this milestone; production files must eventually use a private provider-independent object-storage adapter rather than an application filesystem.

Authentication uses short-lived access JWTs, rotating server-validated refresh sessions, signed double-submit CSRF protection, and an in-memory NestJS login throttle. The throttle is suitable for a single MVP instance only; a distributed deployment will eventually require a shared limiter, but Redis is intentionally not introduced in this milestone.
