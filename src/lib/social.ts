export const SOCIAL_FIELDS = [
  { key: "websiteUrl", label: "الموقع الشخصي", icon: "🌐", placeholder: "https://example.com" },
  { key: "whatsappUrl", label: "WhatsApp", icon: "💬", placeholder: "https://wa.me/201000000000" },
  { key: "telegramUrl", label: "Telegram", icon: "✈️", placeholder: "https://t.me/username" },
  { key: "instagramUrl", label: "Instagram", icon: "📸", placeholder: "https://instagram.com/username" },
  { key: "facebookUrl", label: "Facebook", icon: "f", placeholder: "https://facebook.com/username" },
  { key: "xUrl", label: "X / Twitter", icon: "𝕏", placeholder: "https://x.com/username" },
  { key: "tiktokUrl", label: "TikTok", icon: "♪", placeholder: "https://tiktok.com/@username" },
  { key: "youtubeUrl", label: "YouTube", icon: "▶", placeholder: "https://youtube.com/@channel" },
  { key: "linkedinUrl", label: "LinkedIn", icon: "in", placeholder: "https://linkedin.com/in/username" },
  { key: "snapchatUrl", label: "Snapchat", icon: "👻", placeholder: "https://snapchat.com/add/username" },
] as const;

export type SocialFieldKey = (typeof SOCIAL_FIELDS)[number]["key"];

export type SellerSocialLinks = Partial<Record<SocialFieldKey, string | null>> & {
  otherSocialLabel?: string | null;
  otherSocialUrl?: string | null;
};

export function normalizeOptionalUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
