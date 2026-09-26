"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SOCIAL_FIELDS } from "@/lib/social";

const EMOJIS = ["👤", "🧑‍💻", "👩‍🎨", "🧑‍🏫", "🦁", "🚀", "⭐", "🎯", "🔥", "💎"];

const COLORS = [
  { v: "from-violet-500 to-fuchsia-500", c: "bg-gradient-to-br from-violet-500 to-fuchsia-500" },
  { v: "from-amber-400 to-orange-500", c: "bg-gradient-to-br from-amber-400 to-orange-500" },
  { v: "from-emerald-400 to-teal-500", c: "bg-gradient-to-br from-emerald-400 to-teal-500" },
  { v: "from-sky-400 to-blue-600", c: "bg-gradient-to-br from-sky-400 to-blue-600" },
  { v: "from-rose-400 to-red-500", c: "bg-gradient-to-br from-rose-400 to-red-500" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    avatarEmoji: "👤",
    avatarColor: COLORS[0].v,
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "تعذر إنشاء الحساب");
        setLoading(false);
        return;
      }
      // تسجيل الدخول يتم تلقائيًا عبر كوكي الجلسة الذي يضبطه الخادم عند النجاح
      // — لا حاجة لتخزين أي هوية في localStorage.
      router.push("/sell");
    } catch {
      setError("تعذر الاتصال بالخادم");
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none transition focus:border-amber-400";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">👤 أنشئ ملفك الشخصي كبائع</h1>
      <p className="mt-2 text-slate-400">
        ملفك الشخصي هو واجهتك أمام المشترين — أضف وسائل استقبال أرباحك (PayPal
        و/أو محافظ العملات الرقمية).
      </p>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-bold text-amber-400">🪪 معلوماتك</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">اسمك / اسم متجرك *</label>
                <input
                  className={input}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="متجر أحمد الرقمي"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">بريدك الإلكتروني *</label>
                <input
                  className={input}
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="seller@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">كلمة المرور *</label>
                <input
                  className={input}
                  type="password"
                  dir="ltr"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  minLength={8}
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">نبذة عنك</label>
              <textarea
                className={`${input} min-h-24`}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="أصمم قوالب احترافية وأبيع كتباً رقمية منذ 5 سنوات…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">صورة رمزية</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => set("avatarEmoji", em)}
                      className={`h-10 w-10 rounded-lg border text-xl transition ${
                        form.avatarEmoji === em
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
                <label className="mb-1 block text-sm font-semibold">لون الملف</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => set("avatarColor", c.v)}
                      className={`h-10 w-10 rounded-lg ${c.c} ${
                        form.avatarColor === c.v
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

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-1 text-lg font-bold text-amber-400">💰 وسائل استقبال الأرباح</h2>
          <p className="mb-4 text-sm text-slate-400">
            أضف وسيلة واحدة على الأقل. يدفع المشترون عبرها، وتسحب أرباحك إليها
            لاحقاً (عمولة المنصة 5% فقط تُخصم عند السحب).
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">
                <span className="text-sky-400">💳</span> بريد حساب PayPal
              </label>
              <input
                className={input}
                type="email"
                dir="ltr"
                value={form.paypalEmail}
                onChange={(e) => set("paypalEmail", e.target.value)}
                placeholder="paypal@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">
                <span className="text-orange-400">₿</span> عنوان محفظة Bitcoin
              </label>
              <input
                className={input}
                dir="ltr"
                value={form.walletBtc}
                onChange={(e) => set("walletBtc", e.target.value)}
                placeholder="bc1q…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">
                <span className="text-indigo-400">Ξ</span> عنوان محفظة Ethereum
              </label>
              <input
                className={input}
                dir="ltr"
                value={form.walletEth}
                onChange={(e) => set("walletEth", e.target.value)}
                placeholder="0x…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">
                <span className="text-emerald-400">₮</span> عنوان محفظة USDT
              </label>
              <input
                className={input}
                dir="ltr"
                value={form.walletUsdt}
                onChange={(e) => set("walletUsdt", e.target.value)}
                placeholder="T… أو 0x…"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-1 text-lg font-bold text-amber-400">🌐 حساباتك وروابط متجرك</h2>
          <p className="mb-4 text-sm text-slate-400">
            اختيارية — ستظهر في صفحة متجرك العامة ليستطيع العملاء متابعتك والتواصل معك.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-semibold">
                  <span className="ml-1 font-bold text-amber-300">{field.icon}</span>
                  {field.label}
                </label>
                <input
                  className={input}
                  type="url"
                  dir="ltr"
                  value={form[field.key]}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-semibold">اسم منصة إضافية</label>
              <input
                className={input}
                value={form.otherSocialLabel}
                onChange={(e) => set("otherSocialLabel", e.target.value)}
                placeholder="مثال: Behance"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">رابط المنصة الإضافية</label>
              <input
                className={input}
                type="url"
                dir="ltr"
                value={form.otherSocialUrl}
                onChange={(e) => set("otherSocialUrl", e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-4 text-lg font-extrabold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "جارٍ الإنشاء…" : "✨ أنشئ ملفي الشخصي"}
        </button>
      </form>
    </main>
  );
}
