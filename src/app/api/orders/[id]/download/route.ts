import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { createProductDownload } from "@/lib/storage";
import { createCatalogFile, getCatalogProduct } from "@/lib/catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [row] = await db
    .select({
      status: orders.status,
      storagePath: products.storagePath,
      downloadUrl: products.downloadUrl,
      catalogKey: products.catalogKey,
      fileName: products.originalFileName,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, id));

  if (!row) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  if (row.status !== "paid") {
    return NextResponse.json(
      { error: "يصبح تحميل المنتج متاحًا بعد تأكيد الدفع فقط" },
      { status: 403 }
    );
  }

  try {
    if (row.catalogKey) {
      const catalogProduct = getCatalogProduct(row.catalogKey);
      if (!catalogProduct) {
        return NextResponse.json({ error: "ملف الكتالوج غير موجود" }, { status: 404 });
      }
      const content = createCatalogFile(catalogProduct);
      const encodedName = encodeURIComponent(row.fileName || catalogProduct.fileName);
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (row.storagePath) {
      const signedUrl = await createProductDownload(row.storagePath, row.fileName);
      return NextResponse.redirect(signedUrl, {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      });
    }

    if (row.downloadUrl) {
      const url = new URL(row.downloadUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error("بروتوكول رابط التحميل غير مسموح");
      }
      return NextResponse.redirect(url, {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      });
    }

    return NextResponse.json({ error: "لا يوجد ملف لهذا المنتج" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تنزيل الملف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
