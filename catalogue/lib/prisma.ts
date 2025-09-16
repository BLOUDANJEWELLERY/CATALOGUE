// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent multiple instances of Prisma Client in development
  // This is important for Next.js hot reloads
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error"], // optional, helpful for debugging
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;