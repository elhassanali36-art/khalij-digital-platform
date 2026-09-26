import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, sellers, type Seller } from "@/db/schema";
import { getSessionSeller, unauthorized, forbidden } from "@/lib/session";

async function getOwnedProduct(id: number, sellerId: number) {
  const [row] = await db
    .select({ product: products, seller: sellers })
    .from(products)
    .innerJoin(sellers, eq(products.sellerId, sellers.id))
    .where(and(eq(products.id, id), eq(sellers.id, sellerId)));
  return row;
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// يتحقق من الملكية عبر الجلسة الموثوقة فقط. إن كان المنتج موجودًا لكنه يخص
// بائعًا آخر نُرجع 403 (وليس 404) حتى لا نخلط بين "غير موجود" و"غير مصرح"
// عند التدقيق الأمني، مع الحفاظ على 404 فقط عند عدم وجود المنتج إطلاقًا.
async function resolveOwnedOrError(productId: number, seller: Seller) {
  if (!Number.isInteger(productId)) {
    return { error: NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 }) };
  }
  const [exists] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId));
  if (!exists) {
    return { error: NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 }) };
  }
  const row = await getOwnedProduct(productId, seller.id);
  if (!row) {
    return { error: forbidden("لا تملك صلاحية الوصول لهذا المنتج") };
  }
  return { row };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSessionSeller(req);
  if (!seller) return unauthorized();

  const { id } = await params;
  const productId = Number(id);
  const resolved = await resolveOwnedOrError(productId, seller);
  if (resolved.error) return resolved.error;
  const row = resolved.row!;

  return NextResponse.json({
    ...row.product,
    sellerEmail: row.seller.email,
    sellerName: row.seller.name,
    hasStoredFile: Boolean(row.product.storagePath),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const seller = await getSessionSeller(req);
    if (!seller) return unauthorized();

    const { id } = await params;
    const productId = Number(id);
    const resolved = await resolveOwnedOrError(productId, seller);
    if (resolved.error) return resolved.error;
    const row = resolved.row!;

    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const category = String(body?.category ?? "أخرى").trim();
    const price = Number(body?.priceUsd);
    const coverEmoji = String(body?.coverEmoji ?? "📦").trim() || "📦";
    const coverColor =
      String(body?.coverColor ?? "from-violet-500 to-fuchsia-500").trim() ||
      "from-violet-500 to-fuchsia-500";
    const deliveryMode = String(body?.deliveryMode ?? "keep");

    if (!title || !description) {
      return NextResponse.json(
        { error: "العنوان والوصف مطلوبان" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "سعر غير صالح" }, { status: 400 });
    }

    let downloadUrl = row.product.downloadUrl;
    let storagePath = row.product.storagePath;
    let catalogKey = row.product.catalogKey;
    let originalFileName = row.product.originalFileName;
    let fileSize = row.product.fileSize;

    if (deliveryMode === "upload") {
      const nextPath = String(body?.storagePath ?? "").trim();
      // لا يمكن للبائع نسب مسار ملف يخص بائعًا آخر إلى منتجه (منع تعديل storage_path
      // لأصل لا يملكه) — التحقق هنا يفرض أن يبدأ المسار بمعرّف البائع الحالي فقط.
      if (!nextPath || !nextPath.startsWith(`${seller.id}/`)) {
        return NextResponse.json(
          { error: "ارفع ملف المنتج الجديد أولًا" },
          { status: 400 }
        );
      }
      storagePath = nextPath;
      originalFileName = String(body?.originalFileName ?? "ملف المنتج").trim();
      fileSize = Math.round(Number(body?.fileSize ?? 0)) || null;
      downloadUrl = null;
      catalogKey = null;
    } else if (deliveryMode === "external") {
      const nextUrl = String(body?.downloadUrl ?? "").trim();
      if (!validHttpUrl(nextUrl)) {
        return NextResponse.json(
          { error: "أدخل رابط تحميل خارجي صحيحًا يبدأ بـ https://" },
          { status: 400 }
        );
      }
      downloadUrl = nextUrl;
      storagePath = null;
      catalogKey = null;
      originalFileName = null;
      fileSize = null;
    } else if (deliveryMode !== "keep") {
      return NextResponse.json({ error: "خيار تسليم غير صالح" }, { status: 400 });
    }

    if (!storagePath && !downloadUrl && !catalogKey) {
      return NextResponse.json(
        { error: "يجب أن يحتوي المنتج على ملف أو رابط تحميل" },
        { status: 400 }
      );
    }

    // سعر/عنوان/وصف فقط يمكن تعديلهم هنا — لا نسمح أبدًا بتمرير sellerId من
    // العميل، فمالك المنتج ثابت ولا يتغير إلا عبر عملية إدارية صريحة (Phase 6).
    const [updated] = await db
      .update(products)
      .set({
        title,
        description,
        category,
        priceUsd: price.toFixed(2),
        coverEmoji,
        coverColor,
        downloadUrl,
        storagePath,
        catalogKey,
        originalFileName,
        fileSize,
      })
      .where(and(eq(products.id, productId), eq(products.sellerId, seller.id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تعديل المنتج";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
