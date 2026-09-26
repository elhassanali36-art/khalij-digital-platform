"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type StoreRow = {
  id: number;
  name: string;
  email: string;
  avatarEmoji: string;
  status: "active" | "suspended" | "deleted";
  moderationReason: string | null;
  moderatedAt: string | null;
  createdAt: string;
  products: number;
  paidOrders: number;
  revenue: number;
  ratingCount: number;
  averageRating: number;
};

type AdminData = {
  stores: StoreRow[];
  summary: {
    totalStores: number;
    activeStores: number;
    suspendedStores: number;
    deletedStores: number;
    totalRevenue: number;
    totalPaidOrders: number;
    collectedPlatformFees: number;
    withdrawalCount: number;
    currentFeeRate: number;
  };
};

const STATUS = {
  active: { label: "نشط", className: "bg-emerald-500/15 text-emerald-300" },
  suspended: { label: "موقوف", className: "bg-amber-500/15 text-amber-300" },
  deleted: { label: "محذوف", className: "bg-red-500/15 text-red-300" },
};

export default function AdminDashboardPage() {
  const [keyInput, setKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (key: string) => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/stores", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error ?? "تعذر فتح لوحة الأدمن");
      setLoading(false);
      return false;
    }
    setData(payload);
    setAdminKey(key);
    sessionStorage.setItem("khalijAdminKey", key);
    setLoading(false);
    return true;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = sessionStorage.getItem("khalijAdminKey");
      if (saved) void load(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return (data?.stores ?? []).filter((store) => {
      const matchesQuery =
        !normalized ||
        store.name.toLowerCase().includes(normalized) ||
        store.email.toLowerCase().includes(normalized) ||
        String(store.id) === normalized;
      return matchesQuery && (statusFilter === "all" || store.status === statusFilter);
    });
  }, [data, query, statusFilter]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    await load(keyInput);
  }

  async function moderate(store: StoreRow, action: "suspend" | "restore" | "delete") {
    let reason = "";
    if (action !== "restore") {
      reason = window.prompt(
        action === "delete"
          ? `اكتب سبب حذف متجر «${store.name}» من المنصة:`
          : `اكتب سبب إيقاف متجر «${store.name}»:`
      )?.trim() ?? "";
      if (!reason) return;
    }

    const confirmation = window.confirm(
      action === "delete"
        ? "سيختفي المتجر ومنتجاته من الواجهة العامة، بينما تظل تنزيلات المشترين السابقين محفوظة. هل تريد المتابعة؟"
        : action === "suspend"
          ? "سيتم إيقاف المتجر ومنع عمليات شراء جديدة. هل تريد المتابعة؟"
          : "هل تريد إعادة تفعيل المتجر؟"
    );
    if (!confirmation) return;

    setActionId(store.id);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/stores", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify({ sellerId: store.id, action, reason }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error ?? "تعذر تنفيذ الإجراء");
    } else {
      setMessage(`✅ ${payload.message}: ${store.name}`);
      await load(adminKey);
    }
    setActionId(null);
  }

  function logout() {
    sessionStorage.removeItem("khalijAdminKey");
    setAdminKey("");
    setData(null);
    setKeyInput("");
  }

  if (!data) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-16">
        <form onSubmit={login} className="w-full rounded-3xl border border-amber-400/20 bg-white/5 p-8">
          <div className="text-5xl">🛡️</div>
          <h1 className="mt-4 text-3xl font-extrabold">لوحة تحكم الأدمن</h1>
          <p className="mt-2 text-slate-400">أدخل ADMIN_SETUP_KEY لإدارة المتاجر والتقييمات والأرباح.</p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="مفتاح الإدارة السري"
            minLength={16}
            required
            autoComplete="off"
            className="mt-6 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-amber-400"
          />
          {error && <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-red-300">{error}</p>}
          <button disabled={loading} className="mt-4 w-full rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 py-3 font-extrabold text-slate-950 disabled:opacity-50">
            {loading ? "جارٍ التحقق…" : "دخول لوحة الأدمن"}
          </button>
        </form>
      </main>
    );
  }

  const summary = data.summary;
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">ADMIN</span>
          <h1 className="mt-3 text-3xl font-extrabold">🛡️ إدارة منصة الخليج</h1>
          <p className="mt-2 text-slate-400">إدارة المتاجر المخالفة ومتابعة المبيعات والتقييمات والعمولات.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/catalog" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/5">إدارة الكتالوج</Link>
          <button onClick={logout} className="rounded-xl border border-red-400/20 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10">تسجيل الخروج</button>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["إجمالي المتاجر", summary.totalStores, "text-white"],
          ["المتاجر النشطة", summary.activeStores, "text-emerald-300"],
          ["الموقوفة والمحذوفة", summary.suspendedStores + summary.deletedStores, "text-red-300"],
          ["عمولة المنصة", `${(summary.currentFeeRate * 100).toFixed(0)}%`, "text-amber-300"],
          ["إجمالي المبيعات", `$${summary.totalRevenue.toFixed(2)}`, "text-sky-300"],
          ["طلبات مدفوعة", summary.totalPaidOrders, "text-emerald-300"],
          ["عمولات محصلة", `$${summary.collectedPlatformFees.toFixed(2)}`, "text-amber-300"],
          ["عمليات سحب", summary.withdrawalCount, "text-white"],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">{label}</div>
            <div className={`mt-1 text-3xl font-extrabold ${color}`}>{value}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم أو البريد أو رقم المتجر" className="min-w-64 flex-1 rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-amber-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3">
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
            <option value="deleted">محذوف</option>
          </select>
          <button onClick={() => load(adminKey)} className="rounded-xl border border-white/15 px-4 py-3 font-bold hover:bg-white/5">↻ تحديث</button>
        </div>
        {message && <p className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-emerald-300">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-red-300">{error}</p>}
      </section>

      <section className="mt-6 overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-right">المتجر</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">المنتجات</th>
              <th className="px-4 py-3 text-right">المبيعات</th>
              <th className="px-4 py-3 text-right">الإيراد</th>
              <th className="px-4 py-3 text-right">التقييم</th>
              <th className="px-4 py-3 text-right">السبب</th>
              <th className="px-4 py-3 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((store) => (
              <tr key={store.id} className="border-t border-white/5 align-top">
                <td className="px-4 py-4">
                  <Link href={`/sellers/${store.id}`} target="_blank" className="font-bold hover:text-amber-300">{store.avatarEmoji} {store.name}</Link>
                  <div dir="ltr" className="mt-1 text-left font-mono text-xs text-slate-500">{store.email}</div>
                  <div className="mt-1 text-xs text-slate-600">#{store.id} • {new Date(store.createdAt).toLocaleDateString("ar-EG")}</div>
                </td>
                <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS[store.status].className}`}>{STATUS[store.status].label}</span></td>
                <td className="px-4 py-4 font-bold">{store.products}</td>
                <td className="px-4 py-4">{store.paidOrders}</td>
                <td className="px-4 py-4 font-bold text-emerald-300">${store.revenue.toFixed(2)}</td>
                <td className="px-4 py-4"><div className="text-amber-300">★ {store.averageRating.toFixed(1)}</div><div className="text-xs text-slate-500">{store.ratingCount} تقييم</div></td>
                <td className="max-w-56 px-4 py-4 text-xs text-slate-400">{store.moderationReason || "—"}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {store.status !== "active" && <button disabled={actionId === store.id} onClick={() => moderate(store, "restore")} className="rounded-lg bg-emerald-500/15 px-3 py-2 font-bold text-emerald-300 disabled:opacity-50">إعادة تفعيل</button>}
                    {store.status === "active" && <button disabled={actionId === store.id} onClick={() => moderate(store, "suspend")} className="rounded-lg bg-amber-500/15 px-3 py-2 font-bold text-amber-300 disabled:opacity-50">إيقاف</button>}
                    {store.status !== "deleted" && <button disabled={actionId === store.id} onClick={() => moderate(store, "delete")} className="rounded-lg bg-red-500/15 px-3 py-2 font-bold text-red-300 disabled:opacity-50">حذف</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-10 text-center text-slate-500">لا توجد متاجر مطابقة.</p>}
      </section>
    </main>
  );
}
