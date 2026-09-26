import { pool, isDatabaseConfigured } from "@/db";

export const dynamic = "force-dynamic";

const EXPECTED_TABLES = [
  "sellers",
  "products",
  "orders",
  "withdrawals",
  "store_ratings",
] as const;

const EXPECTED_COLUMNS: Record<string, string[]> = {
  sellers: [
    "id",
    "name",
    "email",
    "store_status",
    "created_at",
  ],
  products: [
    "id",
    "seller_id",
    "title",
    "description",
    "price_usd",
    "created_at",
  ],
  orders: [
    "id",
    "seller_id",
    "product_id",
    "buyer_email",
    "status",
    "created_at",
  ],
  withdrawals: [
    "id",
    "seller_id",
    "gross_amount",
    "fee_amount",
    "net_amount",
  ],
  store_ratings: ["id", "order_id", "seller_id", "rating"],
};

export async function GET() {
  if (!isDatabaseConfigured) {
    return Response.json(
      {
        ok: false,
        database: "not-configured",
        error: "DATABASE_URL is missing in this Vercel environment",
      },
      { status: 503 }
    );
  }

  try {
    const tableResult = await pool.query<{
      table_name: string;
    }>(
      `select table_name
       from information_schema.tables
       where table_schema = 'public' and table_name = any($1::text[])`,
      [EXPECTED_TABLES]
    );
    const existingTables = new Set(tableResult.rows.map((row) => row.table_name));
    const missingTables = EXPECTED_TABLES.filter((table) => !existingTables.has(table));

    const columnResult = await pool.query<{
      table_name: string;
      column_name: string;
    }>(
      `select table_name, column_name
       from information_schema.columns
       where table_schema = 'public' and table_name = any($1::text[])`,
      [EXPECTED_TABLES]
    );
    const columns = new Map<string, Set<string>>();
    for (const row of columnResult.rows) {
      if (!columns.has(row.table_name)) columns.set(row.table_name, new Set());
      columns.get(row.table_name)?.add(row.column_name);
    }

    const missingColumns = Object.entries(EXPECTED_COLUMNS).flatMap(
      ([table, requiredColumns]) => {
        if (!existingTables.has(table)) return [];
        const existing = columns.get(table) ?? new Set<string>();
        return requiredColumns
          .filter((column) => !existing.has(column))
          .map((column) => `${table}.${column}`);
      }
    );

    if (missingTables.length > 0 || missingColumns.length > 0) {
      return Response.json(
        {
          ok: false,
          database: "connected",
          schema: "incomplete",
          missingTables,
          missingColumns,
          action: "Apply database-setup.sql to this exact PostgreSQL database",
        },
        { status: 503 }
      );
    }

    const counts = await pool.query<{
      sellers: number;
      products: number;
      orders: number;
      withdrawals: number;
      ratings: number;
    }>(
      `select
        (select count(*)::int from public.sellers) as sellers,
        (select count(*)::int from public.products) as products,
        (select count(*)::int from public.orders) as orders,
        (select count(*)::int from public.withdrawals) as withdrawals,
        (select count(*)::int from public.store_ratings) as ratings`
    );

    return Response.json({
      ok: true,
      database: "connected",
      schema: "ready",
      tables: EXPECTED_TABLES,
      counts: counts.rows[0],
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        database: "connection-failed",
        error: "Database connection failed",
        detail: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 503 }
    );
  }
}
