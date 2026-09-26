import { NextRequest, NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, sellers } from "@/db/schema";
import { CATALOG_PRODUCTS, createCatalogFile } from "@/lib/catalog";
import { normalizeOptionalUrl, SOCIAL_FIELDS } from "@/lib/social";
import { isAdminKeyConfigured, isValidAdminKey, getAdminKeyFromRequest } from "@/lib/admin";

function optional(value: unknown) {
  const result = String(value ?? "").trim();
  return result || null;
}

function socialValues(body: Record<string, unknown>) {
  const values: Record<string, string | null> = {};
  for (const field of SOCIAL_FIELDS) {
    const raw = String(body[field.key] ?? "").trim();
    const normalized = normalizeOptionalUrl(raw);
    if (raw && !normalized) throw new Error(`رابط ${field.label} غير صالح`);
    values[field.key] = normalized;
  }
  const otherRaw = String(body.otherSocialUrl ?? "").trim();
  const otherSocialUrl = normalizeOptionalUrl(otherRaw);
  if (otherRaw && !otherSocialUrl) throw new Error("الرابط الإضافي غير صالح");

  return {
    websiteUrl: values.websiteUrl,
    whatsappUrl: values.whatsappUrl,
    telegramUrl: values.telegramUrl,
    instagramUrl: values.instagramUrl,
    facebookUrl: values.facebookUrl,
    xUrl: values.xUrl,
    tiktokUrl: values.tiktokUrl,
    youtubeUrl: values.youtubeUrl,
    linkedinUrl: values.linkedinUrl,
    snapchatUrl: values.snapchatUrl,
    otherSocialLabel: optional(body.otherSocialLabel)?.slice(0, 50) ?? null,
    otherSocialUrl,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    // موحّد مع بقية المسارات الإدارية: يُقرأ مفتاح الإدارة من الترويسة
    // (Authorization: Bearer أو x-admin-key) وليس من جسم الطلب، حتى لا ينتهي
    // به المطاف في سجلات تسجّل جسم الطلبات.
    const adminKey = getAdminKeyFromRequest(req);

    if (!isAdminKeyConfigured()) {
      return NextResponse.json(
        { error: "أضف ADMIN_SETUP_KEY بطول 16 حرفًا على الأقل في Vercel ثم أعد النشر" },
        { status: 503 }
      );
    }
    if (!isValidAdminKey(adminKey)) {
      return NextResponse.json({ error: "مفتاح الإدارة غير صحيح" }, { status: 401 });
    }

    const email = String(body.email ?? "").toLowerCase().trim();
    const name = String(body.name ?? "منصة الخليج").trim();
    const paypalEmail = optional(body.paypalEmail)?.toLowerCase() ?? null;
    const walletBtc = optional(body.walletBtc);
    const walletEth = optional(body.walletEth);
    const walletUsdt = optional(body.walletUsdt);

    if (!email.includes("@") || !name) {
      return NextResponse.json({ error: "اسم المتجر وبريد المالك مطلوبان" }, { status: 400 });
    }
    if (!paypalEmail && !walletBtc && !walletEth && !walletUsdt) {
      return NextResponse.json(
        { error: "أدخل PayPal أو عنوان محفظة واحدة على الأقل لاستقبال المدفوعات" },
        { status: 400 }
      );
    }
    if (body.confirmTransfer !== true) {
      return NextResponse.json(
        { error: "يجب تأكيد نقل جميع المنتجات الحالية إلى متجرك" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(sellers)
        .where(eq(sellers.email, email));

      const sellerData = {
        name,
        bio:
          String(body.bio ?? "").trim() ||
          "المتجر الرسمي لمنصة الخليج للمنتجات الرقمية — أدوات وقوالب وموارد عربية قابلة للتنزيل.",
        avatarEmoji: String(body.avatarEmoji ?? "خ"),
        avatarColor: String(body.avatarColor ?? "from-amber-400 to-orange-500"),
        paypalEmail,
        walletBtc,
        walletEth,
        walletUsdt,
        storeStatus: "active",
        moderationReason: null,
        moderatedAt: new Date(),
        ...socialValues(body),
      };

      const [owner] = existing
        ? await tx
            .update(sellers)
            .set(sellerData)
            .where(eq(sellers.id, existing.id))
            .returning()
        : await tx
            .insert(sellers)
            .values({ email, ...sellerData })
            .returning();

      const catalogKeys = CATALOG_PRODUCTS.map((product) => product.key);
      const existingCatalogRows = await tx
        .select({ key: products.catalogKey })
        .from(products)
        .where(inArray(products.catalogKey, catalogKeys));
      const existingKeys = new Set(
        existingCatalogRows.map((row) => row.key).filter((key): key is string => Boolean(key))
      );
      const missing = CATALOG_PRODUCTS.filter((product) => !existingKeys.has(product.key));

      if (missing.length > 0) {
        await tx
          .insert(products)
          .values(
            missing.map((product) => ({
              catalogKey: product.key,
              sellerId: owner.id,
              title: product.title,
              description: product.description,
              category: product.category,
              priceUsd: product.priceUsd.toFixed(2),
              coverEmoji: product.coverEmoji,
              coverColor: product.coverColor,
              originalFileName: product.fileName,
              fileSize: Buffer.byteLength(createCatalogFile(product), "utf8"),
              downloadUrl: null,
              storagePath: null,
            }))
          )
          .onConflictDoNothing();
      }

      // ⚠️ إصلاح أمني: كانت هذه العملية تنقل ملكية كل المنتجات في قاعدة
      // البيانات (بما فيها منتجات أي بائع مستقل آخر) إلى صاحب الكتالوج فور
      // تشغيلها — خطأ جسيم في ملكية المتجر. الغرض الحقيقي هو فقط ضمان أن
      // منتجات الكتالوج الرسمية (التي تحمل catalogKey) تابعة لمتجر الكتالوج،
      // لذلك نقيّد النقل بهذه المنتجات حصرًا ولا نلمس ملكية أي منتج آخر.
      await tx
        .update(products)
        .set({ sellerId: owner.id })
        .where(inArray(products.catalogKey, catalogKeys));

      const [counts] = await tx
        .select({
          total: sql<number>`count(*)::int`,
          catalog: sql<number>`count(${products.catalogKey})::int`,
        })
        .from(products)
        .where(eq(products.sellerId, owner.id));

      return {
        owner,
        addedNow: missing.length,
        totalProducts: counts?.total ?? 0,
        catalogProducts: counts?.catalog ?? 0,
      };
    });

    const { passwordHash: _passwordHash, ...safeOwner } = result.owner;
    return NextResponse.json({
      success: true,
      ...result,
      owner: safeOwner,
      storePath: `/sellers/${result.owner.id}`,
      message: `تم تجهيز متجرك ونقل المنتجات وإضافة ${result.addedNow} منتج جديد بنجاح`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تجهيز الكتالوج";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
