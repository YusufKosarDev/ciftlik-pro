import { PrismaClient } from "@prisma/client";

// Next.js gelistirme modunda (hot-reload) her yenilemede yeni bir PrismaClient
// olusmasini onlemek icin tekil (singleton) bir ornek tutuyoruz.
// Bu, "too many connections" hatalarini engeller.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
