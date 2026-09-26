"use client";

import { use, useEffect, useState } from "react";
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
  { v: "from-violet-500 to-fuchsia-500", c: "from-violet-500 to-fuchsia-500" },
  { v: "from-amber-400 to-orange-500", c: "from-amber-400 to-orange-500" },
  { v: "from-emerald-400 to-teal-500", c: "from-emerald-400 to-teal-500" },
  { v: "from-sky-400 to-blue-600", c: "from-sky-400 to-blue-600" },
  { v: "from-rose-400 to-red-500", c: "from-rose-400 to-red-500" },
  { v: "from-slate-500 to-slate-700", c: "from-slate-500 to-slate-700" },
];

type ManagedProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  priceUsd: string;
  coverEmoji: string;
  coverColor: string;
  downloadUrl: string | null;
  originalFileName: string | null;
  fileSize: number | null;
  hasStoredFile: boolean;
  sellerEmail: string;
  sellerName: string;
};

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ManagedProduct | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    priceUsd: "",
    coverEmoji: "📦",
    coverColor: COLORS[0].v,
  });
  const [deliveryMode, setDeliveryMode] = useState<"keep" | "upload" | "external">("keep");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}/manage`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) throw new Error("سجّل دخولك من لوحة البائع أولًا لإدارة المنتج");
          throw new Error(data.error ?? "تعذر تحميل المنتج");
        }
        return data as ManagedProduct;
      })
      .then((data) => {
        setProduct(data);
        setForm({
          title: data.title,
          description: data.description,
          category: data.category,
          priceUsd: data.priceUsd,
          coverEmoji: data.coverEmoji,
          coverColor: data.coverColor,
        });
        setExternalUrl(data.downloadUrl ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "تعذر تحميل المنتج"))
      .finally(() => setLoading(false));
  }, [id]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setError("");
    setStatus("");

    if (deliveryMode === "upload" && !newFile) {
      setError("اختر الملف الجديد الذي تريد استبدال ملف المنتج به");
      return;
    }
    if (newFile && newFile.size > 500 * 1024 * 1024) {
      setError("حجم الملف أكبر من الحد المسموح (500 ميجابايت)");
      return;
    }
    if (deliveryMode === "external" && !externalUrl.trim()) {
      setError("أدخل رابط التحميل الخارجي");
      return;
    }

    setSaving(true);
    try {
      let storagePath: string | null = null;

      if (deliveryMode === "upload" && newFile) {
        setStatus("1/3 جارٍ تجهيز رفع الملف الجديد…");
        const signRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: newFile.name,
            fileSize: newFile.size,
          }),
        });
        const signed = await signRes.json();
        if (!signRes.ok) throw new Error(signed.error ?? "تعذر تجهيز رفع الملف");

        setStatus("2/3 جارٍ رفع ملف المنتج الجديد…");
        const uploadBody = new FormData();
        uploadBody.append("cacheControl", "3600");
        uploadBody.append("", newFile);
        const uploadRes = await fetch(signed.signedUrl, {
          method: "PUT",
          headers: { "x-upsert": "false" },
          body: uploadBody,
        });
        if (!uploadRes.ok) {
          throw new Error(`تعذر رفع الملف: ${await uploadRes.text()}`);
        }
        storagePath = signed.path;
      }

      setStatus("3/3 جارٍ حفظ التعديلات…");
      const res = await fetch(`/api/products/${id}/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deliveryMode,
          storagePath,
          originalFileName: newFile?.name ?? null,
          fileSize: newFile?.size ?? null,
          downloadUrl: externalUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذر حفظ التعديلات");

      setStatus("✅ تم حفظ التعديلات بنجاح");
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ التعديلات");
      setStatus("");
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none transition focus:border-amber-400";

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-400">جارٍ تحميل المنتج…</main>;
  }
  if (!product) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="rounded-2xl bg-red-500/10 p-6 text-red-300">{error || "المنتج غير موجود"}</p>
        <Link href="/dashboard" className="mt-5 inline-block text-amber-400 underline">العودة إلى لوحة البائع</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">✏️ تعديل المنتج</h1>
          <p className="mt-2 text-slate-400">{product.coverEmoji} {product.title}</p>
        </div>
        <Link href={`/products/${product.id}`} className="text-sm text-amber-400 underline">عرض المنتج ←</Link>
      </div>

      <form onSubmit={save} className="mt-8 space-y-7">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-amber-400">📦 بيانات المنتج</h2>
          <div>
            <label className="mb-1 block text-sm font-semibold">عنوان المنتج *</label>
            <input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">الوصف *</label>
            <textarea className={`${input} min-h-32`} value={form.description} onChange={(e) => set("description", e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">التصنيف</label>
              <select className={input} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">السعر بالدولار *</label>
              <input className={input} type="number" min="0.5" step="0.01" dir="ltr" value={form.priceUsd} onChange={(e) => set("priceUsd", e.target.value)} required />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">أيقونة الغلاف</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => set("coverEmoji", emoji)} className={`h-10 w-10 rounded-lg border text-xl ${form.coverEmoji === emoji ? "border-amber-400 bg-amber-400/20" : "border-white/10 bg-slate-900"}`}>{emoji}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">لون الغلاف</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button key={color.v} type="button" aria-label="اختيار لون الغلاف" onClick={() => set("coverColor", color.v)} className={`h-10 w-10 rounded-lg bg-gradient-to-br ${color.c} ${form.coverColor === color.v ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950" : ""}`} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-emerald-400">⬇️ ملف التسليم</h2>
          <div className="rounded-xl bg-slate-900 p-4 text-sm">
            <div className="text-slate-400">الطريقة الحالية</div>
            <div className="mt-1 font-semibold text-emerald-300">
              {product.hasStoredFile
                ? `🔒 ملف خاص: ${product.originalFileName || "ملف المنتج"}`
                : "🔗 رابط تحميل خارجي"}
            </div>
            {product.fileSize && <div className="mt-1 text-xs text-slate-500">الحجم: {(product.fileSize / 1024 / 1024).toFixed(2)} MB</div>}
          </div>

          <div className="grid gap-3">
            {([
              ["keep", "✅ الاحتفاظ بطريقة التسليم الحالية"],
              ["upload", "⬆️ استبدال الملف بملف جديد"],
              ["external", "🔗 استخدام رابط تحميل خارجي"],
            ] as const).map(([value, label]) => (
              <label key={value} className={`cursor-pointer rounded-xl border p-3 text-sm ${deliveryMode === value ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-slate-900"}`}>
                <input className="ml-2" type="radio" name="deliveryMode" checked={deliveryMode === value} onChange={() => setDeliveryMode(value)} />
                {label}
              </label>
            ))}
          </div>

          {deliveryMode === "upload" && (
            <div>
              <input type="file" onChange={(e) => setNewFile(e.target.files?.[0] ?? null)} className="block w-full cursor-pointer rounded-xl border border-white/15 bg-slate-900 text-sm file:ml-4 file:border-0 file:bg-emerald-500 file:px-4 file:py-3 file:font-bold file:text-slate-950" />
              {newFile && <p className="mt-2 text-xs text-emerald-300">📎 {newFile.name} — {(newFile.size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>
          )}
          {deliveryMode === "external" && (
            <input className={input} type="url" dir="ltr" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://drive.google.com/…" required />
          )}
        </section>

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-red-300">{error}</p>}
        {status && <p className="rounded-xl bg-sky-500/10 px-4 py-3 text-center text-sky-300">{status}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-4 text-lg font-extrabold text-slate-950 disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ…" : "💾 حفظ التعديلات"}
        </button>
      </form>
    </main>
  );
}
