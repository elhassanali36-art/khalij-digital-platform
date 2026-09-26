"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16">
      <div className="w-full rounded-3xl border border-red-400/20 bg-red-500/5 p-8 text-center">
        <div className="text-5xl">⚠️</div>
        <h1 className="mt-4 text-2xl font-extrabold">تعذر تحميل هذه الصفحة</h1>
        <p className="mt-3 text-slate-400">
          حدث خطأ في الخادم. إذا كنت صاحب الموقع، افحص اتصال قاعدة البيانات من زر
          التشخيص أدناه.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 px-5 py-3 font-bold text-slate-950"
          >
            إعادة المحاولة
          </button>
          <a
            href="/api/health"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 px-5 py-3 font-bold text-slate-200"
          >
            تشخيص قاعدة البيانات
          </a>
          <Link href="/" className="rounded-xl border border-white/15 px-5 py-3 text-slate-300">
            الصفحة الرئيسية
          </Link>
        </div>
        {error.digest && <p className="mt-5 font-mono text-xs text-slate-600">Error ID: {error.digest}</p>}
      </div>
    </main>
  );
}
