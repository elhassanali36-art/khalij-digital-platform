"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getRates, toCryptoAmount, COINS, CoinSymbol } from "@/lib/crypto";
import BuyBox, { PayMethod } from "../buy-box";
import ShareButtons from "@/components/share-buttons";

type ProductDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceUsd: number;
  coverEmoji: string;
  coverColor: string;
  salesCount: number;
  originalFileName: string | null;
  fileSize: number | null;
  createdAt: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  seller: {
    id: string;
    name: string;
    avatarEmoji: string;
    acceptPaypal: boolean;
    acceptBtc: boolean;
    acceptEth: boolean;
    acceptUsdt: boolean;
  };
};

function ProductInner() {
  const id = useSearchParams().get("id") || "";
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setNotFound(false);
    fetch(`/api/products/view?id=${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setProduct(d);
        document.title = `${d.title} — منصة الخليج`;
      })
      .catch(() => setNotFound(true));
    getRates().then(setRates);
  }, [id]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">المنتج غير موجود</h1>
        <Link href="/" className="mt-4 inline-block text-amber-400 underline">
          → العودة للمتجر
        </Link>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 text-center text-slate-400">
        جارٍ تحميل المنتج…
      </main>
    );
  }

  const usd = Number(product.priceUsd);
  const cryptoOptions: { coin: CoinSymbol; amount: string }[] = (
    [
      ["BTC", product.seller.acceptBtc],
      ["ETH", product.seller.acceptEth],
      ["USDT", product.seller.acceptUsdt],
    ] as const
  )
    .filter(([, ok]) => ok)
    .map(([coin]) => ({
      coin: coin as CoinSymbol,
      amount: toCryptoAmount(usd, rates ? rates[coin] : 1),
    }));

  const methods: PayMethod[] = [
    ...(product.seller.acceptPaypal ? (["PAYPAL"] as PayMethod[]) : []),
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
              href={`/sellers/view?id=${product.seller.id}`}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-amber-300 transition hover:bg-white/20"
            >
              {product.seller.avatarEmoji} {product.seller.name} ←
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
              text={`منتج رقمي من ${product.seller.name} على منصة الخليج`}
              path={`/products/view?id=${product.id}`}
            />
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 font-bold">💳 وسائل الدفع المتاحة</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {product.seller.acceptPaypal && (
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

export default function ProductViewPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-20 text-center text-slate-400">
          جارٍ التحميل…
        </main>
      }
    >
      <ProductInner />
    </Suspense>
  );
}
