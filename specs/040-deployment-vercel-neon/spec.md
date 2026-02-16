# 040 - Deployment (Vercel + Neon)

Environment variables, migrations, and runtime notes.

## Overview

- **Hosting:** Vercel
- **Database:** Neon Postgres
- **Auth:** Auth.js (NextAuth)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXTAUTH_SECRET` | Auth.js secret | Random 32+ chars |
| `NEXTAUTH_URL` | App URL | `https://lux-touch.vercel.app` |
| `CRON_SECRET` | Protect cron routes (MVP: unused) | Random string (see [017](../017-cron-no-support/spec.md)) |
| `GOOGLE_CLIENT_ID` | Optional OAuth | |
| `GOOGLE_CLIENT_SECRET` | Optional OAuth | |
| `GITHUB_ID` | Optional OAuth | |
| `GITHUB_SECRET` | Optional OAuth | |

## Placeholders for Local Dev

```env
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/luxtouch?schema=public"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="local-cron-secret"
```

## Migrations

- Use Prisma Migrate: `prisma migrate deploy` in build step
- Vercel: add to `package.json` build script or use `postinstall` / custom build command
- Neon: create project, copy connection string; run `prisma migrate dev` locally first

## Build Command

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

Or run migrations in a separate step (e.g., GitHub Action before deploy).

## Runtime Notes

- **Serverless:** Each request is a new instance; no long-lived state
- **Neon serverless:** Use `@prisma/adapter-neon` and `@neondatabase/serverless` for cold-start optimization
- **Cron:** MVP: no cron (see [017-cron-no-support](../017-cron-no-support/spec.md)). Future: verify `CRON_SECRET`.
- **Edge:** If using Edge Runtime for API routes, ensure Prisma/Neon adapter supports it

## Vercel Configuration

MVP: No `crons` in vercel.json (see [017](../017-cron-no-support/spec.md)).

Future:
```json
{
  "crons": [{
    "path": "/api/cron/process-bot-jobs",
    "schedule": "* * * * *"
  }]
}
```

## References

- [010-database-schema](../010-database-schema/spec.md) — Prisma schema
- [013-bot-job-scheduler](../013-bot-job-scheduler/spec.md) — Cron
- [002-auth-integration](../002-auth-integration/spec.md) — Auth env vars
