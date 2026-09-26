import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { withdrawals } from "@/db/schema";
import {
  getAdminKeyFromRequest,
  isAdminKeyConfigured,
  isValidAdminKey,
} from "@/lib/admin";

function guard(req: NextRequest) {
  if (!isAdminKeyConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_SETUP_KEY غير مضبوط في Vercel" },
      { status: 503 }
    );
  }
  if (!isValidAdminKey(getAdminKeyFromRequest(req))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  return null;
}

// المسارات المسموحة فقط. لا يمكن القفز من pending إلى completed مباشرة —
// يجب المرور بالموافقة والمعالجة أولًا، ولا يمكن لأي طرف آخر غير هذا المسار
// الإداري الموثّق أن يضع حالة "completed".
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["processing", "rejected"],
  processing: ["completed", "rejected"],
};

export async function GET(req: NextRequest) {
  const denied = guard(req);
  if (denied) return denied;

  const rows = await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  return NextResponse.json({ withdrawals: rows });
}

export async function PATCH(req: NextRequest) {
  const denied = guard(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const id = String(body?.id ?? "").trim();
    const action = String(body?.action ?? "");
    const note = String(body?.note ?? "").trim().slice(0, 500);
    const payoutReference = String(body?.payoutReference ?? "").trim().slice(0, 200) || null;

    const nextStatus: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      process: "processing",
      complete: "completed",
    };
    const target = nextStatus[action];
    if (!id || !target) {
      return NextResponse.json({ error: "بيانات الإجراء غير صالحة" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, id));
      if (!current) return { error: "طلب السحب غير موجود" as const };

      const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(target)) {
        return {
          error: `لا يمكن الانتقال من "${current.status}" إلى "${target}"` as const,
        };
      }

      // إتمام السحب فعليًا ("completed") يتطلب مرجع تحويل حقيقي — لا يكفي
      // مجرد استدعاء هذا المسار لتحويل الحالة دون دليل عملية دفع منفّذة.
      if (target === "completed" && !payoutReference) {
        return {
          error: "أدخل مرجع التحويل (payoutReference) لإثبات تنفيذ الدفعة فعليًا" as const,
        };
      }

      const [updated] = await tx
        .update(withdrawals)
        .set({
          status: target,
          adminNote: note || current.adminNote,
          reviewedAt: target === "approved" || target === "rejected" ? new Date() : current.reviewedAt,
          completedAt: target === "completed" ? new Date() : current.completedAt,
          payoutReference: target === "completed" ? payoutReference : current.payoutReference,
        })
        .where(eq(withdrawals.id, id))
        .returning();

      return { updated };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, withdrawal: result.updated });
  } catch {
    return NextResponse.json({ error: "تعذر تنفيذ الإجراء" }, { status: 500 });
  }
}
