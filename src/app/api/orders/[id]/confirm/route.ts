import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

// أنماط تنسيق أولية لمعرّفات المعاملات حسب الشبكة (لا تُثبت وجود المعاملة،
// فقط تستبعد المدخلات غير الصالحة شكليًا قبل أي تحقق لاحق).
const TX_HASH_PATTERNS: Record<string, RegExp> = {
  BTC: /^[a-fA-F0-9]{64}$/,
  ETH: /^0x[a-fA-F0-9]{64}$/,
  USDT: /^(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})$/, // ERC-20 أو TRC-20
};

// ⚠️ لا يوجد مزوّد تحقق من البلوكتشين (Blockchain API) مُهيّأ حاليًا في هذا
// المشروع (لا مفاتيح API، لا تكامل مع Coinbase Commerce/NOWPayments وغيرها).
// لذلك لا يمكن التحقق فعليًا من وجود/تأكيد المعاملة على الشبكة، ومطلقًا لا
// يجوز اعتماد الطلب "مدفوعًا" بمجرد إدخال معرّف معاملة (وهذا ما كان يحدث
// سابقًا). بدلًا من ذلك: نتحقق مما يمكن التحقق منه فعلًا (شكل المعرّف، عدم
// تكراره على طلب آخر) ثم نضع الطلب في حالة "pending_verification" لمراجعة
// إدارية فعلية عبر /api/admin/orders/verify. لتفعيل تحقق تلقائي حقيقي على
// السلسلة يجب إضافة مزوّد (مثل Etherscan/Blockstream) عبر متغيرات بيئة.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let txHash = "";
  try {
    const body = await req.json();
    txHash = String(body?.txHash ?? "").trim();
  } catch {
    // بدون جسم
  }

  if (!txHash || txHash.length < 10) {
    return NextResponse.json(
      { error: "أدخل معرف المعاملة (TxID) الصحيح بعد إتمام التحويل" },
      { status: 400 }
    );
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json(order);
  }
  if (order.status === "rejected") {
    return NextResponse.json(
      { error: "تم رفض هذا الطلب سابقًا، يرجى التواصل مع الدعم" },
      { status: 409 }
    );
  }

  if (order.method !== "PAYPAL") {
    const pattern = TX_HASH_PATTERNS[order.method];
    if (pattern && !pattern.test(txHash)) {
      return NextResponse.json(
        { error: "تنسيق معرّف المعاملة غير مطابق لهذه الشبكة" },
        { status: 400 }
      );
    }
  }

  // منع استخدام نفس معرّف المعاملة لتأكيد أكثر من طلب (مضمون أيضًا بفهرس
  // فريد على مستوى قاعدة البيانات orders_tx_hash_unique كخط دفاع أخير).
  const [duplicate] = await db.select({ id: orders.id }).from(orders).where(eq(orders.txHash, txHash));
  if (duplicate && duplicate.id !== order.id) {
    return NextResponse.json(
      { error: "معرّف المعاملة هذا مستخدم بالفعل لطلب آخر" },
      { status: 409 }
    );
  }

  try {
    const [updated] = await db
      .update(orders)
      .set({
        status: "pending_verification",
        txHash,
        verificationStatus: "unverified",
      })
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json({
      ...updated,
      message:
        "تم استلام معرّف المعاملة وهو الآن قيد المراجعة. سيتحول الطلب إلى «مدفوع» بعد التحقق.",
    });
  } catch (error) {
    // فهرس orders_tx_hash_unique قد يرفض الإدراج في حالة سباق نادر بين طلبين
    // متزامنين بنفس المعرّف.
    if (error instanceof Error && error.message.includes("orders_tx_hash_unique")) {
      return NextResponse.json(
        { error: "معرّف المعاملة هذا مستخدم بالفعل لطلب آخر" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "تعذر حفظ معرّف المعاملة" }, { status: 500 });
  }
}
