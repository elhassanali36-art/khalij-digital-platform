"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "كتب إلكترونية",
  "قوالب وتصاميم",
  "دورات تعليمية",
  "برمجيات وأكواد",
  "صوتيات وموسيقى",
  "أخرى",
];

const EMOJIS = ["📦", "📚", "🎨", "🎓", "💻", "🎵", "📷", "🧩", "⚙️", "🚀"];

const COLORS = [
  { v: "from-violet-500 to-fuchsia-500", c: "bg-gradient-to-br from-violet-500 to-fuchsia-500" },
  { v: "from-amber-400 to-orange-500", c: "bg-gradient-to-br from-amber-400 to-orange-500" },
  { v: "from-emerald-400 to-teal-500", c: "bg-gradient-to-br from-emerald-400 to-teal-500" },
  { v: "from-sky-400 to-blue-600", c: "bg-gradient-to-br from-sky-400 to-blue-600" },
  { v: "from-rose-400 to-red-500", c: "bg-gradient-to-br from-rose-400 to-red-500" },
  { v: "from-slate-500 to-slate-700", c: "bg-gradient-to-br from-slate-500 to-slate-700" },
];

type SellerInfo = { id: number; name: string; avatarEmoji: string; email: string };

export default function SellPage() {
  const router = useRouter();
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    priceUsd: "",
    coverEmoji: "📦",
    coverColor: COLORS[0].v,
    downloadUrl: "",
  });
  const [productFile, setProductFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSeller().finally(() => setChecking(false));
  }, []);

  // يعتمد على كوكي الجلسة فقط — لا نرسل أي بريد إلكتروني لتحديد الهوية.
  async function fetchSeller() {
    const res = await fetch("/api/me");
    if (res.ok) {
      setSeller(await res.json());
      return true;
    }
    setSeller(null);
    return false;
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail.toLowerCase().trim(), password: loginPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(
        data?.requiresClaim
          ? "هذا الحساب أُنشئ قبل تفعيل تسجيل الدخول الآمن. تواصل مع الدعم لتفعيل حسابك."
          : data.error ?? "تعذر تسجيل الدخول"
      );
      return;
    }
    setLoginPassword("");
    await fetchSeller();
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!seller) return;
    setError("");
    setUploadStatus("");

    if (!productFile && !form.downloadUrl.trim()) {
      setError("اختر ملف المنتج أو أضف رابط تحميل خارجي");
      return;
    }
    if (productFile && productFile.size > 500 * 1024 * 1024) {
      setError("حجم الملف أكبر من الحد المسموح (500 ميجابايت)");
      return;
    }

    setLoading(true);
    try {
      let storagePath: string | null = null;

      if (productFile) {
        setUploadStatus("1/3 جارٍ تجهيز رفع الملف…");
        const signRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: productFile.name,
            fileSize: productFile.size,
          }),
        });
        const signed = await signRes.json();
        if (!signRes.ok) {
          throw new Error(signed.error ?? "تعذر تجهيز رفع الملف");
        }

        setUploadStatus("2/3 جارٍ رفع ملف المنتج إلى التخزين الآمن…");
        const uploadBody = new FormData();
        uploadBody.append("cacheControl", "3600");
        uploadBody.append("", productFile);
        const uploadRes = await fetch(signed.signedUrl, {
          method: "PUT",
          headers: { "x-upsert": "false" },
          body: uploadBody,
        });
        if (!uploadRes.ok) {
          const uploadError = await uploadRes.text();
          throw new Error(`تعذر رفع الملف: ${uploadError || uploadRes.statusText}`);
        }
        storagePath = signed.path;
      }

      setUploadStatus("3/3 جارٍ نشر المنتج…");
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          storagePath,
          originalFileName: productFile?.name ?? null,
          fileSize: productFile?.size ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "تعذر إنشاء المنتج");
      }
      router.push(`/products/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الاتصال بالخادم");
      setUploadStatus("");
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none transition focus:border-amber-400";

  if (checking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-400">
        جارٍ التحقق…
      </main>
    );
  }

  // غير مسجّل → طلب تسجيل دخول أو إنشاء حساب
  if (!seller) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-5xl">👤</div>
          <h1 className="mt-4 text-2xl font-extrabold">تحتاج ملفاً شخصياً للبيع</h1>
          <p className="mt-2 text-slate-400">
            سجّل الدخول ببريدك إن كان لديك حساب، أو أنشئ ملفك الشخصي خلال دقيقة.
          </p>
          <form onSubmit={login} className="mt-6 flex flex-col gap-2">
            <input
              type="email"
              dir="ltr"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="seller@example.com"
              className={`${input} text-left`}
              required
            />
            <input
              type="password"
              dir="ltr"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="كلمة المرور"
              className={`${input} text-left`}
              required
            />
            <button className="shrink-0 rounded-xl bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20">
              دخول
            </button>
          </form>
          {loginError && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {loginError}
            </p>
          )}
          <Link
            href="/register"
            className="mt-5 block w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-3 font-extrabold text-slate-950 transition hover:opacity-90"
          >
            ✨ إنشاء ملف شخصي جديد
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">🚀 أضف منتجاً جديداً</h1>
          <p className="mt-2 text-slate-400">
            تنشر باسم: <b className="text-amber-300">{seller.avatarEmoji} {seller.name}</b>
          </p>
        </div>
        <Link href={`/sellers/${seller.id}`} className="text-sm text-amber-400 underline">
          ملفي الشخصي ←
        </Link>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-bold text-amber-400">📦 بيانات المنتج</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">عنوان المنتج *</label>
              <input
                className={input}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="مثال: كتاب احتراف التداول بالعملات الرقمية"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">الوصف *</label>
              <textarea
                className={`${input} min-h-28`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="اشرح ما يحصل عليه المشتري…"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">التصنيف</label>
                <select
                  className={input}
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">السعر بالدولار (USD) *</label>
                <input
                  className={input}
                  type="number"
                  min="0.5"
                  step="0.01"
                  dir="ltr"
                  value={form.priceUsd}
                  onChange={(e) => set("priceUsd", e.target.value)}
                  placeholder="9.99"
                  required
                />
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <label className="mb-2 block text-sm font-bold text-emerald-300">
                ⬆️ ارفع ملف المنتج
              </label>
              <input
                type="file"
                onChange={(e) => setProductFile(e.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer rounded-xl border border-white/15 bg-slate-900 text-sm text-slate-300 file:ml-4 file:border-0 file:bg-emerald-500 file:px-4 file:py-3 file:font-bold file:text-slate-950"
              />
              {productFile && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs">
                  <span className="max-w-full truncate text-emerald-300">📎 {productFile.name}</span>
                  <span className="text-slate-400">
                    {(productFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">
                الحد الأقصى 500 MB. يُحفظ الملف بشكل خاص ولا يمكن تنزيله إلا بعد الدفع.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/10" />
              أو استخدم رابطًا خارجيًا
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                رابط تحميل خارجي (اختياري إذا رفعت ملفًا)
              </label>
              <input
                className={input}
                type="url"
                dir="ltr"
                value={form.downloadUrl}
                onChange={(e) => set("downloadUrl", e.target.value)}
                placeholder="https://drive.google.com/…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">أيقونة الغلاف</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => set("coverEmoji", em)}
                      className={`h-10 w-10 rounded-lg border text-xl transition ${
                        form.coverEmoji === em
                          ? "border-amber-400 bg-amber-400/20"
                          : "border-white/10 bg-slate-900"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">لون الغلاف</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => set("coverColor", c.v)}
                      className={`h-10 w-10 rounded-lg ${c.c} ${
                        form.coverColor === c.v
                          ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 text-sm text-amber-200">
          💡 وسائل الدفع (PayPal / المحافظ الرقمية) تُؤخذ تلقائياً من ملفك الشخصي.
          عمولة المنصة 5% فقط تُخصم عند سحب أرباحك.
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-red-400">{error}</p>
        )}

        {uploadStatus && (
          <div className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-center text-sm font-semibold text-sky-300">
            <span className="inline-block animate-pulse">●</span> {uploadStatus}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-4 text-lg font-extrabold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "يرجى الانتظار…" : "🚀 ارفع الملف وانشر المنتج"}
        </button>
      </form>
    </main>
  );
}
