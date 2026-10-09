"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiDownload } from "@/lib/api-bridge";
import { COINS, CoinSymbol } from "@/lib/crypto";
import StoreRatingForm from "@/components/store-rating-form";

type OrderData = {
  id: string;
  method: CoinSymbol | "PAYPAL";
  usdAmount: string;
  cryptoAmount: string | null;
  paymentAddress: string;
  status: string;
  buyerEmail: string;
  product: {
    id: number;
    title: string;
    coverEmoji: string;
    coverColor: string;
    sellerName: string;
    sellerId: number;
    downloadUrl: string | null;
  };
};

function CheckoutInner() {
  const id = useSearchParams().get("id") || "";
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    setOrder(await res.json());
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function confirmPayment() {
    setError("");
    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "تعذر تأكيد الدفع");
      } else {
        await load();
      }
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setConfirming(false);
  }

  function copyAddress() {
    if (!order) return;
    navigator.clipboard.writeText(order.paymentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-2xl">😕 الطلب غير موجود</p>
        <Link href="/" className="mt-4 inline-block text-amber-400 underline">
          العودة للمتجر
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center text-slate-400">
        جارٍ تحميل الطلب…
      </main>
    );
  }

  // ✅ حالة الدفع المكتمل
  if (order.status === "paid") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-4xl">
            ✅
          </div>
          <h1 className="text-3xl font-extrabold text-emerald-400">تم الدفع بنجاح!</h1>
          <p className="mt-3 text-slate-300">
            شكراً لشرائك <b>{order.product.title}</b>. تم إرسال نسخة إلى{" "}
            <span dir="ltr" className="font-mono text-amber-300">{order.buyerEmail}</span>
          </p>
          {order.product.downloadUrl && (
            <button
              onClick={() => apiDownload(`/api/orders/${order.id}/download`)}
              className="mt-6 inline-block rounded-xl bg-gradient-to-l from-emerald-400 to-teal-500 px-8 py-4 text-lg font-extrabold text-slate-950 transition hover:opacity-90"
            >
              ⬇️ تحميل المنتج الآن
            </button>
          )}
          <div className="mt-6 text-xs text-slate-500">
            رقم الطلب: <span className="font-mono">{order.id}</span>
          </div>
          <StoreRatingForm
            orderId={order.id}
            buyerEmail={order.buyerEmail}
            sellerName={order.product.sellerName}
          />
          <Link href="/" className="mt-6 block text-sm text-slate-400 underline">
            متابعة التسوق
          </Link>
        </div>
      </main>
    );
  }

  // 💳 الدفع عبر PayPal
  if (order.method === "PAYPAL") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-center text-2xl font-extrabold">
          إتمام الدفع عبر <span className="text-sky-400">PayPal 💳</span>
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          {order.product.coverEmoji} {order.product.title} — بواسطة {order.product.sellerName}
        </p>

        <div className="mt-8 rounded-3xl border border-sky-400/20 bg-white/5 p-6">
          <div className="rounded-2xl bg-slate-900 p-5 text-center">
            <div className="text-sm text-slate-400">المبلغ المطلوب</div>
            <div className="text-4xl font-extrabold text-sky-400">
              ${Number(order.usdAmount).toFixed(2)}
            </div>
          </div>

          <label className="mt-5 block text-sm font-semibold">
            أرسل المبلغ إلى حساب PayPal التالي:
          </label>
          <div className="mt-2 flex items-center gap-2">
            <code
              dir="ltr"
              className="block flex-1 overflow-hidden text-ellipsis rounded-xl bg-slate-900 px-3 py-3 text-sm text-sky-300"
            >
              {order.paymentAddress}
            </code>
            <button
              onClick={copyAddress}
              className="rounded-xl border border-white/15 px-3 py-3 text-sm transition hover:bg-white/10"
            >
              {copied ? "✅" : "📋"}
            </button>
          </div>

          <a
            href={`https://www.paypal.com/paypalme/${encodeURIComponent(
              order.paymentAddress.split("@")[0]
            )}/${Number(order.usdAmount).toFixed(2)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full rounded-xl bg-[#0070ba] py-3 text-center font-extrabold text-white transition hover:opacity-90"
          >
            فتح PayPal للدفع ↗
          </a>

          <ol className="mt-5 space-y-2 text-sm text-slate-300">
            <li>1️⃣ ادفع المبلغ عبر PayPal إلى البريد أعلاه</li>
            <li>2️⃣ انسخ رقم المعاملة (Transaction ID) من إيصال الدفع</li>
            <li>3️⃣ الصقه هنا واضغط تأكيد لاستلام منتجك فوراً</li>
          </ol>

          <input
            dir="ltr"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="PayPal Transaction ID"
            className="mt-4 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-left font-mono text-sm outline-none focus:border-sky-400"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={confirmPayment}
            disabled={confirming}
            className="mt-4 w-full rounded-xl bg-gradient-to-l from-sky-400 to-blue-600 py-3 font-extrabold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? "جارٍ التحقق…" : "✔️ لقد دفعت — تأكيد الدفع"}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            🔒 وضع تجريبي: يُعتمد الطلب فور إدخال رقم المعاملة. اربط PayPal API
            للتحقق الآلي في الإنتاج.
          </p>
        </div>
      </main>
    );
  }

  // ⏳ الدفع بالعملات الرقمية
  const coinInfo = COINS[order.method];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=0f172a&color=fbbf24&data=${encodeURIComponent(
    order.paymentAddress
  )}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center text-2xl font-extrabold">
        إتمام الدفع بعملة {coinInfo.nameAr}{" "}
        <span className={coinInfo.color}>{coinInfo.icon}</span>
      </h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        {order.product.coverEmoji} {order.product.title} — بواسطة {order.product.sellerName}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* QR + المبلغ */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="mx-auto w-fit rounded-2xl border border-amber-400/30 bg-slate-900 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR للدفع" width={220} height={220} className="rounded-lg" />
          </div>
          <div className="mt-4 text-sm text-slate-400">المبلغ المطلوب تحويله</div>
          <div className="font-mono text-2xl font-bold text-amber-400" dir="ltr">
            {Number(order.cryptoAmount ?? 0).toFixed(order.method === "USDT" ? 2 : 8)}{" "}
            {order.method}
          </div>
          <div className="text-sm text-slate-500">≈ ${Number(order.usdAmount).toFixed(2)}</div>
          <div className="mt-2 text-xs text-slate-500">{coinInfo.network}</div>
        </div>

        {/* العنوان + التأكيد */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <label className="text-sm font-semibold">عنوان محفظة الاستلام</label>
          <div className="mt-2 flex items-center gap-2">
            <code
              dir="ltr"
              className="block flex-1 overflow-hidden text-ellipsis rounded-xl bg-slate-900 px-3 py-3 text-xs text-emerald-300"
            >
              {order.paymentAddress}
            </code>
            <button
              onClick={copyAddress}
              className="rounded-xl border border-white/15 px-3 py-3 text-sm transition hover:bg-white/10"
            >
              {copied ? "✅" : "📋"}
            </button>
          </div>

          <ol className="mt-5 space-y-2 text-sm text-slate-300">
            <li>1️⃣ افتح محفظتك (Binance, Trust Wallet, MetaMask…)</li>
            <li>2️⃣ حوّل المبلغ المحدد بالضبط إلى العنوان أعلاه</li>
            <li>3️⃣ الصق معرف المعاملة (TxID) هنا واضغط تأكيد</li>
          </ol>

          <input
            dir="ltr"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="معرف المعاملة TxID / Hash"
            className="mt-4 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-left font-mono text-sm outline-none focus:border-amber-400"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={confirmPayment}
            disabled={confirming}
            className="mt-4 w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-3 font-extrabold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? "جارٍ التحقق…" : "✔️ لقد أتممت التحويل — تأكيد الدفع"}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            🔒 وضع تجريبي: يتم اعتماد الطلب فور إدخال TxID. اربط مزوّد دفع مثل
            NOWPayments للتحقق الآلي على الشبكة.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-400">جارٍ التحميل…</main>}>
      <CheckoutInner />
    </Suspense>
  );
}
