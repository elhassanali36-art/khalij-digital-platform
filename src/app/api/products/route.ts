import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, sellers } from "@/db/schema";
import { getSessionSeller, unauthorized } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sellerEmail = req.nextUrl.searchParams.get("seller");
  const base = db
    .select({ product: products, seller: sellers })
    .from(products)
    .innerJoin(sellers, eq(products.sellerId, sellers.id));

  // ملاحظة: تصفية المنتجات حسب بريد بائع هي استعلام عرض عام لصفحة متجره
  // (نفس بيانات /api/products?seller= المعروضة أصلًا للزوار)، وليست عملية
  // إدارية أو مصدرًا لهوية موثوقة — لا تُستخدم هذه القيمة لأي تفويض.
  const rows = sellerEmail
    ? await base
        .where(eq(sellers.email, sellerEmail.toLowerCase().trim()))
        .orderBy(desc(products.createdAt))
    : await base
        .where(eq(sellers.storeStatus, "active"))
        .orderBy(desc(products.createdAt));

  return NextResponse.json(
    rows.map(({ product, seller }) => ({
      id: product.id,
      sellerId: product.sellerId,
      title: product.title,
      description: product.description,
      category: product.category,
      priceUsd: product.priceUsd,
      coverEmoji: product.coverEmoji,
      coverColor: product.coverColor,
      salesCount: product.salesCount,
      originalFileName: product.originalFileName,
      fileSize: product.fileSize,
      createdAt: product.createdAt,
      sellerName: seller.name,
      sellerAvatar: seller.avatarEmoji,
    }))
  );
}

// POST → إنشاء منتج جديد للبائع الحالي في الجلسة فقط (لا يُقرأ sellerEmail من الجسم كهوية)
export async function POST(req: NextRequest) {
  try {
    const seller = await getSessionSeller(req);
    if (!seller) return unauthorized();

    const body = await req.json();
    const {
      title,
      description,
      category,
      priceUsd,
      coverEmoji,
      coverColor,
      downloadUrl,
      storagePath,
      originalFileName,
      fileSize,
    } = body ?? {};

    if (!title || !description || !priceUsd) {
      return NextResponse.json(
        { error: "يرجى تعبئة جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }
    if (!downloadUrl && !storagePath) {
      return NextResponse.json(
        { error: "ارفع ملف المنتج أو أضف رابط تحميل خارجي" },
        { status: 400 }
      );
    }
    if (seller.storeStatus !== "active") {
      return NextResponse.json(
        { error: "متجرك موقوف حاليًا ولا يمكن نشر منتجات جديدة" },
        { status: 403 }
      );
    }

    const price = Number(priceUsd);
    if (Number.isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "سعر غير صالح" }, { status: 400 });
    }

    const cleanStoragePath = storagePath ? String(storagePath).trim() : null;
    if (cleanStoragePath && !cleanStoragePath.startsWith(`${seller.id}/`)) {
      return NextResponse.json({ error: "مسار ملف المنتج غير صالح" }, { status: 400 });
    }

    const [created] = await db
      .insert(products)
      .values({
        sellerId: seller.id,
        title: String(title).trim(),
        description: String(description).trim(),
        category: category ? String(category) : "أخرى",
        priceUsd: price.toFixed(2),
        coverEmoji: coverEmoji || "📦",
        coverColor: coverColor || "from-violet-500 to-fuchsia-500",
        downloadUrl: downloadUrl ? String(downloadUrl).trim() : null,
        storagePath: cleanStoragePath,
        originalFileName: originalFileName ? String(originalFileName).trim() : null,
        fileSize: fileSize ? Math.round(Number(fileSize)) : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
