import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, sellers } from "@/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  const [row] = await db
    .select({
      id: products.id,
      title: products.title,
      description: products.description,
      category: products.category,
      priceUsd: products.priceUsd,
      coverEmoji: products.coverEmoji,
      coverColor: products.coverColor,
      salesCount: products.salesCount,
      originalFileName: products.originalFileName,
      fileSize: products.fileSize,
      createdAt: products.createdAt,
      sellerId: sellers.id,
      sellerName: sellers.name,
      sellerAvatar: sellers.avatarEmoji,
    })
    .from(products)
    .innerJoin(sellers, eq(products.sellerId, sellers.id))
    .where(
      and(eq(products.id, productId), eq(sellers.storeStatus, "active"))
    );

  if (!row) {
    return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  }
  return NextResponse.json(row);
}
