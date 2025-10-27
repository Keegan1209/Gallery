import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.ykexfunisavmzmprwlbj:jE59xf3ewTMsCORX@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma