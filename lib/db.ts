import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client only when DATABASE_URL is available
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a mock during build time
    console.warn('DATABASE_URL not set, using mock Prisma client')
    return new Proxy({} as PrismaClient, {
      get() {
        return () => Promise.resolve(null)
      },
    })
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
