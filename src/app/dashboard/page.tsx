"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ShareButtons from "@/components/share-buttons";

type SellerSummary = {
  id: number;
  name: string;
  email: string;
  avatarEmoji: string;
  storeStatus: "active" | "suspended" | "deleted";
  moderationReason: string | null;
};

type Product = {
  id: number;
  title: string;
  coverEmoji: string;
  coverColor: string;
  priceUsd: string;
  salesCount: number;
  category: string;
};

type Sale = {
  id: string;
  method: string;
  usdAmount: string;
  cryptoAmount: string | null;
  status: string;
  buyerEmail: string;
  createdAt: string;
  productTitle: string;
  coverEmoji: string;
};

type WithdrawalRow = {
  id: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  method: string;
  destination: string;
  status: string;
  createdAt: string;
};

type BalanceData = {
  totalEarned: number;
  totalWithdrawn: number;
  available: number;
  feeRate: number;
  history: WithdrawalRow[];
};

const METHOD_LABEL: Record<string, string> = {
  PAYPAL: "💳 PayPal",
  BTC: "₿ BTC",
  ETH: "Ξ ETH",
  USDT: "₮ USDT",
};

export default function DashboardPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerSummary | null>(null);
  const [productList, setProductList] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  // نموذج السحب
  const [wAmount, setWAmount] = useState("");
  const [wMethod, setWMethod] = useState("PAYPAL");
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState("");
  const [wSuccess, setWSuccess] = useState("");

  // كل الطلبات هنا تعتمد على كوكي الجلسة (نفس الأصل، تُرسل تلقائيًا مع
  // fetch) — لا يُرسل أي بريد/معرّف بائع من العميل لتحديد الهوية.
  const loadData = useCallback(async () => {
    setLoading(true);
    setNotRegistered(false);
    try {
      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      setLoggedIn(true);
      const profile: SellerSummary = await meRes.json();
      const [pRes, sRes, bRes] = await Promise.all([
        fetch("/api/products?seller=" + encodeURIComponent(profile.email)),
        fetch("/api/sales"),
        fetch("/api/withdrawals"),
      ]);
      setSellerProfile(profile);
      setProductList(pRes.ok ? await pRes.json() : []);
      setSales(sRes.ok ? await sRes.json() : []);
      setBalance(bRes.ok ? await bRes.json() : null);
    } catch {
      // تجاهل
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.requiresClaim) {
          setLoginError(
            "هذا الحساب أُنشئ قبل تفعيل تسجيل الدخول الآمن. تواصل مع الدعم لتفعيل حسابك."
          );
        } else if (res.status === 404) {
          setNotRegistered(true);
        } else {
          setLoginError(data.error ?? "تعذر تسجيل الدخول");
        }
        return;
      }
      setLoginPassword("");
      await loadData();
    } catch {
      setLoginError("تعذر الاتصال بالخادم");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setSellerProfile(null);
    setBalance(null);
    setSales([]);
    setProductList([]);
  }

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setWError("");
    setWSuccess("");
    setWLoading(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(wAmount),
          method: wMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWError(data.error ?? "تعذر تنفيذ السحب");
      } else {
        setWSuccess(
          `✅ تم إرسال طلب السحب (بحالة "قيد المراجعة"). المبلغ الصافي بعد العمولة: $${Number(
            data.netAmount
          ).toFixed(2)} (عمولة المنصة $${Number(data.feeAmount).toFixed(2)}). سيُحوّل فعليًا بعد موافقة الإدارة.`
        );
        setWAmount("");
        await loadData();
      }
    } catch {
      setWError("تعذر الاتصال بالخادم");
    }
    setWLoading(false);
  }

  const gross = Number(wAmount) || 0;
  const fee = gross * (balance?.feeRate ?? 0.05);
  const net = gross - fee;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">📊 لوحة تحكم البائع</h1>
      <p className="mt-2 text-slate-400">
        سجّل الدخول بحسابك لعرض أرباحك وسحبها.
      </p>

      {!loggedIn && (
        <form onSubmit={submitLogin} className="mt-6 max-w-lg space-y-3">
          <input
            type="email"
            dir="ltr"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="seller@example.com"
            className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-left outline-none focus:border-amber-400"
            required
          />
          <input
            type="password"
            dir="ltr"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-left outline-none focus:border-amber-400"
            required
          />
          {loginError && <p className="text-sm text-red-400">{loginError}</p>}
          <button className="rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 px-6 py-3 font-bold text-slate-950 transition hover:opacity-90">
            تسجيل الدخول
          </button>
        </form>
      )}

      {loggedIn && (
        <button
          onClick={logout}
          className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          تسجيل الخروج
        </button>
      )}

      {loading && <p className="mt-8 text-slate-400">جارٍ التحميل…</p>}

      {notRegistered && !loading && (
        <p className="mt-8 rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400">
          لا يوجد حساب بائع بهذا البريد.{" "}
          <Link href="/register" className="text-amber-400 underline">
            أنشئ ملفك الشخصي الآن
          </Link>
        </p>
      )}

      {loggedIn && !loading && balance && (
        <>
          {sellerProfile && sellerProfile.storeStatus !== "active" && (
            <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5">
              <h2 className="font-bold text-red-300">
                {sellerProfile.storeStatus === "deleted" ? "🗑️ تم حذف متجرك من المنصة" : "⛔ متجرك موقوف مؤقتًا"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                السبب: {sellerProfile.moderationReason || "راجع إدارة المنصة"}. لا يمكن نشر منتجات أو استقبال طلبات جديدة أثناء هذه الحالة.
              </p>
            </div>
          )}

          {/* الإحصائيات */}
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">إجمالي الأرباح</div>
              <div className="mt-1 text-3xl font-extrabold text-emerald-400">
                ${balance.totalEarned.toFixed(2)}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <div className="text-sm text-slate-400">الرصيد المتاح للسحب</div>
              <div className="mt-1 text-3xl font-extrabold text-amber-400">
                ${balance.available.toFixed(2)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">إجمالي المسحوب</div>
              <div className="mt-1 text-3xl font-extrabold">
                ${balance.totalWithdrawn.toFixed(2)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">عدد المنتجات</div>
              <div className="mt-1 text-3xl font-extrabold">{productList.length}</div>
            </div>
          </div>

          {sellerProfile && (
            <section className="mt-8 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">🔗 رابط متجرك العام</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    شارك هذا الرابط ليشاهد العملاء كل منتجاتك وحسابات التواصل الخاصة بك.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/sellers/view?id=${sellerProfile.id}`}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/5"
                  >
                    عرض المتجر
                  </Link>
                  <Link
                    href="/profile/edit"
                    className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950"
                  >
                    تعديل وروابط التواصل
                  </Link>
                </div>
              </div>
              <div className="mt-4">
                <ShareButtons
                  title={`متجر ${sellerProfile.name} على منصة الخليج`}
                  text="اكتشف منتجاتي الرقمية"
                  path={`/sellers/view?id=${sellerProfile.id}`}
                />
              </div>
            </section>
          )}

          {/* سحب الأرباح */}
          <section className="mt-10 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
            <h2 className="text-xl font-bold">💸 سحب الأرباح</h2>
            <p className="mt-1 text-sm text-slate-400">
              تُخصم عمولة المنصة{" "}
              <b className="text-amber-400">{((balance.feeRate) * 100).toFixed(0)}%</b>{" "}
              من كل عملية سحب، ويصلك الصافي إلى وجهتك المختارة.
            </p>
            <form onSubmit={withdraw} className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                type="number"
                dir="ltr"
                min="1"
                step="0.01"
                value={wAmount}
                onChange={(e) => setWAmount(e.target.value)}
                placeholder={`المبلغ (حتى $${balance.available.toFixed(2)})`}
                className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-left outline-none focus:border-emerald-400"
                required
              />
              <select
                value={wMethod}
                onChange={(e) => setWMethod(e.target.value)}
                className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
              >
                <option value="PAYPAL">💳 PayPal</option>
                <option value="BTC">₿ Bitcoin</option>
                <option value="ETH">Ξ Ethereum</option>
                <option value="USDT">₮ USDT</option>
              </select>
              <button
                disabled={wLoading || balance.available <= 0}
                className="rounded-xl bg-gradient-to-l from-emerald-400 to-teal-500 px-6 py-3 font-extrabold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
              >
                {wLoading ? "جارٍ التنفيذ…" : "سحب الآن"}
              </button>
            </form>

            {gross > 0 && (
              <div className="mt-4 grid gap-2 rounded-xl bg-slate-900 p-4 text-sm sm:grid-cols-3">
                <div>
                  المبلغ المطلوب: <b>${gross.toFixed(2)}</b>
                </div>
                <div className="text-red-400">
                  عمولة المنصة ({((balance.feeRate) * 100).toFixed(0)}%): −${fee.toFixed(2)}
                </div>
                <div className="text-emerald-400">
                  الصافي الذي يصلك: <b>${net.toFixed(2)}</b>
                </div>
              </div>
            )}

            {wError && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {wError}
              </p>
            )}
            {wSuccess && (
              <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                {wSuccess}
              </p>
            )}
          </section>

          {/* سجل السحوبات */}
          {balance.history.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold">🧾 سجل السحوبات</h2>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-right">التاريخ</th>
                      <th className="px-4 py-3 text-right">المبلغ</th>
                      <th className="px-4 py-3 text-right">عمولة المنصة</th>
                      <th className="px-4 py-3 text-right">الصافي</th>
                      <th className="px-4 py-3 text-right">الوسيلة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.history.map((w) => (
                      <tr key={w.id} className="border-t border-white/5">
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(w.createdAt).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          ${Number(w.grossAmount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-red-400">
                          −${Number(w.feeAmount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">
                          ${Number(w.netAmount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{METHOD_LABEL[w.method] ?? w.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* المنتجات */}
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">🛍️ منتجاتي</h2>
              <Link href="/sell" className="text-sm text-amber-400 underline">
                + منتج جديد
              </Link>
            </div>
            {productList.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400">
                لا توجد منتجات منشورة حاليًا.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productList.map((p) => (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-amber-400/40"
                  >
                    <Link href={`/products/view?id=${p.id}`} className="flex items-center gap-4 p-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${p.coverColor} text-2xl`}
                      >
                        {p.coverEmoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold hover:text-amber-300">{p.title}</div>
                        <div className="text-sm text-slate-400">
                          ${Number(p.priceUsd).toFixed(2)} • {p.salesCount} مبيعة
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 border-t border-white/10 p-3">
                      <Link
                        href={`/products/edit?id=${p.id}`}
                        className="rounded-lg border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-sm font-bold text-sky-300 transition hover:bg-sky-500/20"
                      >
                        ✏️ تعديل
                      </Link>
                      <ShareButtons
                        title={p.title}
                        text="منتج رقمي على منصة الخليج"
                        path={`/products/view?id=${p.id}`}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* المبيعات */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">🛒 سجل المبيعات</h2>
            {sales.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400">
                لا توجد مبيعات بعد.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-right">المنتج</th>
                      <th className="px-4 py-3 text-right">المشتري</th>
                      <th className="px-4 py-3 text-right">المبلغ</th>
                      <th className="px-4 py-3 text-right">وسيلة الدفع</th>
                      <th className="px-4 py-3 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id} className="border-t border-white/5">
                        <td className="px-4 py-3">
                          {s.coverEmoji} {s.productTitle}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                          {s.buyerEmail}
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-400">
                          ${Number(s.usdAmount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{METHOD_LABEL[s.method] ?? s.method}</td>
                        <td className="px-4 py-3">
                          {s.status === "paid" ? (
                            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
                              ✅ مدفوع
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs text-yellow-400">
                              ⏳ بانتظار الدفع
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
