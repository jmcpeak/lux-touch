# Lux Touch

A Risk-style world conquest game built with Next.js, React, TypeScript, Zustand, and Prisma.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **New Game** to start.

## Tech Stack

- **Framework:** Next.js 15, React 19, TypeScript
- **State:** Zustand
- **Database:** Prisma (Neon Postgres ready)
- **Styling:** Tailwind CSS

## Game Flow

1. **Reinforce** — Place armies on your territories (click to add)
2. **Attack** — Select your territory, then an adjacent enemy
3. **Fortify** — Move armies between adjacent friendly territories
4. **End Turn** — Pass to the next player (bots play automatically)

## Database (Optional)

The game runs with an in-memory store by default. To use Neon Postgres:

1. Create a [Neon](https://neon.tech) project
2. Copy the connection string to `.env`:
   ```
   DATABASE_URL="postgresql://..."
   ```
3. Run migrations: `npx prisma migrate dev`
4. Update the API routes to use Prisma instead of the in-memory store

## Specs

See [specs/README.md](specs/README.md) for the full specification index.

## Deploy to Vercel

```bash
vercel
```

Set `DATABASE_URL` in Vercel environment variables for persistence.
