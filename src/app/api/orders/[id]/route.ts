import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, sellers } from "@/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [row] = await db
    .select({ order: orders, product: products, seller: sellers })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(sellers, eq(products.sellerId, sellers.id))
    .where(eq(orders.id, id));

  if (!row) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  const { order, product, seller } = row;
  // نُعيد الحد الأدنى فقط: لا حاجة لإظهار بريد المشتري لأي طرف يفتح رابط
  // الطلب (الرابط نفسه هو ما يُثبت المعرفة بالطلب في تدفق الشراء كضيف).
  const { buyerEmail: _buyerEmail, ...publicOrder } = order;
  return NextResponse.json({
    ...publicOrder,
    product: {
      id: product.id,
      title: product.title,
      coverEmoji: product.coverEmoji,
      coverColor: product.coverColor,
      sellerName: seller.name,
      sellerId: seller.id,
      fileName: product.originalFileName,
      // لا نكشف مسار التخزين أو الرابط الأصلي. هذا المسار يتحقق من الدفع أولًا.
      downloadUrl:
        order.status === "paid" &&
        (product.storagePath || product.downloadUrl || product.catalogKey)
          ? `/api/orders/${order.id}/download`
          : null,
    },
  });
}
