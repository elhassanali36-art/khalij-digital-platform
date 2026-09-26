import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sellers, type Seller } from "@/db/schema";

// جلسة موقّعة (HMAC-SHA256) داخل كوكي HttpOnly. هذه هي آلية الهوية الموثوقة
// من جانب الخادم لكل نقاط API الخاصة بالبائع. لا تُقرأ هوية البائع أبدًا من
// جسم الطلب أو معاملات الاستعلام (sellerEmail/sellerId) — فقط من هذه الجلسة.
const COOKIE_NAME = "khalij_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 يومًا

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET غير مضبوط (أو أقصر من 16 حرفًا) في متغيرات البيئة. أضفه في Vercel."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isSessionConfigured(): boolean {
  return Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16);
}

export function createSessionToken(sellerId: number): string {
  const expires = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${sellerId}.${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [sellerIdRaw, expiresRaw, signature] = parts;
  const payload = `${sellerIdRaw}.${expiresRaw}`;
  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return null;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  const sellerId = Number(sellerIdRaw);
  if (!Number.isInteger(sellerId) || sellerId <= 0) return null;
  return sellerId;
}

export function setSessionCookie(res: NextResponse, sellerId: number) {
  const token = createSessionToken(sellerId);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** يُعيد معرّف البائع من كوكي الجلسة الموقّعة فقط، أو null إن كانت غير صالحة/منتهية. */
export function getSessionSellerId(req: NextRequest): number | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/** يجلب البائع الحالي كاملًا من قاعدة البيانات بالاعتماد على الجلسة فقط. */
export async function getSessionSeller(req: NextRequest): Promise<Seller | null> {
  const sellerId = getSessionSellerId(req);
  if (!sellerId) return null;
  const [seller] = await db.select().from(sellers).where(eq(sellers.id, sellerId));
  if (!seller || seller.storeStatus === "deleted") return null;
  return seller;
}

export function unauthorized(message = "يجب تسجيل الدخول أولًا") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "لا تملك صلاحية الوصول لهذا المورد") {
  return NextResponse.json({ error: message }, { status: 403 });
}
