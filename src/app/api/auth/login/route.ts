import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sellers } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { isSessionConfigured, setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  if (!isSessionConfigured()) {
    return NextResponse.json(
      { error: "أضف SESSION_SECRET (16 حرفًا على الأقل) في Vercel ثم أعد النشر" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    const [seller] = await db.select().from(sellers).where(eq(sellers.email, email));

    // رسالة خطأ موحّدة بغض النظر عن كون الحساب موجودًا أم لا، لمنع تعداد الحسابات (user enumeration).
    const genericError = NextResponse.json(
      { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
      { status: 401 }
    );

    if (!seller || seller.storeStatus === "deleted") return genericError;

    if (!seller.passwordHash) {
      return NextResponse.json(
        {
          error:
            "هذا الحساب أُنشئ قبل تفعيل نظام تسجيل الدخول الآمن. عيّن كلمة مرور جديدة أولًا.",
          requiresClaim: true,
        },
        { status: 409 }
      );
    }

    if (!verifyPassword(password, seller.passwordHash)) return genericError;

    const res = NextResponse.json({
      id: seller.id,
      name: seller.name,
      email: seller.email,
    });
    setSessionCookie(res, seller.id);
    return res;
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
