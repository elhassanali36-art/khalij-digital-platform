import { createClient } from "@supabase/supabase-js";

export const PRODUCT_BUCKET = "digital-products";

function getStorageAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "إعداد رفع الملفات غير مكتمل. أضف SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في Vercel."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ensureProductBucket() {
  const supabase = getStorageAdmin();
  const { data } = await supabase.storage.getBucket(PRODUCT_BUCKET);

  if (!data) {
    const { error } = await supabase.storage.createBucket(PRODUCT_BUCKET, {
      public: false,
      // الحد الأقصى 500 ميجابايت لكل منتج. يمكن تعديله من Supabase لاحقًا.
      fileSizeLimit: 500 * 1024 * 1024,
    });
    // نتجاهل خطأ "الحاوية موجودة" الناتج عن طلبين متزامنين فقط.
    if (error && !error.message.toLowerCase().includes("already")) {
      throw new Error(`تعذر إنشاء مساحة تخزين المنتجات: ${error.message}`);
    }
  }

  return supabase;
}

export function safeStorageFileName(name: string) {
  const clean = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-120);
  return clean || "digital-product.bin";
}

export async function createProductUpload(
  sellerId: number,
  originalName: string
) {
  const supabase = await ensureProductBucket();
  const path = `${sellerId}/${crypto.randomUUID()}-${safeStorageFileName(originalName)}`;
  const { data, error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`تعذر إنشاء رابط رفع الملف: ${error?.message ?? "خطأ غير معروف"}`);
  }

  return { path, token: data.token, signedUrl: data.signedUrl };
}

export async function createProductDownload(
  path: string,
  downloadName: string | null
) {
  const supabase = getStorageAdmin();
  const { data, error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .createSignedUrl(path, 60, {
      download: downloadName || true,
    });

  if (error || !data?.signedUrl) {
    throw new Error(`تعذر إنشاء رابط تنزيل الملف: ${error?.message ?? "خطأ غير معروف"}`);
  }

  return data.signedUrl;
}
