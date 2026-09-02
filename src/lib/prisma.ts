import { PrismaClient } from "@prisma/client";

// A singleton instance, so Next.js development mode (hot reload) does not create a
// new PrismaClient on every refresh.
// That is what prevents "too many connections" errors.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
