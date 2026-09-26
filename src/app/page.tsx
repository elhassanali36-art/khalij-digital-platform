import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, sellers } from "@/db/schema";

export const dynamic = "force-dynamic";

async function loadStoreProducts() {
  return db
    .select({
      product: {
        id: products.id,
        title: products.title,
        description: products.description,
        category: products.category,
        priceUsd: products.priceUsd,
        coverEmoji: products.coverEmoji,
        coverColor: products.coverColor,
      },
      seller: {
        name: sellers.name,
        avatarEmoji: sellers.avatarEmoji,
        paypalEmail: sellers.paypalEmail,
        walletBtc: sellers.walletBtc,
        walletEth: sellers.walletEth,
        walletUsdt: sellers.walletUsdt,
      },
    })
    .from(products)
    .innerJoin(sellers, eq(products.sellerId, sellers.id))
    .where(eq(sellers.storeStatus, "active"))
    .orderBy(desc(products.createdAt));
}

export default async function HomePage() {
  let rows: Awaited<ReturnType<typeof loadStoreProducts>> = [];
  let databaseError = false;

  try {
    rows = await loadStoreProducts();
  } catch (error) {
    databaseError = true;
    console.error("Store database connection failed", error);
  }

  return (
    <main>
      {databaseError && (
        <section className="border-b border-red-400/20 bg-red-500/10 px-4 py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <b className="text-red-300">⚠️ تعذر الاتصال بقاعدة البيانات</b>
              <p className="mt-1 text-slate-300">
                راجع DATABASE_URL وشغّل ملف database-setup.sql الأخير في Supabase.
              </p>
            </div>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-red-300/30 px-4 py-2 font-bold text-red-200 hover:bg-red-400/10"
            >
              عرض تشخيص الاتصال
            </a>
          </div>
        </section>
      )}
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

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">🛍️ أحدث المنتجات</h2>
          <span className="text-sm text-slate-400">{rows.length} منتج</span>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center text-slate-400">
            لا توجد منتجات بعد — كن أول من يبيع!{" "}
            <Link href="/register" className="text-amber-400 underline">
              أنشئ حسابك الآن
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ product: p, seller: s }) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-xl hover:shadow-amber-500/10"
              >
                <div
                  className={`flex h-40 items-center justify-center bg-gradient-to-br ${p.coverColor} text-6xl transition group-hover:scale-105`}
                >
                  {p.coverEmoji}
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-slate-300">
                      {p.category}
                    </span>
                    <span className="text-slate-500">
                      {s.avatarEmoji} {s.name}
                    </span>
                  </div>
                  <h3 className="line-clamp-1 text-lg font-bold group-hover:text-amber-300">
                    {p.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {p.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-extrabold text-amber-400">
                      ${Number(p.priceUsd).toFixed(2)}
                    </span>
                    <span className="flex gap-1 text-sm">
                      {s.paypalEmail && <span title="PayPal" className="text-sky-400">💳</span>}
                      {s.walletBtc && <span title="بيتكوين" className="text-orange-400">₿</span>}
                      {s.walletEth && <span title="إيثيريوم" className="text-indigo-400">Ξ</span>}
                      {s.walletUsdt && <span title="USDT" className="text-emerald-400">₮</span>}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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
