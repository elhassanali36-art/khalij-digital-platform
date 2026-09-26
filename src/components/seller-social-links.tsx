import { SOCIAL_FIELDS } from "@/lib/social";
import type { SellerSocialLinks as SellerSocialLinksData } from "@/lib/social";

type DisplayLink = {
  label: string;
  icon: string;
  href: string;
};

export default function SellerSocialLinks({ links }: { links: SellerSocialLinksData }) {
  const available: DisplayLink[] = SOCIAL_FIELDS.flatMap((field) => {
    const href = links[field.key];
    return href ? [{ label: field.label, icon: field.icon, href }] : [];
  });

  if (links.otherSocialUrl) {
    available.push({
      label: links.otherSocialLabel?.trim() || "رابط إضافي",
      icon: "🔗",
      href: links.otherSocialUrl,
    });
  }

  if (available.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="mb-2 text-sm font-semibold text-slate-300">
        تابع المتجر وتواصل مع البائع
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((item, index) => (
          <a
            key={`${item.label}-${index}`}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            <span className="font-bold">{item.icon}</span> {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
