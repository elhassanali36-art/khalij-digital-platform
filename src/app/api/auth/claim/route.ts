import { NextRequest, NextResponse } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { sellers } from "@/db/schema";
import { hashPassword, isStrongEnoughPassword } from "@/lib/password";
import { isSessionConfigured, setSessionCookie } from "@/lib/session";
import {
  getAdminKeyFromRequest,
  isAdminKeyConfigured,
  isValidAdminKey,
} from "@/lib/admin";

// جسر ترحيل: الحسابات التي أُنشئت قبل تفعيل نظام المصادقة ليس لديها كلمة مرور.
//
// ⚠️ إصلاح أمني حرج: كانت النسخة السابقة من هذا المسار تسمح لأي شخص يعرف
// بريد بائع (وهو غالبًا معروض علنًا في صفحة متجره العامة) بتعيين كلمة مرور
// لذلك الحساب والحصول على جلسة موثّقة دون أي إثبات لملكية البريد — أي
// استيلاء كامل على الحساب (Account Takeover). بما أنه لا يوجد مزوّد بريد
// إلكتروني في المشروع لإرسال رابط تأكيد حقيقي، لا يمكن التحقق من ملكية
// البريد تلقائيًا. لذلك أصبح هذا المسار يتطلب الآن تفويضًا إداريًا صريحًا
// (نفس مفتاح ADMIN_SETUP_KEY المستخدم في كل مسارات /api/admin/*) — أي أن
// موظفًا موثوقًا يتحقق من هوية صاحب الحساب خارج النظام (مثلًا عبر قناة
// تواصل سابقة معروفة) قبل تنفيذ هذا الإجراء نيابة عنه. هذا "email + password
// فقط دون أي تفويض" لم يعد كافيًا إطلاقًا.
export async function POST(req: NextRequest) {
  if (!isSessionConfigured()) {
    return NextResponse.json(
      { error: "أضف SESSION_SECRET (16 حرفًا على الأقل) في Vercel ثم أعد النشر" },
      { status: 503 }
    );
  }
  if (!isAdminKeyConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_SETUP_KEY غير مضبوط في Vercel" },
      { status: 503 }
    );
  }
  if (!isValidAdminKey(getAdminKeyFromRequest(req))) {
    return NextResponse.json(
      {
        error:
          "هذا الإجراء يتطلب تفويضًا إداريًا. تواصل مع الدعم للتحقق من ملكية الحساب أولًا.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");

    if (!email || !isStrongEnoughPassword(password)) {
      return NextResponse.json(
        { error: "أدخل بريدًا صحيحًا وكلمة مرور من 8 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(sellers)
      .set({ passwordHash: hashPassword(password) })
      .where(and(eq(sellers.email, email), isNull(sellers.passwordHash)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        {
          error:
            "لا يوجد حساب بهذا البريد بحاجة لتعيين كلمة مرور (قد يكون معيّنًا مسبقًا). استخدم تسجيل الدخول العادي.",
        },
        { status: 409 }
      );
    }

    // ملاحظة: لا نُنشئ جلسة تلقائية هنا للمتصفح الذي أرسل الطلب — فالمرسل هو
    // لوحة الإدارة، وليس بالضرورة متصفح صاحب الحساب نفسه. صاحب الحساب يسجّل
    // الدخول بشكل طبيعي بعد ذلك عبر /api/auth/login بكلمة المرور الجديدة.
    const { passwordHash: _passwordHash, ...safeSeller } = updated;
    return NextResponse.json(safeSeller);
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
