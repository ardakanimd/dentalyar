# دنتال‌یار (DentalYar) — سامانه بررسی تخصصی گرافی و ارجاع دندانپزشکی

- **آدرس وب‌سایت (Live App)**: [https://dentalyar.web.app](https://dentalyar.web.app)
- **پروژه فایربیس (Firebase Project)**: `mahdasht-dental-arvin` (Hosting site: `dentalyar`)
- **پوشش مناطق**: ماهدشت، کرج و پردیس

---

## نحوه ویرایش اپلیکیشن با هوش مصنوعی Gemini (راهنمای شریک تجاری)

این پروژه به گونه‌ای تنظیم شده است که بتوانید به راحتی با **Gemini** (نسخه وب، Firebase Studio یا Antigravity) هر تغییری در متن‌ها، شماره‌ها یا ظاهر برنامه بدهید:

### روش اول: استفاده از Google Firebase Studio (بدون نیاز به نصب هیچ برنامه‌ای)
1. وارد آدرس [https://studio.firebase.google.com](https://studio.firebase.google.com) شوید و با جیمیل خود لاگین کنید.
2. گزینه **Import a Git Repo** را بزنید و لینک این مخزن گیت‌هاب (`https://github.com/ardakanimd/dentalyar`) را وارد کنید.
3. در پنل چت **Gemini** داخل محیط کار، هر تغییری که می‌خواهید به فارسی یا انگلیسی بنویسید (مثلاً: *«شماره واتساپ را تغییر بده»* یا *«یک کلینیک جدید اضافه کن»*).
4. برای انتشار تغییرات روی سایت اصلی، در ترمینال دستور زیر را اجرا کنید:
   ```bash
   npm run build && firebase deploy --only hosting
   ```

### روش دوم: استفاده مستقیم از Gemini Web (`gemini.google.com`) + GitHub
1. فایل مورد نظر (مثلاً `src/components/PatientPortal.tsx` یا `src/utils/persian.ts`) را باز کنید.
2. به Gemini بگویید چه تغییری در کد ایجاد کند و تغییرات را در شاخه `main` گیت‌هاب **Commit** کنید.

---

## ساختار فایل‌های اصلی پروژه
- `src/utils/persian.ts` — تنظیمات شماره واتساپ هماهنگ‌کننده (`+98 901 417 7110`)، شهرها و قالب پیام‌های آماده بله و واتساپ
- `src/components/PatientPortal.tsx` — صفحه اصلی بیماران، فرم ارسال گرافی (OPG) و پیگیری پرونده
- `src/components/AdminDashboard.tsx` — پنل ارزیاب، لایت‌باکس بررسی گرافی، مدیریت دندانپزشکان همکار و کمیسیون‌ها
- `src/App.tsx` — هدر اصلی، قفل امنیتی پنل ارزیاب و نصب اپلیکیشن روی موبایل (PWA)
