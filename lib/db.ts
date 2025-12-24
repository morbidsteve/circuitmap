import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy initialization to avoid build-time errors
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

// Export a proxy that lazy-loads the client
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrismaClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
