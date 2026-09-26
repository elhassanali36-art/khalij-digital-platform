"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SOCIAL_FIELDS } from "@/lib/social";

const EMOJIS = ["👤", "🧑‍💻", "👩‍🎨", "🧑‍🏫", "🦁", "🚀", "⭐", "🎯", "🔥", "💎"];
const COLORS = [
  "from-violet-500 to-fuchsia-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-600",
  "from-rose-400 to-red-500",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  bio: "",
  avatarEmoji: "👤",
  avatarColor: COLORS[0],
  paypalEmail: "",
  walletBtc: "",
  walletEth: "",
  walletUsdt: "",
  websiteUrl: "",
  whatsappUrl: "",
  telegramUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  xUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  snapchatUrl: "",
  otherSocialLabel: "",
  otherSocialUrl: "",
};

export default function EditSellerProfilePage() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) throw new Error("سجّل دخولك من لوحة البائع أولًا");
          throw new Error(data.error ?? "تعذر تحميل الملف");
        }
        return data;
      })
      .then((seller) => {
        setSellerId(seller.id);
        setForm({
          name: seller.name ?? "",
          email: seller.email ?? "",
          bio: seller.bio ?? "",
          avatarEmoji: seller.avatarEmoji ?? "👤",
          avatarColor: seller.avatarColor ?? COLORS[0],
          paypalEmail: seller.paypalEmail ?? "",
          walletBtc: seller.walletBtc ?? "",
          walletEth: seller.walletEth ?? "",
          walletUsdt: seller.walletUsdt ?? "",
          websiteUrl: seller.websiteUrl ?? "",
          whatsappUrl: seller.whatsappUrl ?? "",
          telegramUrl: seller.telegramUrl ?? "",
          instagramUrl: seller.instagramUrl ?? "",
          facebookUrl: seller.facebookUrl ?? "",
          xUrl: seller.xUrl ?? "",
          tiktokUrl: seller.tiktokUrl ?? "",
          youtubeUrl: seller.youtubeUrl ?? "",
          linkedinUrl: seller.linkedinUrl ?? "",
          snapchatUrl: seller.snapchatUrl ?? "",
          otherSocialLabel: seller.otherSocialLabel ?? "",
          otherSocialUrl: seller.otherSocialUrl ?? "",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "تعذر تحميل الملف"))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذر حفظ التعديلات");
      setSuccess("✅ تم تحديث متجرك وروابطك بنجاح");
      setSellerId(data.id);
      setTimeout(() => router.push(`/sellers/${data.id}`), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ التعديلات");
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none transition focus:border-amber-400";

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-400">جارٍ تحميل ملف متجرك…</main>;
  }
  if (!form.email) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="rounded-2xl bg-red-500/10 p-6 text-red-300">{error}</p>
        <Link href="/dashboard" className="mt-5 inline-block text-amber-400 underline">الذهاب إلى لوحة البائع</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">⚙️ تعديل متجري</h1>
          <p className="mt-2 text-slate-400">حدّث هويتك وروابط التواصل ووسائل استلام الأرباح.</p>
        </div>
        {sellerId && <Link href={`/sellers/${sellerId}`} className="text-sm text-amber-400 underline">عرض متجري ←</Link>}
      </div>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-amber-400">🪪 هوية المتجر</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">اسم المتجر *</label>
              <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">البريد المسجّل</label>
              <input className={`${input} opacity-70`} value={form.email} dir="ltr" readOnly />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">نبذة عن المتجر</label>
            <textarea className={`${input} min-h-28`} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">الصورة الرمزية</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => set("avatarEmoji", emoji)} className={`h-10 w-10 rounded-lg border text-xl ${form.avatarEmoji === emoji ? "border-amber-400 bg-amber-400/20" : "border-white/10 bg-slate-900"}`}>{emoji}</button>)}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">لون المتجر</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => <button key={color} type="button" aria-label="اختيار اللون" onClick={() => set("avatarColor", color)} className={`h-10 w-10 rounded-lg bg-gradient-to-br ${color} ${form.avatarColor === color ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950" : ""}`} />)}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-amber-400">💰 وسائل استلام الأرباح</h2>
          <input className={input} type="email" dir="ltr" value={form.paypalEmail} onChange={(e) => set("paypalEmail", e.target.value)} placeholder="PayPal email" />
          <input className={input} dir="ltr" value={form.walletBtc} onChange={(e) => set("walletBtc", e.target.value)} placeholder="Bitcoin wallet" />
          <input className={input} dir="ltr" value={form.walletEth} onChange={(e) => set("walletEth", e.target.value)} placeholder="Ethereum wallet" />
          <input className={input} dir="ltr" value={form.walletUsdt} onChange={(e) => set("walletUsdt", e.target.value)} placeholder="USDT wallet" />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-amber-400">🌐 روابط التواصل الاجتماعي</h2>
          <p className="mt-1 text-sm text-slate-400">أضف ما تريد فقط؛ الروابط المكتملة ستظهر في واجهة متجرك.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-semibold"><span className="ml-1 text-amber-300">{field.icon}</span>{field.label}</label>
                <input className={input} type="url" dir="ltr" value={form[field.key]} onChange={(e) => set(field.key, e.target.value)} placeholder={field.placeholder} />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-semibold">اسم منصة إضافية</label>
              <input className={input} value={form.otherSocialLabel} onChange={(e) => set("otherSocialLabel", e.target.value)} placeholder="Behance" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">رابط إضافي</label>
              <input className={input} type="url" dir="ltr" value={form.otherSocialUrl} onChange={(e) => set("otherSocialUrl", e.target.value)} placeholder="https://…" />
            </div>
          </div>
        </section>

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-red-300">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-emerald-300">{success}</p>}
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-4 text-lg font-extrabold text-slate-950 disabled:opacity-50">
          {saving ? "جارٍ الحفظ…" : "💾 حفظ بيانات المتجر"}
        </button>
      </form>
    </main>
  );
}
