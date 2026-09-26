import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, sellers, storeRatings } from "@/db/schema";
import ShareButtons from "@/components/share-buttons";
import SellerSocialLinks from "@/components/seller-social-links";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sellerId = Number(id);
  if (!Number.isInteger(sellerId)) return { title: "متجر غير موجود" };

  try {
    const [seller] = await db
      .select({ name: sellers.name, bio: sellers.bio })
      .from(sellers)
      .where(and(eq(sellers.id, sellerId), eq(sellers.storeStatus, "active")));
    if (!seller) return { title: "متجر غير موجود" };
    const title = `متجر ${seller.name}`;
    const description = seller.bio?.slice(0, 160) || `تصفح منتجات ${seller.name} الرقمية`;
    return {
      title,
      description,
      alternates: { canonical: `/sellers/${sellerId}` },
      openGraph: { title, description, url: `/sellers/${sellerId}`, type: "website" },
      twitter: { card: "summary", title, description },
    };
  } catch {
    return { title: "متجر بائع" };
  }
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sellerId = Number(id);
  if (Number.isNaN(sellerId)) notFound();

  const [seller] = await db
    .select()
    .from(sellers)
    .where(and(eq(sellers.id, sellerId), eq(sellers.storeStatus, "active")));
  if (!seller) notFound();

  const sellerProducts = await db
    .select()
    .from(products)
    .where(eq(products.sellerId, sellerId))
    .orderBy(desc(products.createdAt));

  const ratingRows = await db
    .select({
      id: storeRatings.id,
      rating: storeRatings.rating,
      review: storeRatings.review,
      buyerName: storeRatings.buyerName,
      createdAt: storeRatings.createdAt,
    })
    .from(storeRatings)
    .where(eq(storeRatings.sellerId, sellerId))
    .orderBy(desc(storeRatings.updatedAt));

  const totalSales = sellerProducts.reduce((s, p) => s + p.salesCount, 0);
  const averageRating = ratingRows.length
    ? ratingRows.reduce((sum, row) => sum + row.rating, 0) / ratingRows.length
    : 0;
  const reviews = ratingRows.filter((row) => row.review).slice(0, 12);
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
                  {sellerProducts.length}
                </div>
                <div className="text-xs text-slate-400">منتج</div>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <div className="text-lg font-extrabold text-emerald-400">{totalSales}</div>
                <div className="text-xs text-slate-400">عملية بيع</div>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <div className="text-lg font-extrabold text-amber-400">
                  ★ {averageRating.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400">{ratingRows.length} تقييم موثق</div>
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
            {seller.paypalEmail && (
              <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-400">💳 PayPal</span>
            )}
            {seller.walletBtc && (
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-orange-400">₿ Bitcoin</span>
            )}
            {seller.walletEth && (
              <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-indigo-400">Ξ Ethereum</span>
            )}
            {seller.walletUsdt && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-400">₮ USDT</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ShareButtons
          title={`متجر ${seller.name} على منصة الخليج`}
          text={seller.bio || "اكتشف المنتجات الرقمية في متجري"}
          path={`/sellers/${seller.id}`}
        />
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">⭐ تقييمات المتجر</h2>
            <p className="mt-1 text-sm text-slate-400">جميع التقييمات مرتبطة بطلبات مدفوعة.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-amber-400">{averageRating.toFixed(1)} / 5</div>
            <div className="text-xs text-slate-500">من {ratingRows.length} تقييم</div>
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
      {sellerProducts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
          لا توجد منتجات منشورة بعد.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sellerProducts.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
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
