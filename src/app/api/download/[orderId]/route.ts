import { NextResponse } from "next/server";

/**
 * مسار قديم متروك للتوافق مع المستودعات التي رُفعت إليها نسخ سابقة.
 * التنزيل المحمي الحالي يتم من /api/orders/[id]/download بعد التحقق من الدفع.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "هذا مسار قديم. افتح صفحة طلبك المدفوع واستخدم زر تحميل المنتج.",
    },
    { status: 410 }
  );
}
