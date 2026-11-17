import { CityRegion, PartnerClinic, PatientSubmission, PreferredMessenger, UrgencyLevel } from '../types';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function formatToman(amount: number | undefined | null): string {
  if (!amount || isNaN(amount)) return '۰ تومان';
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${toPersianDigits(formatted)} تومان`;
}

export function formatShamsiDate(isoDate: string | undefined): string {
  if (!isoDate) return '—';
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return toPersianDigits(isoDate);
  }
}

export function normalizeIranPhone(raw: string): string {
  const clean = toEnglishDigits(raw).replace(/[^0-9+]/g, '');
  if (clean.startsWith('+98')) return '0' + clean.slice(3);
  if (clean.startsWith('0098')) return '0' + clean.slice(4);
  if (clean.startsWith('98') && clean.length === 12) return '0' + clean.slice(2);
  if (clean.startsWith('9') && clean.length === 10) return '0' + clean;
  return clean;
}

export function isValidIranMobile(raw: string): boolean {
  const normalized = normalizeIranPhone(raw);
  return /^09\d{9}$/.test(normalized);
}

export function toInternationalIranPhone(raw: string): string {
  const normalized = normalizeIranPhone(raw);
  if (normalized.startsWith('0')) {
    return '98' + normalized.slice(1);
  }
  return normalized;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const intl = toInternationalIranPhone(phone);
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export function buildBaleLink(baleIdOrPhone: string): string {
  const clean = toEnglishDigits(baleIdOrPhone).trim().replace(/^@/, '');
  if (/^\d+$/.test(clean)) {
    return `https://ble.ir/${normalizeIranPhone(clean)}`;
  }
  return `https://ble.ir/${clean}`;
}

export const CITY_LABELS: Record<CityRegion, string> = {
  mahdasht: 'ماهدشت',
  karaj: 'کرج',
  pardis: 'پردیس',
};

export const CITY_NEIGHBORHOODS: Record<CityRegion, string[]> = {
  mahdasht: [
    'بلوار امام خمینی (مرکز ماهدشت)',
    'میدان نماز و خیابان بهشتی',
    'شهرک پیام و راشته',
    'خیابان سرداران و بی‌بی سکینه',
    'صفادشت و محمدشهر (حومه ماهدشت)',
  ],
  karaj: [
    'چهارراه طالقانی و مرکز شهر کرج',
    'عظیمیه و جهانشهر',
    'گوهردشت (رجایی‌شهر) و باغستان',
    'مهرشهر و گلشهر',
    'فردیس و مشکین‌دشت',
  ],
  pardis: [
    'فاز ۱ و میدان عدالت پردیس',
    'فاز ۲ و بلوار ملاصدرا',
    'فاز ۳ و خیابان معلم',
    'فاز ۴، ۵ و ۸ پردیس',
    'بومهن و رودهن (حومه پردیس)',
  ],
};

export const MESSENGER_LABELS: Record<PreferredMessenger, string> = {
  bale: 'پیام‌رسان بله (Bale)',
  whatsapp: 'واتساپ (WhatsApp)',
  phone: 'تماس تلفنی مستقیم',
};

export const URGENCY_LABELS: Record<UrgencyLevel, { label: string; badgeClass: string }> = {
  emergency: {
    label: 'اورژانسی (نیاز به اقدام فوری ۲۴ ساعته)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  high: {
    label: 'اولویت بالا (مراجعه در کمتر از یک هفته)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  normal: {
    label: 'طرح درمان جامع / غیراورژانسی',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
};

export const COORDINATOR_WHATSAPP_NUMBER = '09014177110';
export const COORDINATOR_WHATSAPP_INTL = '+98 901 417 7110';
export const COORDINATOR_BALE_ID = '09014177110';

export const DENTAL_COMPLAINT_OPTIONS = [
  'عصب‌کشی و درد دندان',
  'ایمپلنت و کاشت دندان',
  'جراحی دندان عقل',
  'روکش و پروتز',
  'لمینت و زیبایی',
  'بررسی کلی گرافی (OPG)',
];

export const JAW_REGIONS = [
  'فک بالا - سمت راست',
  'فک بالا - سمت چپ',
  'فک بالا - دندان‌های جلو',
  'فک پایین - سمت راست',
  'فک پایین - سمت چپ',
  'فک پایین - دندان‌های جلو',
  'هر دو فک (نیاز به بررسی کلی گرافی OPG)',
];

export const COMMON_TEETH_LABELS = [
  '۱ بالا راست (جلو)',
  '۲ بالا راست',
  '۳ بالا راست (نیش)',
  '۴ بالا راست',
  '۵ بالا راست',
  '۶ بالا راست (آسیاب اول)',
  '۷ بالا راست (آسیاب دوم)',
  '۸ بالا راست (عقل)',
  '۱ بالا چپ (جلو)',
  '۲ بالا چپ',
  '۳ بالا چپ (نیش)',
  '۴ بالا چپ',
  '۵ بالا چپ',
  '۶ بالا چپ (آسیاب اول)',
  '۷ بالا چپ (آسیاب دوم)',
  '۸ بالا چپ (عقل)',
  '۶ پایین راست (آسیاب اول)',
  '۷ پایین راست (آسیاب دوم)',
  '۸ پایین راست (عقل)',
  '۴ و ۵ پایین راست',
  '۶ پایین چپ (آسیاب اول)',
  '۷ پایین چپ (آسیاب دوم)',
  '۸ پایین چپ (عقل)',
  '۴ و ۵ پایین چپ',
];

/**
 * Compresses an uploaded dental photo or OPG radiograph using HTML5 canvas
 * so it uploads rapidly on Iranian mobile networks and fits inside Firestore.
 */
export async function compressDentalImageFile(
  file: File,
  maxWidth = 1280,
  quality = 0.76
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(ev.target?.result as string);
          return;
        }
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        // Ensure each image stays under ~220KB for smooth multi-image Firestore storage
        if (dataUrl.length > 230000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.58);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('خطا در خواندن تصویر'));
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject(new Error('خطا در بارگذاری فایل'));
    reader.readAsDataURL(file);
  });
}

/**
 * Builds ready-to-send Persian messages for Bale and WhatsApp
 */
export function buildPatientReferralMessage(
  sub: PatientSubmission,
  clinic?: PartnerClinic
): string {
  const assessment = sub.assessment;
  const ref = sub.referral;
  const clinicName = ref?.clinicName || clinic?.name || 'کلینیک دندانپزشکی منتخب';
  const doctorName = ref?.doctorName || clinic?.doctorName || '';
  const clinicAddress = ref?.clinicAddress || clinic?.address || '';
  const clinicPhone = ref?.clinicPhone || clinic?.phone || '';
  const voucher = ref?.voucherCode || sub.trackingCode;

  return `سلام و وقت بخیر ${sub.fullName} عزیز 🌷
پرونده و تصاویر ارسالی شما در «سامانه تخصصی بررسی و ارجاع دندانپزشکی دنتال‌یار (${CITY_LABELS[sub.city]})» به دقت بررسی شد.

📋 *نتیجه بررسی تخصصی گرافی و تصاویر شما:*
• *دندان‌های درگیر:* ${assessment?.affectedTeeth?.join('، ') || 'طبق بررسی گرافی'}
• *یافته‌های بالینی:* ${assessment?.radiographicFindings || 'بررسی کامل انجام شد.'}
• *طرح درمان پیشنهادی:* ${assessment?.recommendedTreatment || 'معاینه و درمان تخصصی'}
• *توضیحات مشاور:* ${assessment?.patientSummaryNote || 'لطفاً جهت جلوگیری از پیشرفت آسیب، در اسرع وقت مراجعه فرمایید.'}
${
  assessment?.estimatedCostMinToman
    ? `• *برآورد حدودی هزینه:* ${formatToman(assessment.estimatedCostMinToman)} تا ${formatToman(assessment.estimatedCostMaxToman)}\n`
    : ''
}
🏥 *معرفی‌نامه رسمی به دندانپزشک معتمد و منتخب منطقه ${CITY_LABELS[sub.city]}:*
• *مرکز درمانی:* ${clinicName} (${doctorName})
• *آدرس:* ${clinicAddress}
• *تلفن هماهنگی:* ${toPersianDigits(clinicPhone)}
• *کد ویژه معرفی‌نامه شما:* \`${voucher}\`

✅ *توجه:* خدمات بررسی و صدور این معرفی‌نامه برای شما کاملاً رایگان بوده است. هنگام مراجعه یا تماس با کلینیک، کد معرفی‌نامه *${voucher}* را اعلام فرمایید تا در اولویت نوبت‌دهی و تعرفه مصوب قرار بگیرید.`;
}

export function buildClinicHandoffMessage(sub: PatientSubmission): string {
  const assessment = sub.assessment;
  const ref = sub.referral;
  return `سلام و عرض ادب خدمت همکار گرامی در «${ref?.clinicName || 'کلینیک منتخب'}» 🦷
بیمار زیر پس از بررسی اولیه گرافی و تریاژ تخصصی از طرف سامانه ارجاع دندانپزشکی (${CITY_LABELS[sub.city]}) خدمت شما معرفی می‌گردد:

👤 *مشخصات بیمار:*
• *نام بیمار:* ${sub.fullName}
• *شماره تماس:* ${toPersianDigits(sub.phone)}
• *کد معرفی‌نامه:* \`${ref?.voucherCode || sub.trackingCode}\`
• *اولویت مراجعه:* ${assessment ? URGENCY_LABELS[assessment.urgency].label : 'عادی'}

🔬 *یافته‌های بررسی گرافی (OPG / تصاویر):*
• *دندان‌های نیازمند درمان:* ${assessment?.affectedTeeth?.join('، ') || 'مشخص شده در پرونده'}
• *تشخیص اولیه:* ${assessment?.radiographicFindings || sub.patientDescription}
• *درمان مورد نیاز:* ${assessment?.recommendedTreatment || sub.chiefComplaintCategories.join('، ')}
${assessment?.clinicPrivateNote ? `• *یادداشت اختصاصی برای دندانپزشک:* ${assessment.clinicPrivateNote}\n` : ''}
🙏 لطفاً پس از پذیرش بیمار و شروع درمان، کد معرفی‌نامه *${ref?.voucherCode || sub.trackingCode}* را جهت ثبت در لیست هماهنگی تایید فرمایید.`;
}

/**
 * Generates realistic SVG data URLs for sample OPG panoramic radiographs and periapical X-rays
 * so the reviewer workstation can immediately demonstrate zoom, pan, brightness, contrast, and invert.
 */
export function createSyntheticRadiographSvg(variant: 'opg_mahdasht' | 'periapical_karaj' | 'opg_pardis'): string {
  if (variant === 'opg_mahdasht') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 520" width="1000" height="520">
      <defs>
        <radialGradient id="xrayBg" cx="50%" cy="48%" r="60%">
          <stop offset="0%" stop-color="#262b33"/>
          <stop offset="65%" stop-color="#111418"/>
          <stop offset="100%" stop-color="#050608"/>
        </radialGradient>
        <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="1000" height="520" fill="url(#xrayBg)"/>
      <!-- Grid & X-Ray markers -->
      <text x="35" y="45" fill="#94a3b8" font-family="monospace" font-size="22" font-weight="bold">R</text>
      <text x="945" y="45" fill="#94a3b8" font-family="monospace" font-size="22" font-weight="bold">L</text>
      <text x="40" y="495" fill="#64748b" font-family="sans-serif" font-size="13">PANORAMIC OPG - MAHDASHT DIGITAL RADIOLOGY CENTER - KV:74 mA:10</text>
      <!-- Mandible & Maxilla Arch Shadow -->
      <path d="M 130 160 Q 170 390 500 410 Q 830 390 870 160" fill="none" stroke="#475569" stroke-width="58" stroke-linecap="round" opacity="0.35"/>
      <path d="M 185 180 Q 500 245 815 180" fill="none" stroke="#64748b" stroke-width="45" stroke-linecap="round" opacity="0.32"/>
      <!-- Sinus cavities -->
      <ellipse cx="350" cy="135" rx="85" ry="42" fill="#090b0e" stroke="#475569" stroke-width="2" opacity="0.65"/>
      <ellipse cx="650" cy="135" rx="85" ry="42" fill="#090b0e" stroke="#475569" stroke-width="2" opacity="0.65"/>
      <!-- Upper Teeth Row (16 teeth) -->
      <g filter="url(#glow)">
        ${Array.from({ length: 14 }).map((_, i) => {
          const x = 235 + i * 39;
          const archY = 195 + Math.sin((i / 13) * Math.PI) * 26;
          const isRootCanalTreated = i === 2 || i === 11;
          return `
            <g transform="translate(${x}, ${archY})">
              <!-- Roots -->
              <path d="M -8 0 L -5 -48 L 0 -15 L 5 -48 L 8 0 Z" fill="${isRootCanalTreated ? '#f8fafc' : '#cbd5e1'}" opacity="0.82"/>
              <!-- Crown -->
              <rect x="-13" y="-4" width="26" height="28" rx="7" fill="#e2e8f0" opacity="0.92"/>
              ${isRootCanalTreated ? `<rect x="-9" y="0" width="18" height="14" rx="3" fill="#ffffff"/>` : ''}
            </g>
          `;
        }).join('')}
      </g>
      <!-- Lower Teeth Row with Deep Caries + Periapical Lesion on Lower Right 6 & Impacted Wisdom 8 -->
      <g filter="url(#glow)">
        ${Array.from({ length: 14 }).map((_, i) => {
          const x = 235 + i * 39;
          const archY = 278 + Math.sin((i / 13) * Math.PI) * 28;
          const isLesionTooth = i === 1; // Lower Right 6
          const isMissingTooth = i === 12; // Lower Left 6 missing (Implant candidate)
          if (isMissingTooth) {
            return `
              <g transform="translate(${x}, ${archY})">
                <circle cx="0" cy="35" r="18" fill="#0f172a" stroke="#38bdf8" stroke-dasharray="4 3" stroke-width="1.5" opacity="0.8"/>
              </g>
            `;
          }
          return `
            <g transform="translate(${x}, ${archY})">
              ${isLesionTooth ? `<circle cx="-6" cy="65" r="16" fill="#050507" stroke="#f43f5e" stroke-width="1.8" opacity="0.95"/>` : ''}
              <!-- Roots -->
              <path d="M -9 18 L -6 64 L 0 28 L 6 64 L 9 18 Z" fill="#cbd5e1" opacity="0.85"/>
              <!-- Crown -->
              <rect x="-13" y="-4" width="26" height="26" rx="7" fill="#e2e8f0" opacity="0.92"/>
              ${isLesionTooth ? `<circle cx="4" cy="4" r="9" fill="#111827"/>` : ''}
            </g>
          `;
        }).join('')}
        <!-- Impacted Horizontal Wisdom Tooth Lower Left 8 -->
        <g transform="translate(190, 290) rotate(58)">
          <rect x="-13" y="-8" width="26" height="24" rx="6" fill="#f1f5f9"/>
          <path d="M -8 16 L -4 52 L 4 52 L 8 16 Z" fill="#cbd5e1"/>
        </g>
      </g>
      <!-- Subtle Diagnostic Annotation Markers -->
      <circle cx="274" cy="340" r="24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="5 4"/>
      <circle cx="703" cy="315" r="24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5 4"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (variant === 'periapical_karaj') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
      <rect width="600" height="500" fill="#0d1015"/>
      <text x="25" y="38" fill="#94a3b8" font-family="monospace" font-size="16">PERIAPICAL DIGITAL X-RAY - TOOTH #36 &amp; #37</text>
      <!-- Alveolar bone trabeculae -->
      <rect x="60" y="210" width="480" height="230" rx="22" fill="#334155" opacity="0.38"/>
      <!-- Tooth 35 -->
      <g transform="translate(145, 165)">
        <path d="M -16 35 L -8 185 L 8 185 L 16 35 Z" fill="#cbd5e1" opacity="0.88"/>
        <rect x="-32" y="-35" width="64" height="75" rx="18" fill="#f1f5f9"/>
      </g>
      <!-- Tooth 36 with Periapical Radiolucency & Deep Occlusal Decay -->
      <g transform="translate(300, 165)">
        <circle cx="-26" cy="195" r="28" fill="#06080b" stroke="#f43f5e" stroke-width="2" stroke-dasharray="5 3"/>
        <circle cx="26" cy="192" r="22" fill="#06080b"/>
        <path d="M -36 35 L -28 195 L -8 70 L 8 70 L 28 190 L 36 35 Z" fill="#cbd5e1" opacity="0.9"/>
        <rect x="-48" y="-38" width="96" height="78" rx="20" fill="#f8fafc"/>
        <!-- Deep caries reaching pulp -->
        <path d="M -25 -38 Q 0 18 22 -38 Z" fill="#0f172a"/>
        <path d="M -12 5 L -22 175 M 12 5 L 22 175" stroke="#1e293b" stroke-width="4"/>
      </g>
      <!-- Tooth 37 with Previous Crown -->
      <g transform="translate(455, 165)">
        <path d="M -32 35 L -22 180 L 0 65 L 22 180 L 32 35 Z" fill="#cbd5e1" opacity="0.88"/>
        <path d="M -20 40 L -18 170 M 20 40 L 18 170" stroke="#ffffff" stroke-width="5"/>
        <rect x="-45" y="-36" width="90" height="75" rx="16" fill="#ffffff"/>
      </g>
      <text x="25" y="475" fill="#fbbf24" font-family="sans-serif" font-size="14">Periapical Lesion Visible at Mesial &amp; Distal Apex of #36</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // opg_pardis
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 520" width="1000" height="520">
    <rect width="1000" height="520" fill="#0f1319"/>
    <text x="35" y="45" fill="#94a3b8" font-family="monospace" font-size="22" font-weight="bold">R</text>
    <text x="945" y="45" fill="#94a3b8" font-family="monospace" font-size="22" font-weight="bold">L</text>
    <text x="40" y="495" fill="#64748b" font-family="sans-serif" font-size="13">PARDIS DIAGNOSTIC IMAGING - IMPLANT &amp; PROSTHODONTICS EVALUATION</text>
    <path d="M 140 165 Q 175 385 500 405 Q 825 385 860 165" fill="none" stroke="#475569" stroke-width="54" stroke-linecap="round" opacity="0.36"/>
    <!-- Existing Titanium Implants on Upper Right -->
    <g transform="translate(310, 145)">
      <rect x="-7" y="0" width="14" height="44" rx="3" fill="#ffffff"/>
      <line x1="-9" y1="8" x2="9" y2="8" stroke="#94a3b8" stroke-width="2"/>
      <line x1="-9" y1="16" x2="9" y2="16" stroke="#94a3b8" stroke-width="2"/>
      <line x1="-9" y1="24" x2="9" y2="24" stroke="#94a3b8" stroke-width="2"/>
      <rect x="-14" y="42" width="28" height="26" rx="6" fill="#f8fafc"/>
    </g>
    <!-- Remaining natural teeth + edentulous span on Lower Left needing 2 implants -->
    ${Array.from({ length: 12 }).map((_, i) => {
      const x = 270 + i * 42;
      if (i === 8 || i === 9) {
        return `<rect x="${x - 16}" y="285" width="32" height="55" rx="8" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-dasharray="5 4"/>`;
      }
      return `
        <g transform="translate(${x}, 285)">
          <path d="M -8 18 L -5 60 L 5 60 L 8 18 Z" fill="#cbd5e1" opacity="0.85"/>
          <rect x="-13" y="-4" width="26" height="24" rx="6" fill="#e2e8f0"/>
        </g>
      `;
    }).join('')}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
