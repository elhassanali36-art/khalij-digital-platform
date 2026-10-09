"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ShareButtons from "@/components/share-buttons";
import SellerSocialLinks from "@/components/seller-social-links";

type PublicSeller = {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarEmoji: string;
  avatarColor: string;
  websiteUrl: string | null;
  whatsappUrl: string | null;
  telegramUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  snapchatUrl: string | null;
  otherSocialLabel: string | null;
  otherSocialUrl: string | null;
  storeStatus: string;
  createdAt: string;
  acceptPaypal: boolean;
  acceptBtc: boolean;
  acceptEth: boolean;
  acceptUsdt: boolean;
};

type ProductRow = {
  id: string;
  title: string;
  category: string;
  priceUsd: number;
  coverEmoji: string;
  coverColor: string;
  salesCount: number;
};

type ReviewRow = {
  id: string;
  rating: number;
  review: string;
  buyerName: string | null;
  createdAt: string;
};

function SellerInner() {
  const id = useSearchParams().get("id") || "";
  const [seller, setSeller] = useState<PublicSeller | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [ratings, setRatings] = useState<{
    average: number;
    count: number;
    reviews: ReviewRow[];
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setNotFound(false);
    (async () => {
      try {
        const sRes = await fetch(`/api/sellers?id=${encodeURIComponent(id)}`);
        if (!sRes.ok) return setNotFound(true);
        const s = await sRes.json();
        if (!s || s.storeStatus !== "active") return setNotFound(true);
        setSeller(s);
        document.title = `متجر ${s.name} — منصة الخليج`;
        const [pRes, rRes] = await Promise.all([
          fetch(`/api/products?seller=${encodeURIComponent(s.email)}`),
          fetch(`/api/ratings?sellerId=${encodeURIComponent(id)}`),
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (rRes.ok) setRatings(await rRes.json());
      } catch {
        setNotFound(true);
      }
    })();
  }, [id]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">المتجر غير موجود</h1>
        <Link href="/" className="mt-4 inline-block text-amber-400 underline">
          → العودة للمتجر
        </Link>
      </main>
    );
  }

  if (!seller || !ratings) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 text-center text-slate-400">
        جارٍ تحميل المتجر…
      </main>
    );
  }

  const totalSales = products.reduce((s, p) => s + (p.salesCount || 0), 0);
  const reviews = ratings.reviews.slice(0, 12);
  const joined = new Date(seller.createdAt).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/" className="text-sm text-slate-400 hover:text-amber-400">
        → العودة للمتجر
      </Link>

      {/* بطاقة الملف الشخصي */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className={`h-28 bg-gradient-to-l ${seller.avatarColor}`} />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-slate-950 bg-gradient-to-br ${seller.avatarColor} text-5xl`}
            >
              {seller.avatarEmoji}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-extrabold">{seller.name}</h1>
              <p className="text-sm text-slate-400">عضو منذ {joined}</p>
            </div>
            <div className="mr-auto flex gap-3 pb-1 text-center">
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <div className="text-lg font-extrabold text-amber-400">
                  {products.length}
                </div>
                <div className="text-xs text-slate-400">منتج</div>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <div className="text-lg font-extrabold text-emerald-400">{totalSales}</div>
                <div className="text-xs text-slate-400">عملية بيع</div>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <div className="text-lg font-extrabold text-amber-400">
                  ★ {ratings.average.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400">{ratings.count} تقييم موثق</div>
              </div>
            </div>
          </div>

          {seller.bio && (
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">{seller.bio}</p>
          )}

          <SellerSocialLinks
            links={{
              websiteUrl: seller.websiteUrl,
              whatsappUrl: seller.whatsappUrl,
              telegramUrl: seller.telegramUrl,
              instagramUrl: seller.instagramUrl,
              facebookUrl: seller.facebookUrl,
              xUrl: seller.xUrl,
              tiktokUrl: seller.tiktokUrl,
              youtubeUrl: seller.youtubeUrl,
              linkedinUrl: seller.linkedinUrl,
              snapchatUrl: seller.snapchatUrl,
              otherSocialLabel: seller.otherSocialLabel,
              otherSocialUrl: seller.otherSocialUrl,
            }}
          />

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="text-slate-400">يستقبل الدفع عبر:</span>
            {seller.acceptPaypal && (
              <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-400">💳 PayPal</span>
            )}
            {seller.acceptBtc && (
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-orange-400">₿ Bitcoin</span>
            )}
            {seller.acceptEth && (
              <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-indigo-400">Ξ Ethereum</span>
            )}
            {seller.acceptUsdt && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-400">₮ USDT</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ShareButtons
          title={`متجر ${seller.name} على منصة الخليج`}
          text={seller.bio || "اكتشف المنتجات الرقمية في متجري"}
          path={`/sellers/view?id=${seller.id}`}
        />
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">⭐ تقييمات المتجر</h2>
            <p className="mt-1 text-sm text-slate-400">جميع التقييمات مرتبطة بطلبات مدفوعة.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-amber-400">{ratings.average.toFixed(1)} / 5</div>
            <div className="text-xs text-slate-500">من {ratings.count} تقييم</div>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                <div className="flex items-center justify-between gap-3">
                  <b>{review.buyerName || "مشتري موثق"}</b>
                  <span className="text-amber-400">{"★".repeat(review.rating)}<span className="text-slate-700">{"★".repeat(5 - review.rating)}</span></span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">{review.review}</p>
                <time className="mt-3 block text-xs text-slate-600">{new Date(review.createdAt).toLocaleDateString("ar-EG")}</time>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            لا توجد مراجعات مكتوبة حتى الآن.
          </p>
        )}
      </section>

      {/* منتجات البائع */}
      <h2 className="mt-10 mb-6 text-xl font-bold">🛍️ منتجات {seller.name}</h2>
      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
          لا توجد منتجات منشورة بعد.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/view?id=${p.id}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-amber-400/40"
            >
              <div
                className={`flex h-36 items-center justify-center bg-gradient-to-br ${p.coverColor} text-5xl transition group-hover:scale-105`}
              >
                {p.coverEmoji}
              </div>
              <div className="p-5">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                  {p.category}
                </span>
                <h3 className="mt-2 line-clamp-1 text-lg font-bold group-hover:text-amber-300">
                  {p.title}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xl font-extrabold text-amber-400">
                    ${Number(p.priceUsd).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500">{p.salesCount} مبيعة</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default function SellerViewPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-20 text-center text-slate-400">
          جارٍ التحميل…
        </main>
      }
    >
      <SellerInner />
    </Suspense>
  );
}
