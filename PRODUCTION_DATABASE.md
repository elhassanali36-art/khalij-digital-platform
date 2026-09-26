# قاعدة بيانات الإنتاج — منصة الخليج

## التشخيص

المشروع يستخدم PostgreSQL عبر `pg` وDrizzle ORM. قاعدة Arena هي PostgreSQL محلية داخل بيئة Arena:

- المضيف: `127.0.0.1`
- قاعدة البيانات: `app_db`
- إعداد Drizzle المحلي: `drizzle.config.json`

Vercel لا يستطيع الوصول إلى قاعدة Arena المحلية ولا ينسخ مخططها أو بياناتها تلقائيًا. في Vercel يقرأ التطبيق اتصال PostgreSQL الخارجي من `DATABASE_URL`. عند استخدام Supabase، يجب أن تكون القيمة URI الخاصة بـTransaction Pooler.

الخطأ `42P01 relation products does not exist` يثبت أن Vercel وصل إلى PostgreSQL بنجاح، لكن القاعدة/المخطط المتصل به لا يحتوي على جدول `public.products`.

## مصدر المخطط

- تعريف Drizzle: `src/db/schema.ts`
- ملف إنشاء/تحديث غير تدميري: `database-setup.sql`
- ملف تحقق للقراءة فقط: `database-verify.sql`
- لا يوجد مجلد migrations منشأ من Drizzle في هذا المشروع.
- Arena يجهز PostgreSQL المحلي فقط؛ لا يشغّل SQL على Vercel أو Supabase.

## ترتيب الإصلاح الآمن

1. ارفع أحدث كود من Arena إلى مستودع GitHub المرتبط بمشروع Vercel.
2. انتظر حتى يصبح Deployment الجديد Ready.
3. في مشروع Supabase الذي يظهر معرّفه داخل قيمة `DATABASE_URL` في Vercel، افتح SQL Editor.
4. شغّل `database-verify.sql` أولًا. هذا فحص قراءة فقط.
5. إذا ظهرت الجداول MISSING، شغّل `database-setup.sql` كاملًا.
6. شغّل `database-verify.sql` مرة أخرى.
7. افتح `https://YOUR-DOMAIN/api/health` وتأكد من:
   - `ok: true`
   - `schema: ready`
   - وجود sellers وproducts في tables
8. افتح الصفحة الرئيسية وتأكد أنها ترجع HTTP 200.

## لماذا database-setup.sql آمن؟

- يستخدم `CREATE TABLE IF NOT EXISTS`.
- يستخدم `ADD COLUMN IF NOT EXISTS`.
- لا يحتوي على `DROP TABLE` أو `TRUNCATE` أو `DELETE`.
- لا يعيد ضبط التسلسلات.
- لا يمسح المنتجات أو البائعين أو الطلبات الحالية.
- يملأ `orders.seller_id` للطلبات القديمة من المنتج المرتبط قبل جعله NOT NULL، لحماية المحاسبة التاريخية.

## متغيرات Vercel

مطلوب لقاعدة البيانات:

- `DATABASE_URL` — إلزامي في Production.

مطلوب لرفع ملفات المنتجات إلى Supabase Storage:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

ميزات الإدارة والمشاركة:

- `ADMIN_SETUP_KEY` — مفتاح سري بطول 16 حرفًا أو أكثر.
- `NEXT_PUBLIC_SITE_URL` — اختياري، رابط الموقع العام.

لا يوجد متغير مستخدم باسم `CRIPTO_URL` أو `CRYPTO_URL`.

## التحقق من أن Vercel وSupabase يستخدمان القاعدة نفسها

- افتح قيمة `DATABASE_URL` في Vercel دون نشرها أو تصويرها.
- تأكد أن project reference في اسم مضيف Supabase يطابق المشروع الذي فتحت فيه SQL Editor.
- تأكد أن اسم قاعدة البيانات في URI هو نفسه المعروض من أول استعلام في `database-verify.sql`.
- بعد التطبيق، يجب أن يعرض `/api/health` الأعداد نفسها الموجودة في القاعدة.

## ملاحظة البيانات المحلية

تطبيق المخطط ينشئ الجداول لكنه لا ينسخ بيانات Arena المحلية تلقائيًا. نقل بيانات Arena إلى الإنتاج عملية منفصلة باستخدام `pg_dump`/`pg_restore` أو تصدير مباشر بين الاتصالين، ويجب تنفيذها دون رفع ملف dump يحتوي بيانات عملاء إلى GitHub. لا تنفذ استيراد بيانات فوق إنتاج يحتوي بيانات قبل أخذ نسخة احتياطية ومقارنة المفاتيح الأساسية.
