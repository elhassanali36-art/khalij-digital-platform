"use client";

/**
 * Khalij API bridge — routes every frontend call to "/api/..." 
 * to the deployed Base44 unified backend function (khalijApi).
 * Handles auth token + admin key transparently.
 */

const API_URL =
  "https://base44.app/api/apps/6a74dc8dc6a9c9d7bc3ef6d1/functions/khalijApi";

export const TOKEN_KEY = "khalij_token";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function headerValue(headers: unknown, name: string): string {
  if (!headers) return "";
  try {
    if (headers instanceof Headers) return headers.get(name) || "";
    if (Array.isArray(headers)) {
      const row = headers.find(
        (h) => String(h[0]).toLowerCase() === name.toLowerCase()
      );
      return row ? String(row[1]) : "";
    }
    if (typeof headers === "object") {
      const obj = headers as Record<string, string>;
      for (const key of Object.keys(obj)) {
        if (key.toLowerCase() === name.toLowerCase()) return obj[key];
      }
    }
  } catch {}
  return "";
}

if (typeof window !== "undefined" && !(window as any).__khalijBridge) {
  (window as any).__khalijBridge = true;
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = "";
    if (typeof input === "string") url = input;
    else if (input instanceof URL) url = input.toString();
    else if (input && typeof (input as Request).url === "string")
      url = (input as Request).url;

    if (!url.startsWith("/api/")) return origFetch(input as any, init);

    const method = (init?.method || "GET").toUpperCase();
    const u = new URL(url, "https://khalij.local");
    const path = u.pathname;
    const query = u.search ? u.search.slice(1) : "";

    let body: unknown;
    if (init?.body) {
      try {
        if (typeof init.body === "string") body = JSON.parse(init.body);
      } catch {
        body = {};
      }
    }

    let adminKey = "";
    const auth =
      headerValue(init?.headers, "authorization") ||
      headerValue(init?.headers, "x-admin-key");
    if (auth && auth.toLowerCase().startsWith("bearer "))
      adminKey = auth.slice(7);
    else if (auth) adminKey = auth;
    if (!adminKey && headerValue(init?.headers, "x-admin-key"))
      adminKey = headerValue(init?.headers, "x-admin-key");

    const res = await origFetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        query,
        method,
        body: body ?? {},
        token: getToken(),
        adminKey,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (data && typeof data.token === "string") {
      try {
        window.localStorage.setItem(TOKEN_KEY, data.token);
      } catch {}
    }
    if (path === "/api/auth/logout") clearToken();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

/** Download a paid product: gets {url} or {content} from the API and delivers it. */
export async function apiDownload(apiPath: string) {
  try {
    const res = await fetch(apiPath);
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "تعذر تحميل المنتج");
      return;
    }
    if (data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (data.contentBase64) {
      const bin = atob(data.contentBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: data.contentType || "application/octet-stream",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = data.fileName || "khalij-product";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      return;
    }
    if (data.content) {
      const blob = new Blob([data.content], {
        type: data.contentType || "text/plain;charset=utf-8",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = data.fileName || "khalij-product.md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      return;
    }
    alert("لا يوجد ملف متاح لهذا المنتج");
  } catch {
    alert("تعذر تحميل المنتج");
  }
}
