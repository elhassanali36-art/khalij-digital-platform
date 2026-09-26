import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, storeRatings } from "@/db/schema";

export async function GET(req: NextRequest) {
  const sellerId = Number(req.nextUrl.searchParams.get("sellerId"));
  if (!Number.isInteger(sellerId)) {
    return NextResponse.json({ error: "معرف المتجر غير صالح" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: storeRatings.id,
      rating: storeRatings.rating,
      review: storeRatings.review,
      buyerName: storeRatings.buyerName,
      createdAt: storeRatings.createdAt,
    })
    .from(storeRatings)
    .where(eq(storeRatings.sellerId, sellerId))
    .orderBy(desc(storeRatings.updatedAt));

  const average = rows.length
    ? rows.reduce((sum, row) => sum + row.rating, 0) / rows.length
    : 0;

  return NextResponse.json({
    average,
    count: rows.length,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: rows.filter((row) => row.rating === stars).length,
    })),
    reviews: rows.filter((row) => row.review).slice(0, 30),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body?.orderId ?? "").trim();
    const buyerEmail = String(body?.buyerEmail ?? "").toLowerCase().trim();
    const rating = Number(body?.rating);
    const review = String(body?.review ?? "").trim().slice(0, 1000) || null;
    const buyerName = String(body?.buyerName ?? "").trim().slice(0, 50) || null;

    if (!orderId || !buyerEmail || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "بيانات التقييم غير صالحة" }, { status: 400 });
    }

    const [purchase] = await db
      .select({
        orderId: orders.id,
        buyerEmail: orders.buyerEmail,
        status: orders.status,
        sellerId: orders.sellerId,
      })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!purchase) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (purchase.status !== "paid") {
      return NextResponse.json({ error: "التقييم متاح بعد الدفع فقط" }, { status: 403 });
    }
    if (purchase.buyerEmail.toLowerCase() !== buyerEmail) {
      return NextResponse.json({ error: "البريد لا يطابق صاحب الطلب" }, { status: 403 });
    }

    const [saved] = await db
      .insert(storeRatings)
      .values({
        orderId: purchase.orderId,
        sellerId: purchase.sellerId,
        rating,
        review,
        buyerName,
      })
      .onConflictDoUpdate({
        target: storeRatings.orderId,
        set: { rating, review, buyerName, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json({
      success: true,
      rating: saved,
      message: "شكرًا، تم حفظ تقييمك الموثق",
    });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ التقييم" }, { status: 500 });
  }
}
