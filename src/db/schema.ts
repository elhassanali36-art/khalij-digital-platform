import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ملفات البائعين الشخصية
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // هاش كلمة المرور (scrypt). قد تكون فارغة للحسابات القديمة قبل تفعيل المصادقة
  // حتى يقوم صاحب الحساب بتعيين كلمة مرور عبر /api/auth/claim.
  passwordHash: text("password_hash"),
  bio: text("bio").notNull().default(""),
  avatarEmoji: text("avatar_emoji").notNull().default("👤"),
  avatarColor: text("avatar_color").notNull().default("from-violet-500 to-fuchsia-500"),
  paypalEmail: text("paypal_email"),
  walletBtc: text("wallet_btc"),
  walletEth: text("wallet_eth"),
  walletUsdt: text("wallet_usdt"),
  // روابط المتجر والحسابات الاجتماعية العامة للبائع.
  websiteUrl: text("website_url"),
  whatsappUrl: text("whatsapp_url"),
  telegramUrl: text("telegram_url"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  xUrl: text("x_url"),
  tiktokUrl: text("tiktok_url"),
  youtubeUrl: text("youtube_url"),
  linkedinUrl: text("linkedin_url"),
  snapchatUrl: text("snapchat_url"),
  otherSocialLabel: text("other_social_label"),
  otherSocialUrl: text("other_social_url"),
  // active | suspended | deleted. الحذف إداري وآمن ويحفظ الطلبات القديمة.
  storeStatus: text("store_status").notNull().default("active"),
  moderationReason: text("moderation_reason"),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  // مفتاح المنتجات الأصلية المضافة من كتالوج المنصة، ويمنع التكرار.
  catalogKey: text("catalog_key").unique(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => sellers.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("أخرى"),
  priceUsd: numeric("price_usd", { precision: 12, scale: 2 }).notNull(),
  coverEmoji: text("cover_emoji").notNull().default("📦"),
  coverColor: text("cover_color").notNull().default("from-violet-500 to-fuchsia-500"),
  // يمكن للبائع إما رفع ملف خاص إلى Supabase Storage أو إدخال رابط خارجي.
  downloadUrl: text("download_url"),
  storagePath: text("storage_path"),
  originalFileName: text("original_file_name"),
  fileSize: integer("file_size"),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  // يُحفظ البائع وقت الشراء حتى لا تنتقل الأرباح القديمة عند نقل المنتج.
  sellerId: integer("seller_id")
    .notNull()
    .references(() => sellers.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  buyerEmail: text("buyer_email").notNull(),
  // BTC | ETH | USDT | PAYPAL
  method: text("method").notNull(),
  usdAmount: numeric("usd_amount", { precision: 12, scale: 2 }).notNull(),
  cryptoAmount: numeric("crypto_amount", { precision: 20, scale: 8 }),
  paymentAddress: text("payment_address").notNull(),
  // pending | pending_verification | paid | rejected
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  // بيانات التحقق من الدفع (لا تُعتمد الحالة "paid" إلا بعد تحقق مستقل)
  verifiedNetwork: text("verified_network"),
  verifiedAsset: text("verified_asset"),
  verifiedAmount: numeric("verified_amount", { precision: 20, scale: 8 }),
  verifiedAddress: text("verified_address"),
  verificationStatus: text("verification_status").notNull().default("unverified"), // unverified | verified | failed
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

// تقييم موثق: كل طلب مدفوع يتيح تقييمًا واحدًا لمتجر البائع.
export const storeRatings = pgTable("store_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => sellers.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  buyerName: text("buyer_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// طلبات سحب الأرباح — عمولة المنصة 5%
export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => sellers.id),
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull(), // PAYPAL | BTC | ETH | USDT
  destination: text("destination").notNull(),
  // pending -> approved -> processing -> completed ، أو pending -> rejected
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedAt: timestamp("reviewed_at"),
  completedAt: timestamp("completed_at"),
  payoutReference: text("payout_reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const PLATFORM_FEE_RATE = 0.05;

export type Seller = typeof sellers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type StoreRating = typeof storeRatings.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
