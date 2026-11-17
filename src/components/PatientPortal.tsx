import React, { useEffect, useState } from 'react';
import {
  Upload,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Trash2,
  AlertCircle,
  Star,
  ArrowLeft,
} from 'lucide-react';
import {
  CityRegion,
  PartnerClinic,
  PatientSubmission,
  PreferredMessenger,
  UploadedDentalImage,
} from '../types';
import {
  CITY_LABELS,
  CITY_NEIGHBORHOODS,
  COORDINATOR_BALE_ID,
  COORDINATOR_WHATSAPP_NUMBER,
  DENTAL_COMPLAINT_OPTIONS,
  buildBaleLink,
  buildWhatsAppLink,
  compressDentalImageFile,
  createSyntheticRadiographSvg,
  isValidIranMobile,
  normalizeIranPhone,
  toPersianDigits,
} from '../utils/persian';
import { ReferralVoucherCard } from './ReferralVoucherCard';
import { RadiographInspector } from './RadiographInspectorModal';

interface PatientPortalProps {
  submissions: PatientSubmission[];
  clinics: PartnerClinic[];
  onCreateSubmission: (submission: PatientSubmission) => Promise<void>;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  submissions,
  clinics,
  onCreateSubmission,
}) => {
  const [activeTab, setActiveTab] = useState<'intake' | 'track' | 'clinics'>('intake');

  // Form State
  const [city, setCity] = useState<CityRegion>('mahdasht');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredMessenger, setPreferredMessenger] = useState<PreferredMessenger>('whatsapp');
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([
    DENTAL_COMPLAINT_OPTIONS[0],
  ]);
  const [patientDescription, setPatientDescription] = useState('');
  const [sourceChannel, setSourceChannel] = useState('وب‌سایت مستقیم');
  const [images, setImages] = useState<UploadedDentalImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedCase, setSubmittedCase] = useState<PatientSubmission | null>(null);

  // Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [foundSubmission, setFoundSubmission] = useState<PatientSubmission | null>(null);
  const [lookupError, setLookupError] = useState('');

  // Clinic Directory Filter
  const [clinicCityFilter, setClinicCityFilter] = useState<CityRegion | 'all'>('all');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get('city') as CityRegion | null;
    const utmSource = params.get('utm_source');
    if (cityParam && ['mahdasht', 'karaj', 'pardis'].includes(cityParam)) {
      setCity(cityParam);
    }
    if (utmSource) {
      setSourceChannel(utmSource);
    }
  }, []);

  const toggleComplaint = (item: string) => {
    setSelectedComplaints((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setFormError('');
    try {
      const added: UploadedDentalImage[] = [];
      for (let i = 0; i < Math.min(files.length, 3 - images.length); i++) {
        const file = files[i];
        const compressedDataUrl = await compressDentalImageFile(file);
        added.push({
          id: `img-${Date.now()}-${i}`,
          category: 'opg',
          label: file.name,
          dataUrl: compressedDataUrl,
          uploadedAt: new Date().toISOString(),
        });
      }
      setImages((prev) => [...prev, ...added]);
    } catch {
      setFormError('خطا در بارگذاری تصویر.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddSampleRadiograph = () => {
    const variantMap: Record<CityRegion, 'opg_mahdasht' | 'periapical_karaj' | 'opg_pardis'> = {
      mahdasht: 'opg_mahdasht',
      karaj: 'periapical_karaj',
      pardis: 'opg_pardis',
    };
    setImages([
      {
        id: `img-sample-${Date.now()}`,
        category: 'opg',
        label: `گرافی نمونه (${CITY_LABELS[city]})`,
        dataUrl: createSyntheticRadiographSvg(variantMap[city]),
        uploadedAt: new Date().toISOString(),
      },
    ]);
    setFormError('');
  };

  const buildCoordinatorWhatsAppPayload = (sub: PatientSubmission) => {
    return (
      `🦷 *پرونده جدید در دنتال‌یار*\n` +
      `• *نام:* ${sub.fullName}\n` +
      `• *موبایل:* ${toPersianDigits(sub.phone)}\n` +
      `• *شهر:* ${CITY_LABELS[sub.city]}\n` +
      `• *درمان:* ${sub.chiefComplaintCategories.join('، ')}\n` +
      `• *کد رهگیری:* ${sub.trackingCode}`
    );
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('لطفاً نام خود را وارد کنید.');
      return;
    }
    if (!isValidIranMobile(phone)) {
      setFormError('شماره موبایل معتبر ۱۱ رقمی وارد کنید.');
      return;
    }
    if (images.length === 0) {
      setFormError('لطفاً عکس گرافی یا دندان خود را بارگذاری کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const prefixMap: Record<CityRegion, string> = {
        mahdasht: 'MHD',
        karaj: 'KRJ',
        pardis: 'PRD',
      };
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const trackingCode = `${prefixMap[city]}-${randomNum}`;
      const normalizedMobile = normalizeIranPhone(phone);

      const newSubmission: PatientSubmission = {
        id: `sub-${Date.now()}`,
        trackingCode,
        createdAt: new Date().toISOString(),
        fullName: fullName.trim(),
        phone: normalizedMobile,
        city,
        neighborhood: CITY_NEIGHBORHOODS[city][0],
        preferredMessenger,
        messengerId: normalizedMobile,
        chiefComplaintCategories:
          selectedComplaints.length > 0 ? selectedComplaints : [DENTAL_COMPLAINT_OPTIONS[0]],
        painLevel: 5,
        painDuration: 'ثبت آنلاین',
        jawRegion: 'بررسی در گرافی',
        medicalHistory: 'ندارد',
        patientDescription: patientDescription.trim() || 'بررسی گرافی و معرفی دندانپزشک',
        sourceChannel,
        status: 'new',
        images,
      };

      await onCreateSubmission(newSubmission);
      setSubmittedCase(newSubmission);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setFormError('خطا در ثبت اطلاعات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const raw = (presetQuery ?? lookupQuery).trim();
    if (!raw) return;
    setLookupError('');

    const normalizedMobile = normalizeIranPhone(raw);
    const upperCode = raw.toUpperCase();

    const match = submissions.find(
      (s) =>
        s.trackingCode.toUpperCase() === upperCode ||
        s.referral?.voucherCode.toUpperCase() === upperCode ||
        normalizeIranPhone(s.phone) === normalizedMobile
    );

    if (match) {
      setFoundSubmission(match);
    } else {
      setFoundSubmission(null);
      setLookupError('پرونده‌ای با این مشخصات یافت نشد.');
    }
  };

  const filteredClinics = clinics.filter(
    (c) => c.active && (clinicCityFilter === 'all' || c.city === clinicCityFilter)
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Rich Initial Gradient Hero — With Concise, Punchy Copy */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-teal-900 via-teal-800 to-slate-900 text-white shadow-2xl border border-teal-700/40">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-12 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 text-center space-y-5">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-teal-200 backdrop-blur-md border border-white/15">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>ماهدشت • کرج • پردیس</span>
            <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-emerald-200 border border-emerald-400/30">
              رایگان برای بیمار
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight max-w-2xl mx-auto">
            بررسی تخصصی گرافی دندان و معرفی به{' '}
            <span className="text-amber-300 underline decoration-amber-400/50 decoration-wavy underline-offset-8">
              دندانپزشکان معتمد
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-teal-100 max-w-lg mx-auto leading-relaxed">
            عکس گرافی (OPG) یا دندان خود را بفرستید؛ ما شخصاً بررسی کرده و بهترین دندانپزشک منتخب
            منطقه را در واتساپ یا بله به شما معرفی می‌کنیم.
          </p>

          {/* Navigation Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('intake');
                setSubmittedCase(null);
              }}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-xs sm:text-sm font-extrabold transition shadow-lg cursor-pointer ${
                activeTab === 'intake'
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>ارسال عکس گرافی</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>پیگیری پرونده</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clinics')}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'clinics'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>مراکز منتخب ({toPersianDigits(clinics.filter((c) => c.active).length)})</span>
            </button>
          </div>
        </div>
      </section>

      {/* TAB 1: CONCISE INTAKE WITH RICH VISUAL STYLING */}
      {activeTab === 'intake' && (
        <section className="mx-auto max-w-3xl">
          {submittedCase ? (
            <div className="space-y-6">
              <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-6 sm:p-8 text-center shadow-xl space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
                  گرافی شما با موفقیت ثبت شد!
                </h2>

                <div className="inline-block rounded-2xl bg-white px-6 py-3 shadow-sm border border-emerald-300">
                  <span className="text-xs text-slate-500 block">کد رهگیری پرونده:</span>
                  <span className="font-mono text-2xl font-black tracking-wider text-teal-800">
                    {submittedCase.trackingCode}
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={buildWhatsAppLink(
                      COORDINATOR_WHATSAPP_NUMBER,
                      buildCoordinatorWhatsAppPayload(submittedCase)
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg hover:bg-emerald-500 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>ارسال مستقیم به واتساپ کارشناس</span>
                  </a>

                  <a
                    href={buildBaleLink(COORDINATOR_BALE_ID)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3.5 text-sm font-bold text-white shadow-md hover:bg-sky-500 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>ارسال در بله</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setSubmittedCase(null)}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    ثبت گرافی جدید
                  </button>
                </div>
              </div>

              <ReferralVoucherCard submission={submittedCase} />
            </div>
          ) : (
            <form
              onSubmit={handleSubmitForm}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-6"
            >
              {formError && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-900">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. City Cards */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-2">
                  ۱. انتخاب شهر شما
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['mahdasht', 'karaj', 'pardis'] as CityRegion[]).map((c) => {
                    const active = city === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3.5 px-3 text-sm font-black transition cursor-pointer ${
                          active
                            ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-sm'
                            : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <MapPin
                          className={`h-4 w-4 ${active ? 'text-teal-600' : 'text-slate-400'}`}
                        />
                        <span>{CITY_LABELS[c]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Contact Inputs */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-700">
                  ۲. مشخصات تماس
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="نام و نام خانوادگی"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="شماره موبایل (۰۹۱۲...)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 dir-ltr text-right focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-500">دریافت نتیجه در:</span>
                  {(
                    [
                      { id: 'whatsapp', label: 'واتساپ' },
                      { id: 'bale', label: 'بله' },
                      { id: 'phone', label: 'تماس تلفنی' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPreferredMessenger(m.id)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border transition cursor-pointer ${
                        preferredMessenger === m.id
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Radiograph Upload Dropzone */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700">
                    ۳. بارگذاری عکس گرافی (OPG) یا عکس دندان
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSampleRadiograph}
                    className="rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 cursor-pointer"
                  >
                    + گرافی نمونه (تست)
                  </button>
                </div>

                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-400 bg-teal-50/40 p-6 text-center transition hover:bg-teal-50 cursor-pointer">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md mb-2.5">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-extrabold text-teal-950">
                    {isUploading
                      ? 'در حال بارگذاری...'
                      : 'انتخاب عکس گرافی یا دندان از گالری / دوربین'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="relative rounded-2xl border border-slate-200 bg-slate-900 p-2 text-white shadow-md"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.label}
                          className="h-28 w-full rounded-xl object-contain bg-black"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setImages((prev) => prev.filter((item) => item.id !== img.id))
                          }
                          className="absolute top-3 left-3 rounded-lg bg-rose-500/80 p-1.5 text-white hover:bg-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Quick Complaint Tags & Short Note */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-700">
                  ۴. خدمت مورد نیاز
                </label>
                <div className="flex flex-wrap gap-2">
                  {DENTAL_COMPLAINT_OPTIONS.map((option) => {
                    const checked = selectedComplaints.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleComplaint(option)}
                        className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                          checked
                            ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {checked ? '✓ ' : ''}
                        {option}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  value={patientDescription}
                  onChange={(e) => setPatientDescription(e.target.value)}
                  placeholder="توضیح کوتاه (اختیاری)..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-teal-700 to-emerald-600 py-4 text-base font-black text-white shadow-xl hover:from-teal-600 hover:to-emerald-500 transition disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isSubmitting ? 'در حال ثبت...' : 'ارسال گرافی و دریافت مشاوره رایگان'}
                </span>
                <ArrowLeft className="h-5 w-5" />
              </button>
            </form>
          )}
        </section>
      )}

      {/* TAB 2: TRACKING */}
      {activeTab === 'track' && (
        <section className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-xl font-black text-slate-900">
              پیگیری نتیجه بررسی و معرفی‌نامه
            </h2>

            <form onSubmit={(e) => handleLookup(e)} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="شماره موبایل یا کد رهگیری (مثلاً PRD-9104)"
                className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-teal-700 px-7 py-3.5 text-sm font-black text-white hover:bg-teal-600 transition cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>جستجو</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">نمونه‌ها:</span>
              {submissions.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setLookupQuery(s.trackingCode);
                    handleLookup(undefined, s.trackingCode);
                  }}
                  className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 cursor-pointer"
                >
                  {s.trackingCode} ({CITY_LABELS[s.city]})
                </button>
              ))}
            </div>

            {lookupError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
                {lookupError}
              </div>
            )}
          </div>

          {foundSubmission && (
            <div className="space-y-6">
              <ReferralVoucherCard submission={foundSubmission} />
              {foundSubmission.images.length > 0 && (
                <RadiographInspector
                  images={foundSubmission.images}
                  patientName={foundSubmission.fullName}
                  inline
                />
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: CLINICS */}
      {activeTab === 'clinics' && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
            <h2 className="text-lg font-black text-slate-900">
              مراکز دندانپزشکی منتخب (ماهدشت، کرج و پردیس)
            </h2>
            <div className="flex flex-wrap gap-2">
              {(['all', 'mahdasht', 'karaj', 'pardis'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setClinicCityFilter(c)}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                    clinicCityFilter === c
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c === 'all' ? 'همه' : CITY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredClinics.map((clinic) => (
              <div
                key={clinic.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-extrabold text-teal-900">
                      📍 {CITY_LABELS[clinic.city]}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      {toPersianDigits(clinic.rating)}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900">{clinic.name}</h3>
                  <p className="text-xs font-bold text-teal-700">{clinic.doctorName}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{clinic.address}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCity(clinic.city);
                    setActiveTab('intake');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full rounded-xl bg-teal-50 border border-teal-300 py-2.5 text-xs font-extrabold text-teal-900 hover:bg-teal-600 hover:text-white transition cursor-pointer"
                >
                  دریافت معرفی‌نامه این مرکز
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
