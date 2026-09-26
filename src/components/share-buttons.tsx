"use client";

import { useState } from "react";

export default function ShareButtons({
  title,
  text,
  path,
  compact = false,
}: {
  title: string;
  text?: string;
  path: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const origin = configured || (typeof window !== "undefined" ? window.location.origin : "");
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  }

  async function copy() {
    const url = getUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    const url = getUrl();
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text || title, url });
        return;
      } catch {
        return;
      }
    }
    await copy();
  }

  function openShare(platform: "whatsapp" | "telegram" | "facebook" | "x" | "linkedin") {
    const url = getUrl();
    const encodedUrl = encodeURIComponent(url);
    const message = encodeURIComponent(`${title}${text ? ` — ${text}` : ""}`);
    const targets = {
      whatsapp: `https://wa.me/?text=${message}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${message}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${message}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
    window.open(targets[platform], "_blank", "noopener,noreferrer");
  }

  const socialButtons = [
    { key: "whatsapp" as const, label: "WhatsApp", icon: "💬", color: "hover:border-emerald-400/60 hover:text-emerald-300" },
    { key: "telegram" as const, label: "Telegram", icon: "✈️", color: "hover:border-sky-400/60 hover:text-sky-300" },
    { key: "facebook" as const, label: "Facebook", icon: "f", color: "hover:border-blue-400/60 hover:text-blue-300" },
    { key: "x" as const, label: "X", icon: "𝕏", color: "hover:border-slate-300/60 hover:text-white" },
    { key: "linkedin" as const, label: "LinkedIn", icon: "in", color: "hover:border-blue-300/60 hover:text-blue-300" },
  ];

  return (
    <div className={compact ? "" : "rounded-2xl border border-white/10 bg-white/5 p-5"}>
      {!compact && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">🔗 شارك الرابط</h3>
            <p className="mt-1 text-xs text-slate-500">انشره في أي منصة أو أرسله مباشرة لعملائك</p>
          </div>
          <button type="button" onClick={nativeShare} className="rounded-xl bg-gradient-to-l from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-slate-950">
            مشاركة
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {compact && (
          <button type="button" onClick={nativeShare} className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-300">
            ↗ مشاركة
          </button>
        )}
        <button type="button" onClick={copy} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm transition hover:border-amber-400/50">
          {copied ? "✅ تم النسخ" : "📋 نسخ الرابط"}
        </button>
        {!compact &&
          socialButtons.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => openShare(item.key)}
              aria-label={`مشاركة عبر ${item.label}`}
              className={`rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm transition ${item.color}`}
            >
              <span className="font-bold">{item.icon}</span> {item.label}
            </button>
          ))}
      </div>

      {!compact && (
        <div dir="ltr" className="mt-3 truncate rounded-lg bg-slate-950 px-3 py-2 text-left font-mono text-xs text-slate-500">
          {path}
        </div>
      )}
    </div>
  );
}
