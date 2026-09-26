import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { getSessionSeller, unauthorized } from "@/lib/session";

// مبيعات البائع الحالي في الجلسة فقط — لا يمكن الاطلاع على مبيعات بائع آخر
// عبر تمرير بريد إلكتروني مختلف.
export async function GET(req: NextRequest) {
  const seller = await getSessionSeller(req);
  if (!seller) return unauthorized();

  const rows = await db
    .select({
      id: orders.id,
      method: orders.method,
      usdAmount: orders.usdAmount,
      cryptoAmount: orders.cryptoAmount,
      status: orders.status,
      verificationStatus: orders.verificationStatus,
      buyerEmail: orders.buyerEmail,
      createdAt: orders.createdAt,
      productTitle: products.title,
      coverEmoji: products.coverEmoji,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.sellerId, seller.id))
    .orderBy(desc(orders.createdAt));

  return NextResponse.json(rows);
}
