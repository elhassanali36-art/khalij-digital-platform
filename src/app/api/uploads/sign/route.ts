import { NextRequest, NextResponse } from "next/server";
import { createProductUpload } from "@/lib/storage";
import { getSessionSeller, unauthorized, forbidden } from "@/lib/session";

const MAX_FILE_SIZE = 500 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const seller = await getSessionSeller(req);
    if (!seller) return unauthorized();
    if (seller.storeStatus !== "active") {
      return forbidden("المتجر موقوف ولا يمكن رفع ملفات جديدة");
    }

    const body = await req.json();
    const fileName = String(body?.fileName ?? "").trim();
    const fileSize = Number(body?.fileSize ?? 0);

    if (!fileName || !fileSize) {
      return NextResponse.json({ error: "بيانات الملف غير مكتملة" }, { status: 400 });
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "يجب ألا يتجاوز حجم ملف المنتج 500 ميجابايت" },
        { status: 400 }
      );
    }

    // مسار الرفع يُشتق دائمًا من معرّف البائع في الجلسة، وليس من أي قيمة يرسلها
    // العميل — هذا يمنع بائعًا من رفع/الكتابة فوق ملفات داخل مجلد بائع آخر.
    const upload = await createProductUpload(seller.id, fileName);
    return NextResponse.json(upload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تجهيز رفع الملف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
