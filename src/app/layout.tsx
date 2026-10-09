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
    <script
      dangerouslySetInnerHTML={{
        __html: `(function () {
  if (window.__khalijBridge) return;
  window.__khalijBridge = true;
  var API_URL = "https://base44.app/api/apps/6a74dc8dc6a9c9d7bc3ef6d1/functions/khalijApi";
  var TOKEN_KEY = "khalij_token";
  window.khalijGetToken = function () {
    try { return window.localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  };
  function clearToken() {
    try { window.localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }
  function headerValue(headers, name) {
    if (!headers) return "";
    try {
      if (headers instanceof Headers) return headers.get(name) || "";
      if (Array.isArray(headers)) {
        for (var i = 0; i < headers.length; i++) {
          if (String(headers[i][0]).toLowerCase() === name.toLowerCase()) return String(headers[i][1]);
        }
        return "";
      }
      if (typeof headers === "object") {
        for (var k in headers) {
          if (k.toLowerCase() === name.toLowerCase()) return String(headers[k]);
        }
      }
    } catch (e) {}
    return "";
  }
  var origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    var url = "";
    if (typeof input === "string") url = input;
    else if (input && input instanceof URL) url = input.toString();
    else if (input && typeof input.url === "string") url = input.url;
    if (url.indexOf("/api/") !== 0) return origFetch(input, init);
    var method = ((init && init.method) || "GET").toUpperCase();
    var u = new URL(url, "https://khalij.local");
    var path = u.pathname;
    var query = u.search ? u.search.slice(1) : "";
    var body = {};
    if (init && typeof init.body === "string") {
      try { body = JSON.parse(init.body); } catch (e) { body = {}; }
    }
    var adminKey = "";
    var auth = headerValue(init && init.headers, "authorization") || headerValue(init && init.headers, "x-admin-key");
    if (auth && auth.toLowerCase().indexOf("bearer ") === 0) adminKey = auth.slice(7);
    else if (auth) adminKey = auth;
    var res = await origFetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: path,
        query: query,
        method: method,
        body: body,
        token: window.khalijGetToken(),
        adminKey: adminKey,
      }),
    });
    var data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (data && typeof data.token === "string") {
      try { window.localStorage.setItem(TOKEN_KEY, data.token); } catch (e) {}
    }
    if (path === "/api/auth/logout") clearToken();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  };
  window.apiDownload = async function (apiPath) {
    try {
      var res = await window.fetch(apiPath);
      var data = {};
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) { alert((data && data.error) || "تعذر تحميل المنتج"); return; }
      if (data.url) { window.open(data.url, "_blank", "noopener,noreferrer"); return; }
      if (data.contentBase64) {
        var bin = atob(data.contentBase64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var blob = new Blob([bytes], { type: data.contentType || "application/octet-stream" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = data.fileName || "khalij-product";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        return;
      }
      if (data.content) {
        var blob2 = new Blob([data.content], { type: (data.contentType || "text/plain") + ";charset=utf-8" });
        var a2 = document.createElement("a");
        a2.href = URL.createObjectURL(blob2);
        a2.download = data.fileName || "khalij-product.md";
        document.body.appendChild(a2);
        a2.click();
        a2.remove();
        URL.revokeObjectURL(a2.href);
        return;
      }
      alert("لا يوجد ملف متاح لهذا المنتج");
    } catch (e) { alert("تعذر تحميل المنتج"); }
  };
})();`,
      }}
    />
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
