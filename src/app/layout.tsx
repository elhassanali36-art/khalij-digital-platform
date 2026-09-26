import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "منصة الخليج للمنتجات الرقمية",
    template: "%s | منصة الخليج",
  },
  description:
    "منصة عربية لبيع المنتجات الرقمية مع قبول PayPal والعملات الرقمية ومشاركة المتاجر والمنتجات بسهولة.",
  openGraph: {
    type: "website",
    locale: "ar_AR",
    siteName: "منصة الخليج للمنتجات الرقمية",
    title: "منصة الخليج للمنتجات الرقمية",
    description: "اكتشف وشارك أفضل المنتجات الرقمية من البائعين العرب.",
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة الخليج للمنتجات الرقمية",
    description: "اكتشف وشارك أفضل المنتجات الرقمية من البائعين العرب.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-bold">
                خ
              </span>
              <span>
                منصة<span className="text-amber-400">الخليج</span>
              </span>
            </Link>
            <nav className="flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 text-sm font-medium sm:gap-2 sm:pb-0">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                المتجر
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                لوحة البائع
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                حساب بائع
              </Link>
              <Link
                href="/sell"
                className="rounded-lg bg-gradient-to-l from-amber-400 to-orange-500 px-4 py-2 font-bold text-slate-950 transition hover:opacity-90"
              >
                + ابدأ البيع
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
          <p>
            منصة الخليج للمنتجات الرقمية — بيع أعمالك الرقمية واستقبل أرباحك مباشرة بـ PayPal والعملات الرقمية
          </p>
        </footer>
      </body>
    </html>
  );
}
