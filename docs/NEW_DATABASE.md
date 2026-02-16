# Create a New Lux-Touch Database (Separate from Wordle)

Lux-touch needs its own database. Do not reuse the wordle database.

## Option 1: Neon Dashboard (recommended)

1. Go to [Neon Console](https://console.neon.tech)
2. Click **New Project**
3. Name it `lux-touch` (or similar)
4. Choose a region
5. Click **Create Project**
6. Copy the **Connection string** (starts with `postgresql://`)
7. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://..."
   ```
8. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

## Option 2: Neon CLI

```bash
# Install
brew install neonctl

# Login
neon auth

# Create project
neon projects create --name lux-touch

# Get connection string (shown after create, or)
neon connection-string lux-touch
```

Add the connection string to `.env.local`, then run `npx prisma migrate dev`.
