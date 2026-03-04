import { PrismaClient } from "@prisma/client";

export { PrismaClient } from "@prisma/client";
// Elimina "export type *" y exporta los tipos que necesitas explícitamente
export type { User, Session, Repository, Commit, PullRequest, DailyMetric, SyncJob } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;