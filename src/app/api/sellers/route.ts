import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sellers } from "@/db/schema";
import { normalizeOptionalUrl, SOCIAL_FIELDS } from "@/lib/social";
import { hashPassword, isStrongEnoughPassword } from "@/lib/password";
import { getSessionSeller, isSessionConfigured, setSessionCookie, unauthorized } from "@/lib/session";

function socialValues(body: Record<string, unknown>) {
  const values: Record<string, string | null> = {};
  for (const field of SOCIAL_FIELDS) {
    const raw = String(body[field.key] ?? "").trim();
    const normalized = normalizeOptionalUrl(raw);
    if (raw && !normalized) {
      throw new Error(`رابط ${field.label} غير صالح`);
    }
    values[field.key] = normalized;
  }

  const otherRaw = String(body.otherSocialUrl ?? "").trim();
  const otherUrl = normalizeOptionalUrl(otherRaw);
  if (otherRaw && !otherUrl) throw new Error("الرابط الاجتماعي الإضافي غير صالح");

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
    otherSocialLabel: String(body.otherSocialLabel ?? "").trim().slice(0, 50) || null,
    otherSocialUrl: otherUrl,
  };
}

// معلومات المتجر العامة فقط — لا تكشف المحافظ/PayPal/سبب الإيقاف الإداري
// لأي زائر. البائع نفسه يحصل على بياناته الكاملة عبر /api/me بجلسته الموقّعة.
function publicSellerView(seller: typeof sellers.$inferSelect) {
  return {
    id: seller.id,
    name: seller.name,
    email: seller.email,
    bio: seller.bio,
    avatarEmoji: seller.avatarEmoji,
    avatarColor: seller.avatarColor,
    websiteUrl: seller.websiteUrl,
    whatsappUrl: seller.whatsappUrl,
    telegramUrl: seller.telegramUrl,
    instagramUrl: seller.instagramUrl,
    facebookUrl: seller.facebookUrl,
    xUrl: seller.xUrl,
    tiktokUrl: seller.tiktokUrl,
    youtubeUrl: seller.youtubeUrl,
    linkedinUrl: seller.linkedinUrl,
    snapchatUrl: seller.snapchatUrl,
    otherSocialLabel: seller.otherSocialLabel,
    otherSocialUrl: seller.otherSocialUrl,
    storeStatus: seller.storeStatus,
    createdAt: seller.createdAt,
  };
}

// GET /api/sellers?email= → معلومات متجر عامة فقط (صفحة متجر البائع)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "حدد البريد الإلكتروني" }, { status: 400 });
  }
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.email, email.toLowerCase().trim()));
  if (!seller) {
    return NextResponse.json({ error: "لا يوجد حساب بهذا البريد" }, { status: 404 });
  }
  return NextResponse.json(publicSellerView(seller));
}

// POST → تسجيل بائع جديد بكلمة مرور + تفعيل جلسة فور النجاح
export async function POST(req: NextRequest) {
  if (!isSessionConfigured()) {
    return NextResponse.json(
      { error: "أضف SESSION_SECRET (16 حرفًا على الأقل) في Vercel ثم أعد النشر" },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const {
      name,
      email,
      password,
      bio,
      avatarEmoji,
      avatarColor,
      paypalEmail,
      walletBtc,
      walletEth,
      walletUsdt,
    } = body;

    if (!name || !email || !String(email).includes("@")) {
      return NextResponse.json(
        { error: "الاسم والبريد الإلكتروني مطلوبان" },
        { status: 400 }
      );
    }
    if (!isStrongEnoughPassword(String(password ?? ""))) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }
    if (!paypalEmail && !walletBtc && !walletEth && !walletUsdt) {
      return NextResponse.json(
        { error: "أضف وسيلة استقبال واحدة على الأقل (PayPal أو محفظة رقمية)" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const [existing] = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.email, normalizedEmail));
    if (existing) {
      return NextResponse.json(
        { error: "يوجد حساب بائع مسجل بهذا البريد بالفعل" },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(sellers)
      .values({
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(String(password)),
        bio: bio ? String(bio).trim() : "",
        avatarEmoji: avatarEmoji ? String(avatarEmoji) : "👤",
        avatarColor: avatarColor
          ? String(avatarColor)
          : "from-violet-500 to-fuchsia-500",
        paypalEmail: paypalEmail ? String(paypalEmail).toLowerCase().trim() : null,
        walletBtc: walletBtc ? String(walletBtc).trim() : null,
        walletEth: walletEth ? String(walletEth).trim() : null,
        walletUsdt: walletUsdt ? String(walletUsdt).trim() : null,
        ...socialValues(body),
      })
      .returning();

    const { passwordHash: _passwordHash, ...safeCreated } = created;
    const res = NextResponse.json(safeCreated, { status: 201 });
    setSessionCookie(res, created.id);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث خطأ في الخادم";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PATCH → تعديل الملف الشخصي للبائع الحالي في الجلسة فقط (لا يُقرأ أي بريد/معرّف من الجسم كهوية)
export async function PATCH(req: NextRequest) {
  try {
    const seller = await getSessionSeller(req);
    if (!seller) return unauthorized();

    const body = (await req.json()) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }
    if (!body.paypalEmail && !body.walletBtc && !body.walletEth && !body.walletUsdt) {
      return NextResponse.json(
        { error: "أضف وسيلة استقبال واحدة على الأقل" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(sellers)
      .set({
        name,
        bio: String(body.bio ?? "").trim(),
        avatarEmoji: String(body.avatarEmoji ?? "👤"),
        avatarColor: String(body.avatarColor ?? "from-violet-500 to-fuchsia-500"),
        paypalEmail: body.paypalEmail
          ? String(body.paypalEmail).toLowerCase().trim()
          : null,
        walletBtc: body.walletBtc ? String(body.walletBtc).trim() : null,
        walletEth: body.walletEth ? String(body.walletEth).trim() : null,
        walletUsdt: body.walletUsdt ? String(body.walletUsdt).trim() : null,
        ...socialValues(body),
      })
      .where(eq(sellers.id, seller.id))
      .returning();

    const { passwordHash: _passwordHash, ...safeUpdated } = updated;
    return NextResponse.json(safeUpdated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تعديل الملف";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
