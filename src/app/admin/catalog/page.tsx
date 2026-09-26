"use client";

import { useState } from "react";
import Link from "next/link";
import ShareButtons from "@/components/share-buttons";
import { SOCIAL_FIELDS } from "@/lib/social";

const INITIAL = {
  adminKey: "",
  name: "منصة الخليج للمنتجات الرقمية",
  email: "",
  bio: "المتجر الرسمي لمنصة الخليج — منتجات وأدوات رقمية عربية قابلة للتنزيل.",
  avatarEmoji: "خ",
  avatarColor: "from-amber-400 to-orange-500",
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
  confirmTransfer: false,
};

type SetupResult = {
  message: string;
  addedNow: number;
  totalProducts: number;
  catalogProducts: number;
  storePath: string;
  owner: { id: number; email: string; name: string };
};

export default function AdminCatalogPage() {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SetupResult | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const { adminKey, ...rest } = form;
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify(rest),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذر تجهيز المتجر");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الاتصال بالخادم");
    }
    setLoading(false);
  }

  const input =
    "w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none transition focus:border-amber-400";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6">
        <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">إعداد إداري محمي</span>
        <h1 className="mt-4 text-3xl font-extrabold">🛍️ تجهيز متجر المالك والكتالوج</h1>
        <p className="mt-3 leading-relaxed text-slate-300">
          تضيف هذه الأداة 100 منتج أصلي من الفئات الأعلى طلبًا، وتنقل كل المنتجات الموجودة
          حاليًا إلى متجرك. بعد النقل ستستخدم جميعها وسائل الدفع والمحافظ التي تدخلها هنا.
        </p>
      </div>

      {result ? (
        <section className="mt-8 rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-7">
          <div className="text-5xl">✅</div>
          <h2 className="mt-3 text-2xl font-extrabold text-emerald-300">تم تجهيز المتجر</h2>
          <p className="mt-2 text-slate-300">{result.message}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-900 p-4"><div className="text-xs text-slate-500">أضيف الآن</div><b className="text-2xl text-amber-300">{result.addedNow}</b></div>
            <div className="rounded-xl bg-slate-900 p-4"><div className="text-xs text-slate-500">منتجات الكتالوج</div><b className="text-2xl text-emerald-300">{result.catalogProducts}</b></div>
            <div className="rounded-xl bg-slate-900 p-4"><div className="text-xs text-slate-500">إجمالي متجرك</div><b className="text-2xl">{result.totalProducts}</b></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={result.storePath} className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950">فتح متجري</Link>
            <Link href="/dashboard" className="rounded-xl border border-white/15 px-5 py-3 font-bold">لوحة البائع</Link>
          </div>
          <div className="mt-5">
            <ShareButtons title={`متجر ${result.owner.name} على منصة الخليج`} path={result.storePath} />
          </div>
        </section>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-7">
          <section className="space-y-4 rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
            <h2 className="text-lg font-bold text-red-300">🔐 مفتاح الإدارة</h2>
            <p className="text-sm text-slate-400">
              أنشئ متغيرًا سريًا في Vercel باسم ADMIN_SETUP_KEY بطول 16 حرفًا أو أكثر، ثم اكتب قيمته هنا.
            </p>
            <input className={input} type="password" value={form.adminKey} onChange={(e) => set("adminKey", e.target.value)} placeholder="ADMIN_SETUP_KEY" required minLength={16} autoComplete="off" />
          </section>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-amber-400">👤 متجر المالك</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-sm font-semibold">اسم المتجر *</label><input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div><label className="mb-1 block text-sm font-semibold">بريد المالك *</label><input className={input} type="email" dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="owner@example.com" /></div>
            </div>
            <div><label className="mb-1 block text-sm font-semibold">نبذة المتجر</label><textarea className={`${input} min-h-24`} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></div>
          </section>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-amber-400">💰 وسائل الدفع والاستلام</h2>
            <p className="text-sm text-slate-400">أدخل وسيلة حقيقية واحدة على الأقل. لا تستخدم عناوين تجريبية عند الإطلاق.</p>
            <div><label className="mb-1 block text-sm font-semibold">💳 بريد PayPal</label><input className={input} type="email" dir="ltr" value={form.paypalEmail} onChange={(e) => set("paypalEmail", e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-semibold">₿ محفظة Bitcoin</label><input className={input} dir="ltr" value={form.walletBtc} onChange={(e) => set("walletBtc", e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-semibold">Ξ محفظة Ethereum</label><input className={input} dir="ltr" value={form.walletEth} onChange={(e) => set("walletEth", e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-semibold">₮ محفظة USDT</label><input className={input} dir="ltr" value={form.walletUsdt} onChange={(e) => set("walletUsdt", e.target.value)} /></div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-amber-400">🌐 روابط التواصل (اختيارية)</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {SOCIAL_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-semibold"><span className="ml-1 text-amber-300">{field.icon}</span>{field.label}</label>
                  <input className={input} type="url" dir="ltr" value={form[field.key]} onChange={(e) => set(field.key, e.target.value)} placeholder={field.placeholder} />
                </div>
              ))}
              <div><label className="mb-1 block text-sm font-semibold">اسم منصة إضافية</label><input className={input} value={form.otherSocialLabel} onChange={(e) => set("otherSocialLabel", e.target.value)} /></div>
              <div><label className="mb-1 block text-sm font-semibold">الرابط الإضافي</label><input className={input} type="url" dir="ltr" value={form.otherSocialUrl} onChange={(e) => set("otherSocialUrl", e.target.value)} /></div>
            </div>
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/5 p-5">
            <input type="checkbox" className="mt-1 h-5 w-5" checked={form.confirmTransfer} onChange={(e) => set("confirmTransfer", e.target.checked)} required />
            <span><b className="text-red-300">أؤكد نقل جميع المنتجات الحالية إلى متجري</b><span className="mt-1 block text-sm text-slate-400">ستتغير ملكية المنتجات في قاعدة البيانات لتستخدم ملفك ووسائل دفعك.</span></span>
          </label>

          {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-4 text-lg font-extrabold text-slate-950 disabled:opacity-50">
            {loading ? "جارٍ إضافة ونقل المنتجات…" : "🚀 إضافة 100 منتج ونقل الكل إلى متجري"}
          </button>
        </form>
      )}
    </main>
  );
}
