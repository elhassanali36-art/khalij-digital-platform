import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const configuredDatabaseUrl = process.env.DATABASE_URL?.trim();

/**
 * لا ننشئ اتصالًا فعليًا أثناء `next build`، لكن Next.js يستورد ملفات المسارات
 * عند جمع بيانات الصفحات. لذلك نستخدم عنوانًا احتياطيًا غير متصل بدل رمي خطأ
 * أثناء الاستيراد. في التشغيل الحقيقي يجب ضبط DATABASE_URL في Vercel.
 */
export const isDatabaseConfigured = Boolean(configuredDatabaseUrl);

const connectionString =
  configuredDatabaseUrl ??
  "postgresql://build_only:build_only@127.0.0.1:5432/build_only";

const globalForDb = globalThis as typeof globalThis & {
  __khalijPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__khalijPostgresqlPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__khalijPostgresqlPool = pool;
}

export const db = drizzle(pool);
