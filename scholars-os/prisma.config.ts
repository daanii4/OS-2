import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Load .env from this package root (Prisma CLI may skip default dotenv when using prisma.config).
const configDir = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.join(configDir, '.env') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
    directUrl: env('DIRECT_URL'),
  },
})
