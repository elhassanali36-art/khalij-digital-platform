"use client";

import { useState } from "react";

export default function StoreRatingForm({
  orderId,
  buyerEmail,
  sellerName,
}: {
  orderId: string;
  buyerEmail: string;
  sellerName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [buyerName, setBuyerName] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!rating) {
      setError("اختر عدد النجوم أولًا");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, buyerEmail, rating, buyerName, review }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "تعذر حفظ التقييم");
    else setMessage(`✅ ${data.message}`);
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-right">
      <h2 className="text-lg font-bold">⭐ قيّم متجر {sellerName}</h2>
      <p className="mt-1 text-sm text-slate-400">تقييمك موثق لأنه مرتبط بعملية شراء مدفوعة.</p>

      <div className="mt-4 flex justify-center gap-2" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className={`text-4xl transition hover:scale-110 ${star <= (hovered || rating) ? "text-amber-400" : "text-slate-700"}`}
            aria-label={`${star} نجوم`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        <input
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          maxLength={50}
          placeholder="اسمك الظاهر (اختياري)"
          className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-amber-400"
        />
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          maxLength={1000}
          placeholder="اكتب تجربتك مع المتجر (اختياري)"
          className="min-h-24 rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-amber-400"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
      <button disabled={loading} className="mt-4 w-full rounded-xl bg-amber-400 py-3 font-extrabold text-slate-950 disabled:opacity-50">
        {loading ? "جارٍ الحفظ…" : rating ? `إرسال تقييم ${rating}/5` : "إرسال التقييم"}
      </button>
    </form>
  );
}
