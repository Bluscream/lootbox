import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Resolve relative SQLite database URL to absolute path relative to process.cwd()
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:")) {
  const dbPath = process.env.DATABASE_URL.substring(5); // Remove 'file:'
  if (!path.isAbsolute(dbPath)) {
    const resolvedPath = path.resolve(process.cwd(), "prisma", dbPath);
    process.env.DATABASE_URL = `file:${resolvedPath}`;
  }
}

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

