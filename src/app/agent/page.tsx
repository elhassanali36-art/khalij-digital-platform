"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Agent = {
  id: string;
  status: "inactive" | "active" | "past_due" | "cancelled";
  platforms: string[];
  productIds: string[];
  scheduleHours: number[];
  language: string;
  postsCount: number;
  hasTelegram: boolean;
  hasFacebookPage: boolean;
};

type AdPost = {
  id: string;
  platform: string;
  status: "posted" | "manual_ready" | "failed";
  productTitle: string;
  contentAr: string | null;
  contentEn: string | null;
  imageUrl: string | null;
  publicUrl: string | null;
  error: string | null;
  created_date: string;
};

type Product = { id: string; title: string; coverEmoji: string; priceUsd: string };

const PLATFORMS = [
  { id: "telegram", label: "تيليجرام", hint: "نشر تلقائي كامل عبر بوتك", auto: true },
  { id: "facebook_page", label: "صفحة فيسبوك", hint: "نشر تلقائي عبر توكن صفحتك", auto: true },
  { id: "instagram", label: "إنستغرام", hint: "تحضير المنشور جاهزاً للنشر اليدوي", auto: false },
  { id: "tiktok", label: "تيك توك", hint: "تحضير المنشور جاهزاً للنشر اليدوي", auto: false },
];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export default function AgentPage() {
  const [me, setMe] = useState<{ seller: { id: string; name: string; storeStatus: string } | null; agent: Agent | null; posts: AdPost[] } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selPlatforms, setSelPlatforms] = useState<string[]>([]);
  const [selProducts, setSelProducts] = useState<string[]>([]);
  const [selHours, setSelHours] = useState<number[]>([]);
  const [language, setLanguage] = useState("ar");
  const [tgToken, setTgToken] = useState("");
  const [tgChat, setTgChat] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [fbToken, setFbToken] = useState("");
  const [justPaid, setJustPaid] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/agent/me", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "انتهت الجلسة — سجّل الدخول من جديد");
      setLoading(false);
      return;
    }
    setMe(data);
    if (data.agent) {
      setSelPlatforms(data.agent.platforms || []);
      setSelHours(data.agent.scheduleHours || []);
      setLanguage(data.agent.language || "ar");
    }
    const meRes = await fetch("/api/me", { cache: "no-store" });
    if (meRes.ok) {
      const meData = await meRes.json().catch(() => ({}));
      const email = meData?.email;
      if (email) {
        const pr = await fetch(`/api/products?seller=${encodeURIComponent(email)}`, { cache: "no-store" });
        if (pr.ok) {
          const pdata = await pr.json().catch(() => []);
          const list = Array.isArray(pdata) ? pdata : pdata.products || [];
          setProducts(list);
          if (data.agent) setSelProducts(data.agent.productIds || []);
        }
      }
    }
    setLoading(false);
    return true;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      await load();
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      if (params.get("sub") === "success" && sessionId) {
        setBusy(true);
        const res = await fetch("/api/agent/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (res.ok) {
          setJustPaid(true);
          setMessage("🎉 تم تفعيل الاشتراك! اضبط إعدادات الوكيل أدناه.");
          await load();
          window.history.replaceState({}, "", "/agent/");
        } else {
          setError(data.error ?? "تعذر تأكيد الدفع");
        }
      } else if (params.get("sub") === "cancel") {
        setMessage("أُلغي الدفع — يمكنك المحاولة في أي وقت.");
        window.history.replaceState({}, "", "/agent/");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function subscribe() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/agent/checkout", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setBusy(false);
      setError(data.error ?? "تعذر بدء الاشتراك");
    }
  }

  async function cancelSub() {
    if (!window.confirm("سيستمر الوكيل حتى نهاية الشهر المدفوع ثم يتوقف. هل أنت متأكد؟")) return;
    setBusy(true);
    const res = await fetch("/api/agent/cancel", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMessage(data.message ?? "تم إلغاء الاشتراك");
      await load();
    } else setError(data.error ?? "تعذر الإلغاء");
  }

  async function testTelegram() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/agent/test-telegram", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setMessage(data.message ?? "تم الإرسال ✅");
    else setError(data.error ?? "فشل الاختبار");
  }

  async function saveConfig() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/agent/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platforms: selPlatforms,
        productIds: selProducts,
        scheduleHours: selHours,
        language,
        telegramBotToken: tgToken || undefined,
        telegramChatId: tgChat || undefined,
        facebookPageId: fbPageId || undefined,
        facebookPageToken: fbToken || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMessage(data.message ?? "تم الحفظ");
      await load();
    } else {
      setError(data.error ?? "تعذر حفظ الإعدادات");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="animate-pulse text-xl font-bold text-slate-400">جارٍ التحميل…</div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-3xl border border-amber-400/20 bg-white/5 p-8 text-center">
          <div className="text-5xl">🤖</div>
          <h1 className="mt-4 text-3xl font-extrabold">وكيل الإعلان الذكي</h1>
          <p className="mt-3 text-slate-400">{error || "انتهت الجلسة"}</p>
          <Link href="/dashboard" className="mt-6 inline-block rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 px-6 py-3 font-extrabold text-slate-950">سجّل الدخول من لوحة التاجر</Link>
        </div>
      </main>
    );
  }

  const agent = me.agent;
  const active = agent?.status === "active";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-300">AI AD AGENT</span>
          <h1 className="mt-3 text-3xl font-extrabold">🤖 وكيل الإعلان الذكي</h1>
          <p className="mt-2 text-slate-400">وكلاء إعلانات يعملون لصالح {me.seller?.name} — $100 شهرياً.</p>
        </div>
        <Link href="/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/5">لوحة التاجر</Link>
      </div>

      {justPaid && (
        <p className="mt-6 rounded-2xl bg-emerald-500/10 px-6 py-4 font-bold text-emerald-300">🎉 تم الدفع بنجاح — الوكيل مفعّل. اضبط المنتجات والمنصات والأوقات الآن.</p>
      )}
      {message && <p className="mt-6 rounded-2xl bg-emerald-500/10 px-6 py-4 text-emerald-300">{message}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 px-6 py-4 text-red-300">{error}</p>}

      {!active ? (
        <section className="mt-8 rounded-3xl border border-violet-400/20 bg-gradient-to-b from-violet-500/10 to-transparent p-8">
          <div className="text-4xl">✨</div>
          <h2 className="mt-3 text-2xl font-extrabold">دع الذكاء الاصطناعي يعلّن عن منتجاتك</h2>
          <ul className="mt-4 space-y-2 text-slate-300">
            <li>✅ يعلن عن المنتجات التي تختارها أنت</li>
            <li>✅ في الأوقات التي تحددها أنت (بتوقيت الخرطوم)</li>
            <li>✅ على المنصات التي تحددها: تيليجرام وفيسبوك تلقائياً، وإنستغرام وتيك توك جاهزة للنشر بضغطة زر</li>
            <li>✅ كتابة إعلان احترافي بالعربية والإنجليزية + صورة إعلانية لكل منشور</li>
            <li>✅ سجل كامل بكل منشور في لوحتك</li>
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-4xl font-extrabold text-amber-300">$100<span className="text-lg text-slate-400"> / شهرياً</span></div>
            <button onClick={subscribe} disabled={busy} className="rounded-xl bg-gradient-to-l from-violet-500 to-fuchsia-500 px-8 py-3 text-lg font-extrabold text-white shadow-lg shadow-violet-500/25 disabled:opacity-50">
              {busy ? "جارٍ التحويل…" : agent?.status === "cancelled" ? "إعادة الاشتراك" : "اشترك الآن"}
            </button>
            <span className="text-xs text-slate-500">إلغاء في أي وقت — يبقى الوكيل حتى نهاية الشهر المدفوع</span>
          </div>
        </section>
      ) : (
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <div className="text-sm text-slate-400">حالة الوكيل</div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-300">نشط ✅</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">منشورات الوكيل</div>
            <div className="mt-1 text-2xl font-extrabold">{agent?.postsCount ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">أوقات النشر</div>
            <div dir="ltr" className="mt-1 text-lg font-extrabold">{(agent?.scheduleHours || []).map((h) => `${String(h).padStart(2, "0")}:00`).join("، ") || "—"}</div>
          </div>
        </section>
      )}

      {active && (
        <>
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-extrabold">⚙️ إعدادات الوكيل</h2>

            <h3 className="mt-6 font-bold text-amber-300">1) المنتجات التي يعلن عنها</h3>
            {products.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">لا توجد منتجات في متجرك — أضف منتجات أولاً.</p>
            ) : (
              <div className="mt-3 grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                {products.map((p) => (
                  <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${selProducts.includes(p.id) ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-slate-900"}`}>
                    <input type="checkbox" checked={selProducts.includes(p.id)} onChange={(e) => setSelProducts((prev) => e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id))} className="size-4 accent-violet-500" />
                    <span className="flex-1 truncate">{p.coverEmoji} {p.title}</span>
                    <span className="text-xs text-slate-400">${p.priceUsd}</span>
                  </label>
                ))}
              </div>
            )}

            <h3 className="mt-6 font-bold text-amber-300">2) المنصات</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {PLATFORMS.map((pl) => (
                <label key={pl.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${selPlatforms.includes(pl.id) ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-slate-900"}`}>
                  <input type="checkbox" checked={selPlatforms.includes(pl.id)} disabled={pl.id === "telegram" && !agent?.hasTelegram && !tgToken} onChange={(e) => setSelPlatforms((prev) => e.target.checked ? [...prev, pl.id] : prev.filter((x) => x !== pl.id))} className="size-4 accent-violet-500" />
                  <span className="flex-1">
                    <span className="font-bold">{pl.label} {pl.auto ? <span className="text-xs text-emerald-300">تلقائي</span> : <span className="text-xs text-slate-400">يدوي</span>}</span>
                    <span className="block text-xs text-slate-500">{pl.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            {selPlatforms.includes("telegram") && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
                <div className="text-sm font-bold">إعداد تيليجرام (نشر تلقائي)</div>
                <p className="mt-1 text-xs text-slate-400">أنشئ بوتاً من @BotFather وأضف قناتك (أو مجموعتك) كمسؤول فيه، ثم أدخل التوكن ومعرّف القناة. مثال للمعرّف: @my_channel أو -1001234567890</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input value={tgToken} onChange={(e) => setTgToken(e.target.value)} placeholder={agent?.hasTelegram ? "التوكن محفوظ ✓ — اتركه فارغاً للإبقاء" : "توكن البوت من BotFather"} className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-violet-400" dir="ltr" />
                  <input value={tgChat} onChange={(e) => setTgChat(e.target.value)} placeholder={agent?.hasTelegram ? "معرّف القناة محفوظ ✓" : "@channel أو -100..."} className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-violet-400" dir="ltr" />
                </div>
                <button onClick={testTelegram} disabled={busy} className="mt-3 rounded-xl border border-sky-400/30 px-4 py-2 text-sm font-bold text-sky-300 hover:bg-sky-500/10 disabled:opacity-50">إرسال رسالة اختبار</button>
              </div>
            )}

            {selPlatforms.includes("facebook_page") && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
                <div className="text-sm font-bold">إعداد صفحة فيسبوك (نشر تلقائي)</div>
                <p className="mt-1 text-xs text-slate-400">أدخل معرّف صفحتك الرقمي (من الإعدادات ← معلومات الصفحة) وتوكن الوصول للصفحة (لوحة Meta for Developers ← Access Tokens). الصلاحية المطلوبة: pages_manage_posts + pages_read_engagement.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input value={fbPageId} onChange={(e) => setFbPageId(e.target.value)} placeholder={agent?.hasFacebookPage ? "معرّف الصفحة محفوظ ✓" : "معرّف الصفحة الرقمي"} className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-violet-400" dir="ltr" />
                  <input value={fbToken} onChange={(e) => setFbToken(e.target.value)} placeholder={agent?.hasFacebookPage ? "التوكن محفوظ ✓ — اتركه فارغاً للإبقاء" : "توكن الوصول للصفحة"} className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-violet-400" dir="ltr" />
                </div>
              </div>
            )}

            <h3 className="mt-6 font-bold text-amber-300">3) أوقات النشر (بتوقيت الخرطوم)</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {HOURS.map((h) => (
                <button key={h} onClick={() => setSelHours((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h])} className={`rounded-xl border px-4 py-2 text-sm font-bold ${selHours.includes(h) ? "border-amber-400 bg-amber-400/15 text-amber-300" : "border-white/10 bg-slate-900 text-slate-400"}`}>
                  {String(h).padStart(2, "0")}:00
                </button>
              ))}
            </div>

            <h3 className="mt-6 font-bold text-amber-300">4) لغة الإعلانات</h3>
            <div className="mt-3 flex gap-2">
              {[["ar", "عربي"], ["en", "English"], ["both", "الاثنان"]].map(([id, label]) => (
                <button key={id} onClick={() => setLanguage(id)} className={`rounded-xl border px-4 py-2 text-sm font-bold ${language === id ? "border-violet-400 bg-violet-500/15 text-violet-300" : "border-white/10 bg-slate-900 text-slate-400"}`}>{label}</button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={saveConfig} disabled={busy} className="rounded-xl bg-gradient-to-l from-violet-500 to-fuchsia-500 px-8 py-3 font-extrabold text-white disabled:opacity-50">{busy ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button>
              <button onClick={cancelSub} disabled={busy} className="rounded-xl border border-red-400/20 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50">إلغاء الاشتراك</button>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-extrabold">📢 سجل منشورات الوكيل</h2>
            {me.posts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">لا توجد منشورات بعد — سيبدأ الوكيل في أول وقت نشر تحدده.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {me.posts.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-bold">{p.productTitle}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.status === "posted" ? "bg-emerald-500/15 text-emerald-300" : p.status === "manual_ready" ? "bg-sky-500/15 text-sky-300" : "bg-red-500/15 text-red-300"}`}>
                        {p.platform} — {p.status === "posted" ? "نُشر تلقائياً" : p.status === "manual_ready" ? "جاهز للنشر اليدوي" : "فشل"}
                      </span>
                    </div>
                    {(p.contentAr || p.contentEn) && (
                      <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs text-slate-300">{p.contentAr || p.contentEn}</pre>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.imageUrl && <a href={p.imageUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/5">📷 الصورة الإعلانية</a>}
                      {p.publicUrl && <a href={p.publicUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/5">🔗 المنشور</a>}
                      {p.status === "manual_ready" && (p.contentAr || p.contentEn) && (
                        <button onClick={() => navigator.clipboard?.writeText((p.contentAr || p.contentEn) || "")} className="rounded-lg border border-violet-400/30 px-3 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-500/10">📋 انسخ النص للنشر</button>
                      )}
                    </div>
                    {p.error && <p className="mt-2 text-xs text-red-300">{p.error}</p>}
                    <p className="mt-2 text-xs text-slate-600">{new Date(p.created_date).toLocaleString("ar-SD")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
