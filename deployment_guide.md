# دليل النشر على استضافة هوستنجر (Hostinger)

لضمان عمل الموقع بشكل صحيح بكافة التعديلات الجديدة ومعالجة مشاكل الروابط (SPA Routing)، اتبع الخطوات التالية:

## 1. بناء المشروع محلياً (Build)
بما أن التعديلات تمت في الكود المصدري، يجب إنشاء نسخة "الإنتاج" (Production Build) لتظهر التغييرات:
1. افتح التيرمينال في مجلد `Nexora`.
2. قم بتشغيل الأمر التالي:
   ```bash
   npm run build
   ```
3. سيظهر لك مجلد جديد باسم `dist` يحتوي على كافة الملفات الجاهزة للنشر.

## 2. إعداد توجيه الروابط (.htaccess)
لحل مشكلة الخطأ 404 عند تحديث الصفحة في هوستنجر، قمت بتجهيز ملف `.htaccess` لك.
**محتوى الملف:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
> [!IMPORTANT]
> يجب وضع هذا الملف **داخل مجلد `dist`** قبل رفعه، أو رفعه مباشرة إلى مجلد `public_html` في هوستنجر.

## 3. الرفع إلى الاستضافة
1. ادخل إلى لوحة تحكم هوستنجر (hPanel).
2. افتح **File Manager**.
3. انتقل إلى مجلد **public_html**.
4. قم برفع **محتويات** مجلد `dist` (وليس المجلد نفسه) إلى `public_html`.
5. تأكد من وجود الملفات التالية في المسار الرئيسي للاستضافة:
   - `index.html`
   - مجلد `assets`
   - ملف `.htaccess`

## 4. التحقق من متغيرات البيئة
تأكد من أن ملف `.env` يحتوي على بيانات Supabase الصحيحة قبل تنفيذ عملية الـ `build`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
