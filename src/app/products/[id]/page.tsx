import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, sellers } from "@/db/schema";
import { getRates, toCryptoAmount, COINS, CoinSymbol } from "@/lib/crypto";
import BuyBox, { PayMethod } from "./buy-box";
import ShareButtons from "@/components/share-buttons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) return { title: "منتج غير موجود" };

  try {
    const [row] = await db
      .select({
        title: products.title,
        description: products.description,
        sellerName: sellers.name,
      })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(
        and(eq(products.id, productId), eq(sellers.storeStatus, "active"))
      );
    if (!row) return { title: "منتج غير موجود" };
    const description = `${row.description.slice(0, 140)} — بواسطة ${row.sellerName}`;
    return {
      title: row.title,
      description,
      alternates: { canonical: `/products/${productId}` },
      openGraph: { title: row.title, description, url: `/products/${productId}`, type: "website" },
      twitter: { card: "summary", title: row.title, description },
    };
  } catch {
    return { title: "منتج رقمي" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) notFound();

  const [row] = await db
    .select({ product: products, seller: sellers })
    .from(products)
    .innerJoin(sellers, eq(products.sellerId, sellers.id))
    .where(
      and(eq(products.id, productId), eq(sellers.storeStatus, "active"))
    );
  if (!row) notFound();
  const { product, seller } = row;

  const rates = await getRates();
  const usd = Number(product.priceUsd);

  const cryptoOptions: { coin: CoinSymbol; amount: string }[] = (
    [
      ["BTC", seller.walletBtc],
      ["ETH", seller.walletEth],
      ["USDT", seller.walletUsdt],
    ] as const
  )
    .filter(([, w]) => Boolean(w))
    .map(([coin]) => ({
      coin,
      amount: toCryptoAmount(usd, rates[coin]),
    }));

  const methods: PayMethod[] = [
    ...(seller.paypalEmail ? (["PAYPAL"] as PayMethod[]) : []),
    ...cryptoOptions.map((c) => c.coin as PayMethod),
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/" className="text-sm text-slate-400 hover:text-amber-400">
        → العودة للمتجر
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-5">
        {/* Info */}
        <div className="lg:col-span-3">
          <div
            className={`flex h-64 items-center justify-center rounded-3xl bg-gradient-to-br ${product.coverColor} text-8xl`}
          >
            {product.coverEmoji}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">{product.category}</span>
            <Link
              href={`/sellers/${seller.id}`}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-amber-300 transition hover:bg-white/20"
            >
              {seller.avatarEmoji} {seller.name} ←
            </Link>
            <span className="text-slate-500">• {product.salesCount} عملية بيع</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">{product.title}</h1>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-300">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div>
              <div className="font-bold text-emerald-300">⬇️ منتج رقمي قابل للتنزيل</div>
              <div className="mt-1 text-sm text-slate-400">
                {product.originalFileName || "رابط تحميل رقمي"}
                {product.fileSize
                  ? ` • ${(product.fileSize / 1024 / 1024).toFixed(2)} MB`
                  : ""}
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
              يفتح بعد الدفع
            </span>
          </div>

          <div className="mt-6">
            <ShareButtons
              title={product.title}
              text={`منتج رقمي من ${seller.name} على منصة الخليج`}
              path={`/products/${product.id}`}
            />
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 font-bold">💳 وسائل الدفع المتاحة</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {seller.paypalEmail && (
                <div className="rounded-xl border border-white/10 bg-slate-900 p-3 text-center">
                  <div className="text-2xl font-bold text-sky-400">💳</div>
                  <div className="mt-1 text-sm font-semibold">PayPal</div>
                  <div className="text-xs text-slate-500">${usd.toFixed(2)}</div>
                </div>
              )}
              {cryptoOptions.map(({ coin, amount }) => (
                <div
                  key={coin}
                  className="rounded-xl border border-white/10 bg-slate-900 p-3 text-center"
                >
                  <div className={`text-2xl font-bold ${COINS[coin].color}`}>
                    {COINS[coin].icon}
                  </div>
                  <div className="mt-1 font-mono text-sm">{amount}</div>
                  <div className="text-xs text-slate-500">{coin}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buy box */}
        <div className="lg:col-span-2">
          <BuyBox productId={product.id} priceUsd={usd} methods={methods} />
        </div>
      </div>
    </main>
  );
}
