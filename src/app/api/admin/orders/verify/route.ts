import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
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

// هذا هو المسار الوحيد المخوّل لوضع طلب في حالة "paid". يُستخدم بعد أن يتحقق
// موظف مخوّل يدويًا من المعاملة على مستكشف الشبكة (أو من تكامل تلقائي مستقبلي)
// — وليس بمجرد إدخال العميل لمعرّف معاملة.
export async function POST(req: NextRequest) {
  const denied = guard(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const orderId = String(body?.orderId ?? "").trim();
    const decision = String(body?.decision ?? ""); // "verified" | "failed"
    const network = String(body?.network ?? "").trim() || null;
    const asset = String(body?.asset ?? "").trim() || null;
    const amount = body?.amount != null ? String(body.amount) : null;
    const address = String(body?.address ?? "").trim() || null;

    if (!orderId || !["verified", "failed"].includes(decision)) {
      return NextResponse.json({ error: "بيانات التحقق غير صالحة" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
      if (!order) return { error: "الطلب غير موجود" as const };
      if (order.status === "paid") return { error: "الطلب مدفوع بالفعل" as const };
      if (order.status !== "pending_verification") {
        return { error: `لا يمكن التحقق من طلب في حالة "${order.status}"` as const };
      }

      if (decision === "failed") {
        const [updated] = await tx
          .update(orders)
          .set({ status: "rejected", verificationStatus: "failed", verifiedAt: new Date() })
          .where(eq(orders.id, orderId))
          .returning();
        return { updated };
      }

      const [updated] = await tx
        .update(orders)
        .set({
          status: "paid",
          paidAt: new Date(),
          verificationStatus: "verified",
          verifiedAt: new Date(),
          verifiedNetwork: network,
          verifiedAsset: asset,
          verifiedAmount: amount,
          verifiedAddress: address,
        })
        .where(eq(orders.id, orderId))
        .returning();

      await tx
        .update(products)
        .set({ salesCount: sql`${products.salesCount} + 1` })
        .where(eq(products.id, order.productId));

      return { updated };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, order: result.updated });
  } catch {
    return NextResponse.json({ error: "تعذر تنفيذ التحقق" }, { status: 500 });
  }
}
