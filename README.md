# powered by nexora — نظام إدارة المخزون والمستودعات

نسخة معدّلة من نظام WMS العربي مع تسجيل دخول حقيقي عبر Backend، بدون تغيير تصميم الواجهات الأساسية.

## ما تم تعديله

- استبدال اسم `ArabicWms` بعبارة `powered by nexora`.
- إضافة زر إظهار/إخفاء كلمة المرور في شاشة تسجيل الدخول.
- إزالة صفحة **تحويل مواقع التخزين** من النظام والقائمة والاختصارات.
- إزالة سكربتات التتبع الخارجية وروابط Google Fonts الخارجية لتقليل أخطاء التحميل.
- تشغيل Frontend وBackend معًا محليًا من خلال `npm run dev`.
- جعل تسجيل الدخول يتم من Backend عبر `/api/auth-login` بدل فحص كلمة المرور داخل المتصفح.
- استخدام جلسة HttpOnly Cookie موقعة من السيرفر.
- حماية Routes الخاصة بالـ API بجلسة وصلاحيات.

## التشغيل الآن على جهازك

```bash
npm install
npm run dev
```

ثم افتح:

```text
http://localhost:5173
```

## بيانات الدخول التجريبية

```text
admin / admin123
warehouse.manager / manager123
storekeeper / store123
data.entry / data123
readonly / read123
```

غيّر كلمات المرور قبل أي استخدام حقيقي مع عميل.

## أوامر الفحص

```bash
npm run build
npm run lint
```

تم تشغيل الأمرين بنجاح على هذه النسخة.

## التشغيل كـ Production محليًا

قبل تشغيل Production، يجب تعيين `AUTH_SECRET`:

```bash
AUTH_SECRET="change-this-to-a-random-64-character-secret" npm run start
```

على Windows PowerShell:

```powershell
$env:AUTH_SECRET="change-this-to-a-random-64-character-secret"
npm run start
```

## النشر

GitHub Pages لا يكفي لهذا المشروع لأنه لا يشغّل Backend API. استخدم Vercel أو Render أو Railway أو VPS.

للنشر على Vercel:

1. ارفع المشروع على GitHub بدون `node_modules` وبدون `.env`.
2. اربطه مع Vercel.
3. أضف Environment Variables:

```text
VITE_USE_BACKEND_API=true
VITE_API_BASE=/api
AUTH_SECRET=RANDOM_SECRET_64_CHARS_OR_MORE
```

اختياريًا، إذا أردت Supabase بدل التخزين المحلي:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

ثم شغّل SQL الموجود في:

```text
database/auth_schema.sql
```

## ملاحظات مهمة

- لا ترفع `.env` إلى GitHub.
- لا ترفع `node_modules` إلى GitHub.
- لا تستخدم GitHub Pages فقط لأن تسجيل الدخول الحقيقي يحتاج Backend.
- عند عدم إعداد Supabase، يستخدم السيرفر ملفات محلية داخل `.data` للتشغيل والتجربة.


## آخر تعديلات مخصصة

- صفحة الأصناف أصبحت تعتمد على: اسم الصنف، التصنيف، الوحدة، الكمية، الحد الأدنى، الحد الأعلى، طريقة التتبع، الحالة، والملاحظات.
- تم حذف رقم الصنف و SKU و Barcode والعلامة التجارية والشركة المصنعة وبلد المنشأ من واجهة الأصناف والتصدير.
- تمت إضافة استيراد الأصناف من Excel/CSV من داخل صفحة الأصناف.
- عند إضافة صنف جديد مع كمية، يتم إنشاء سجل مطابق في المخزون الحالي تلقائيًا.
- تمت إزالة حقل المسؤول من صفحة العملاء.
- تمت إزالة صفحات العلامات التجارية والشركات المصنعة من النظام.
