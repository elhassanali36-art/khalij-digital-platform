import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  products,
  sellers,
  storeRatings,
  withdrawals,
  PLATFORM_FEE_RATE,
} from "@/db/schema";
import {
  getAdminKeyFromRequest,
  isAdminKeyConfigured,
  isValidAdminKey,
} from "@/lib/admin";

function guard(req: NextRequest) {
  if (!isAdminKeyConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_SETUP_KEY غير مضبوط في Vercel" },
      { status: 503 }
    );
  }
  if (!isValidAdminKey(getAdminKeyFromRequest(req))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = guard(req);
  if (denied) return denied;

  const [sellerRows, productStats, salesStats, ratingStats, feeStats] =
    await Promise.all([
      db.select().from(sellers).orderBy(sellers.createdAt),
      db
        .select({
          sellerId: products.sellerId,
          count: sql<number>`count(*)::int`,
        })
        .from(products)
        .groupBy(products.sellerId),
      db
        .select({
          sellerId: orders.sellerId,
          paidOrders: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
          revenue: sql<string>`coalesce(sum(${orders.usdAmount}) filter (where ${orders.status} = 'paid'), 0)`,
        })
        .from(orders)
        .groupBy(orders.sellerId),
      db
        .select({
          sellerId: storeRatings.sellerId,
          count: sql<number>`count(*)::int`,
          average: sql<string>`coalesce(avg(${storeRatings.rating}), 0)`,
        })
        .from(storeRatings)
        .groupBy(storeRatings.sellerId),
      db
        .select({
          totalFees: sql<string>`coalesce(sum(${withdrawals.feeAmount}), 0)`,
          withdrawals: sql<number>`count(*)::int`,
        })
        .from(withdrawals),
    ]);

  const productsBySeller = new Map(productStats.map((row) => [row.sellerId, row]));
  const salesBySeller = new Map(salesStats.map((row) => [row.sellerId, row]));
  const ratingsBySeller = new Map(ratingStats.map((row) => [row.sellerId, row]));

  const stores = sellerRows.map((seller) => {
    const sales = salesBySeller.get(seller.id);
    const ratings = ratingsBySeller.get(seller.id);
    return {
      id: seller.id,
      name: seller.name,
      email: seller.email,
      avatarEmoji: seller.avatarEmoji,
      status: seller.storeStatus,
      moderationReason: seller.moderationReason,
      moderatedAt: seller.moderatedAt,
      createdAt: seller.createdAt,
      products: productsBySeller.get(seller.id)?.count ?? 0,
      paidOrders: sales?.paidOrders ?? 0,
      revenue: Number(sales?.revenue ?? 0),
      ratingCount: ratings?.count ?? 0,
      averageRating: Number(ratings?.average ?? 0),
    };
  });

  return NextResponse.json({
    stores,
    summary: {
      totalStores: stores.length,
      activeStores: stores.filter((store) => store.status === "active").length,
      suspendedStores: stores.filter((store) => store.status === "suspended").length,
      deletedStores: stores.filter((store) => store.status === "deleted").length,
      totalRevenue: stores.reduce((sum, store) => sum + store.revenue, 0),
      totalPaidOrders: stores.reduce((sum, store) => sum + store.paidOrders, 0),
      collectedPlatformFees: Number(feeStats[0]?.totalFees ?? 0),
      withdrawalCount: feeStats[0]?.withdrawals ?? 0,
      currentFeeRate: PLATFORM_FEE_RATE,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const denied = guard(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const sellerId = Number(body?.sellerId);
    const action = String(body?.action ?? "");
    const reason = String(body?.reason ?? "").trim().slice(0, 500);

    if (!Number.isInteger(sellerId) || !["suspend", "restore", "delete"].includes(action)) {
      return NextResponse.json({ error: "بيانات الإجراء غير صالحة" }, { status: 400 });
    }
    if ((action === "suspend" || action === "delete") && reason.length < 3) {
      return NextResponse.json({ error: "اكتب سبب الإجراء الإداري" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: sellers.id, name: sellers.name })
      .from(sellers)
      .where(eq(sellers.id, sellerId));
    if (!existing) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    const status = action === "restore" ? "active" : action === "delete" ? "deleted" : "suspended";
    const [updated] = await db
      .update(sellers)
      .set({
        storeStatus: status,
        moderationReason: action === "restore" ? null : reason,
        moderatedAt: new Date(),
      })
      .where(eq(sellers.id, sellerId))
      .returning({
        id: sellers.id,
        name: sellers.name,
        status: sellers.storeStatus,
        moderationReason: sellers.moderationReason,
      });

    return NextResponse.json({
      success: true,
      store: updated,
      message:
        action === "restore"
          ? "تمت إعادة تفعيل المتجر"
          : action === "delete"
            ? "تم حذف المتجر من الواجهة العامة مع حفظ الطلبات السابقة"
            : "تم إيقاف المتجر",
    });
  } catch {
    return NextResponse.json({ error: "تعذر تنفيذ الإجراء" }, { status: 500 });
  }
}
