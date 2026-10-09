"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StoreProduct = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceUsd: number;
  coverEmoji: string;
  coverColor: string;
  sellerName: string;
  sellerAvatar: string;
  sellerAccepts: { paypal: boolean; btc: boolean; eth: boolean; usdt: boolean };
};

export default function HomePage() {
  const [rows, setRows] = useState<StoreProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { setRows(Array.isArray(d) ? d : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);
  if (!loaded) {
    return <main className="mx-auto max-w-6xl px-4 py-20 text-center text-slate-400">جارٍ تحميل المتجر…</main>;
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="mb-4 inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1 text-sm text-amber-300">
            💳 PayPal • ₿ Bitcoin • Ξ Ethereum • ₮ USDT — ادفع بالطريقة التي تناسبك
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
            بِع منتجاتك الرقمية
            <span className="bg-gradient-to-l from-amber-300 to-orange-500 bg-clip-text text-transparent">
              {" "}
              واقبض أرباحك بسهولة
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            كتب إلكترونية، قوالب، دورات، برمجيات، تصاميم… أنشئ ملفك الشخصي كبائع،
            ارفع منتجاتك، واستقبل المدفوعات عبر PayPal أو العملات الرقمية.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 px-8 py-3 text-lg font-bold text-slate-950 transition hover:scale-105"
            >
              أنشئ حساب بائع مجاناً
            </Link>
            <a
              href="#products"
              className="rounded-xl border border-white/15 px-8 py-3 text-lg font-semibold text-slate-200 transition hover:bg-white/5"
            >
              تصفح المنتجات
            </a>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-4 text-center md:mx-auto md:max-w-xl">
            {[
              { n: "4", t: "وسائل دفع مدعومة" },
              { n: "95%", t: "من الأرباح للبائع عند السحب" },
              { n: "60 ثانية", t: "لإطلاق منتجك" },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-extrabold text-amber-400">{s.n}</div>
                <div className="mt-1 text-xs text-slate-400">{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold">كيف تعمل المنصة؟</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                icon: "👤",
                t: "١. أنشئ ملفك الشخصي",
                d: "سجّل كبائع وأضف وسائل استقبال أرباحك (PayPal أو محافظ كريبتو).",
              },
              {
                icon: "📤",
                t: "٢. ارفع منتجاتك",
                d: "أضف العنوان والسعر ورابط الملف ليظهر منتجك في المتجر فوراً.",
              },
              {
                icon: "💳",
                t: "٣. يدفع العميل كما يشاء",
                d: "PayPal أو بيتكوين أو إيثيريوم أو USDT — والتسليم فوري.",
              },
              {
                icon: "💸",
                t: "٤. اسحب أرباحك",
                d: "اسحب رصيدك متى شئت. عمولة المنصة 5% فقط تُخصم عند السحب.",
              },
            ].map((s) => (
              <div
                key={s.t}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl text-slate-950">
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
