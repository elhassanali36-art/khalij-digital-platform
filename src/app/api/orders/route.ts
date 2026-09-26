import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, sellers } from "@/db/schema";
import { CoinSymbol, getRates, toCryptoAmount } from "@/lib/crypto";

export type PayMethod = CoinSymbol | "PAYPAL";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, buyerEmail, method } = body ?? {};

    if (!productId || !buyerEmail || !method) {
      return NextResponse.json(
        { error: "بيانات الطلب غير مكتملة" },
        { status: 400 }
      );
    }
    const m = String(method).toUpperCase() as PayMethod;
    if (!["BTC", "ETH", "USDT", "PAYPAL"].includes(m)) {
      return NextResponse.json({ error: "وسيلة دفع غير مدعومة" }, { status: 400 });
    }

    const [row] = await db
      .select({ product: products, seller: sellers })
      .from(products)
      .innerJoin(sellers, eq(products.sellerId, sellers.id))
      .where(
        and(
          eq(products.id, Number(productId)),
          eq(sellers.storeStatus, "active")
        )
      );
    if (!row) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }
    const { product, seller } = row;

    const addressMap: Record<PayMethod, string | null> = {
      BTC: seller.walletBtc,
      ETH: seller.walletEth,
      USDT: seller.walletUsdt,
      PAYPAL: seller.paypalEmail,
    };
    const paymentAddress = addressMap[m];
    if (!paymentAddress) {
      return NextResponse.json(
        { error: "البائع لا يستقبل عبر هذه الوسيلة" },
        { status: 400 }
      );
    }

    const usd = Number(product.priceUsd);
    let cryptoAmount: string | null = null;
    if (m !== "PAYPAL") {
      const rates = await getRates();
      cryptoAmount = toCryptoAmount(usd, rates[m]);
    }

    const [order] = await db
      .insert(orders)
      .values({
        sellerId: seller.id,
        productId: product.id,
        buyerEmail: String(buyerEmail).toLowerCase().trim(),
        method: m,
        usdAmount: usd.toFixed(2),
        cryptoAmount,
        paymentAddress,
      })
      .returning();

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
