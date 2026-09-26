import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, withdrawals, PLATFORM_FEE_RATE } from "@/db/schema";
import { getSessionSeller, unauthorized } from "@/lib/session";

// حالات السحب التي تحجز/تستهلك الرصيد فعليًا. "rejected" تُعيد الرصيد،
// لذلك لا تُحتسب ضمن المسحوب.
const HELD_OR_PAID_STATUSES = ["pending", "approved", "processing", "completed"];

async function getBalance(sellerId: number) {
  const paidOrders = await db
    .select({ usd: orders.usdAmount, status: orders.status })
    .from(orders)
    .where(eq(orders.sellerId, sellerId));
  const totalEarned = paidOrders
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + Number(r.usd), 0);

  const wRows = await db
    .select({ gross: withdrawals.grossAmount, status: withdrawals.status })
    .from(withdrawals)
    .where(eq(withdrawals.sellerId, sellerId));
  const totalWithdrawn = wRows
    .filter((r) => HELD_OR_PAID_STATUSES.includes(r.status))
    .reduce((s, r) => s + Number(r.gross), 0);

  return { totalEarned, totalWithdrawn, available: totalEarned - totalWithdrawn };
}

// GET → الرصيد + سجل السحوبات الخاص بالبائع الحالي في الجلسة فقط
export async function GET(req: NextRequest) {
  const seller = await getSessionSeller(req);
  if (!seller) return unauthorized();

  const balance = await getBalance(seller.id);
  const history = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.sellerId, seller.id))
    .orderBy(desc(withdrawals.createdAt));

  return NextResponse.json({ ...balance, feeRate: PLATFORM_FEE_RATE, history });
}

// POST → طلب سحب جديد بحالة "pending" (لا يُعتمد فورًا — يحتاج مراجعة إدارية).
// يُحسب الرصيد المتاح ويُنشأ السجل داخل معاملة واحدة لمنع سباقات السحب
// المزدوج (طلبان متزامنان يستهلكان نفس الرصيد).
export async function POST(req: NextRequest) {
  try {
    const seller = await getSessionSeller(req);
    if (!seller) return unauthorized();

    const body = await req.json();
    const { amount, method, destination } = body ?? {};
    if (!amount || !method) {
      return NextResponse.json({ error: "بيانات السحب غير مكتملة" }, { status: 400 });
    }

    const gross = Number(amount);
    if (Number.isNaN(gross) || gross <= 0) {
      return NextResponse.json({ error: "مبلغ غير صالح" }, { status: 400 });
    }

    const methodUpper = String(method).toUpperCase();
    const destMap: Record<string, string | null> = {
      PAYPAL: seller.paypalEmail,
      BTC: seller.walletBtc,
      ETH: seller.walletEth,
      USDT: seller.walletUsdt,
    };
    const dest = destination ? String(destination).trim() : destMap[methodUpper];
    if (!dest) {
      return NextResponse.json(
        { error: "لم تُضِف وجهة استلام لهذه الوسيلة في ملفك الشخصي" },
        { status: 400 }
      );
    }

    const fee = gross * PLATFORM_FEE_RATE;
    const net = gross - fee;

    const created = await db.transaction(async (tx) => {
      // قفل صفوف طلبات هذا البائع أثناء المعاملة لمنع قراءة رصيد قديم من طلب
      // سحب متزامن آخر (race condition) قبل إدراج هذا الطلب.
      await tx.execute(
        sql`select id from ${orders} where ${orders.sellerId} = ${seller.id} for update`
      );

      const paidOrders = await tx
        .select({ usd: orders.usdAmount, status: orders.status })
        .from(orders)
        .where(eq(orders.sellerId, seller.id));
      const totalEarned = paidOrders
        .filter((r) => r.status === "paid")
        .reduce((s, r) => s + Number(r.usd), 0);

      const wRows = await tx
        .select({ gross: withdrawals.grossAmount, status: withdrawals.status })
        .from(withdrawals)
        .where(eq(withdrawals.sellerId, seller.id));
      const totalWithdrawn = wRows
        .filter((r) => HELD_OR_PAID_STATUSES.includes(r.status))
        .reduce((s, r) => s + Number(r.gross), 0);

      const available = totalEarned - totalWithdrawn;
      if (gross > available + 0.001) {
        throw new Error(`الرصيد المتاح للسحب هو $${available.toFixed(2)} فقط`);
      }

      const [row] = await tx
        .insert(withdrawals)
        .values({
          sellerId: seller.id,
          grossAmount: gross.toFixed(2),
          feeAmount: fee.toFixed(2),
          netAmount: net.toFixed(2),
          method: methodUpper,
          destination: dest,
          status: "pending",
        })
        .returning();
      return row;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث خطأ في الخادم";
    const status = message.startsWith("الرصيد المتاح") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
