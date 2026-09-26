CREATE TABLE IF NOT EXISTS "sellers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "bio" text DEFAULT '' NOT NULL,
  "avatar_emoji" text DEFAULT '👤' NOT NULL,
  "avatar_color" text DEFAULT 'from-violet-500 to-fuchsia-500' NOT NULL,
  "paypal_email" text,
  "wallet_btc" text,
  "wallet_eth" text,
  "wallet_usdt" text,
  "website_url" text,
  "whatsapp_url" text,
  "telegram_url" text,
  "instagram_url" text,
  "facebook_url" text,
  "x_url" text,
  "tiktok_url" text,
  "youtube_url" text,
  "linkedin_url" text,
  "snapchat_url" text,
  "other_social_label" text,
  "other_social_url" text,
  "store_status" text DEFAULT 'active' NOT NULL,
  "moderation_reason" text,
  "moderated_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- تحديث ملفات البائعين المنشأة سابقًا دون حذف أي بيانات.
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "website_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "whatsapp_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "telegram_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "instagram_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "facebook_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "x_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "tiktok_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "youtube_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "linkedin_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "snapchat_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "other_social_label" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "other_social_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "store_status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "moderation_reason" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "moderated_at" timestamp;

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "catalog_key" text UNIQUE,
  "seller_id" integer NOT NULL REFERENCES "sellers"("id"),
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" text DEFAULT 'أخرى' NOT NULL,
  "price_usd" numeric(12,2) NOT NULL,
  "cover_emoji" text DEFAULT '📦' NOT NULL,
  "cover_color" text DEFAULT 'from-violet-500 to-fuchsia-500' NOT NULL,
  "download_url" text,
  "storage_path" text,
  "original_file_name" text,
  "file_size" integer,
  "sales_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- هذه الأوامر تحدّث قاعدة بيانات منشأة سابقًا دون حذف المنتجات الحالية.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "catalog_key" text;
CREATE UNIQUE INDEX IF NOT EXISTS "products_catalog_key_unique" ON "products" ("catalog_key") WHERE "catalog_key" IS NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "storage_path" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "original_file_name" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "file_size" integer;
ALTER TABLE "products" ALTER COLUMN "download_url" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "seller_id" integer NOT NULL REFERENCES "sellers"("id"),
  "product_id" integer NOT NULL REFERENCES "products"("id"),
  "buyer_email" text NOT NULL,
  "method" text NOT NULL,
  "usd_amount" numeric(12,2) NOT NULL,
  "crypto_amount" numeric(20,8),
  "payment_address" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "tx_hash" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "paid_at" timestamp
);

-- تثبيت مالك الطلب تاريخيًا في قواعد البيانات المنشأة سابقًا.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "seller_id" integer;
UPDATE "orders" AS o
SET "seller_id" = p."seller_id"
FROM "products" AS p
WHERE o."product_id" = p."id" AND o."seller_id" IS NULL;
ALTER TABLE "orders" ALTER COLUMN "seller_id" SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_seller_id_sellers_id_fk"
    FOREIGN KEY ("seller_id") REFERENCES "sellers"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "orders_seller_id_idx" ON "orders" ("seller_id");

CREATE TABLE IF NOT EXISTS "store_ratings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL UNIQUE REFERENCES "orders"("id"),
  "seller_id" integer NOT NULL REFERENCES "sellers"("id"),
  "rating" integer NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "review" text,
  "buyer_name" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "seller_id" integer NOT NULL REFERENCES "sellers"("id"),
  "gross_amount" numeric(12,2) NOT NULL,
  "fee_amount" numeric(12,2) NOT NULL,
  "net_amount" numeric(12,2) NOT NULL,
  "method" text NOT NULL,
  "destination" text NOT NULL,
  "status" text DEFAULT 'completed' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "products_seller_id_idx" ON "products" ("seller_id");
CREATE INDEX IF NOT EXISTS "orders_product_id_idx" ON "orders" ("product_id");
CREATE INDEX IF NOT EXISTS "withdrawals_seller_id_idx" ON "withdrawals" ("seller_id");
CREATE INDEX IF NOT EXISTS "store_ratings_seller_id_idx" ON "store_ratings" ("seller_id");
