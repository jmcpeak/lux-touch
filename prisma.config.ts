import { config } from 'dotenv';

// Load .env.local first (Next.js convention), then .env
config({ path: '.env.local' });
config();
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
