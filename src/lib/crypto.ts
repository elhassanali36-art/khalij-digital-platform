export type CoinSymbol = "BTC" | "ETH" | "USDT";

export const COINS: Record<
  CoinSymbol,
  { name: string; nameAr: string; icon: string; color: string; network: string }
> = {
  BTC: {
    name: "Bitcoin",
    nameAr: "بيتكوين",
    icon: "₿",
    color: "text-orange-500",
    network: "شبكة البيتكوين",
  },
  ETH: {
    name: "Ethereum",
    nameAr: "إيثيريوم",
    icon: "Ξ",
    color: "text-indigo-500",
    network: "شبكة الإيثيريوم (ERC-20)",
  },
  USDT: {
    name: "Tether",
    nameAr: "تيثر",
    icon: "₮",
    color: "text-emerald-500",
    network: "TRC-20 / ERC-20",
  },
};

// أسعار احتياطية في حال تعذر جلب الأسعار الحية
const FALLBACK_RATES: Record<CoinSymbol, number> = {
  BTC: 97000,
  ETH: 3400,
  USDT: 1,
};

export async function getRates(): Promise<Record<CoinSymbol, number>> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd",
      { signal: controller.signal, next: { revalidate: 120 } }
    );
    clearTimeout(timer);
    if (!res.ok) return FALLBACK_RATES;
    const data = (await res.json()) as {
      bitcoin?: { usd?: number };
      ethereum?: { usd?: number };
      tether?: { usd?: number };
    };
    return {
      BTC: data.bitcoin?.usd ?? FALLBACK_RATES.BTC,
      ETH: data.ethereum?.usd ?? FALLBACK_RATES.ETH,
      USDT: data.tether?.usd ?? FALLBACK_RATES.USDT,
    };
  } catch {
    return FALLBACK_RATES;
  }
}

export function toCryptoAmount(usd: number, rate: number): string {
  return (usd / rate).toFixed(8);
}
