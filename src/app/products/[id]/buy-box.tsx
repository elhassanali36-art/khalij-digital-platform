"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COINS, CoinSymbol } from "@/lib/crypto";

export type PayMethod = CoinSymbol | "PAYPAL";

export default function BuyBox({
  productId,
  priceUsd,
  methods,
}: {
  productId: number;
  priceUsd: number;
  methods: PayMethod[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PayMethod>(methods[0] ?? "PAYPAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBuy() {
    setError("");
    if (!email.includes("@")) {
      setError("أدخل بريداً إلكترونياً صحيحاً لاستلام المنتج");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, buyerEmail: email, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "تعذر إنشاء الطلب");
        setLoading(false);
        return;
      }
      router.push(`/checkout/${data.id}`);
    } catch {
      setError("تعذر الاتصال بالخادم");
      setLoading(false);
    }
  }

  function methodLabel(m: PayMethod) {
    if (m === "PAYPAL") {
      return (
        <>
          <div className="text-xl font-bold text-sky-400">💳</div>
          <div className="mt-1 text-xs">PayPal</div>
        </>
      );
    }
    return (
      <>
        <div className={`text-xl font-bold ${COINS[m].color}`}>{COINS[m].icon}</div>
        <div className="mt-1 text-xs">{m}</div>
      </>
    );
  }

  return (
    <div className="sticky top-24 rounded-3xl border border-amber-400/20 bg-gradient-to-b from-white/10 to-white/5 p-6">
      <div className="text-center">
        <div className="text-sm text-slate-400">السعر</div>
        <div className="text-4xl font-extrabold text-amber-400">
          ${priceUsd.toFixed(2)}
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold">
          بريدك الإلكتروني (لاستلام المنتج)
        </label>
        <input
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-left outline-none transition focus:border-amber-400"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold">اختر وسيلة الدفع</label>
        <div className="grid grid-cols-2 gap-2">
          {methods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-xl border px-3 py-3 text-center transition ${
                method === m
                  ? "border-amber-400 bg-amber-400/15"
                  : "border-white/10 bg-slate-900 hover:border-white/30"
              }`}
            >
              {methodLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        onClick={handleBuy}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-4 text-lg font-extrabold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "جارٍ إنشاء الطلب…" : "🛒 اشترِ الآن"}
      </button>

      <ul className="mt-5 space-y-2 text-xs text-slate-400">
        <li>⚡ تسليم فوري بعد تأكيد الدفع</li>
        <li>💳 ادفع بـ PayPal أو العملات الرقمية</li>
        <li>🔒 معاملات آمنة ومباشرة</li>
      </ul>
    </div>
  );
}
