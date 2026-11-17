import React, { useEffect, useState } from 'react';
import {
  Eye,
  CheckCircle2,
  Clock,
  Building2,
  Wallet,
  Megaphone,
  MessageCircle,
  Copy,
  Plus,
  Trash2,
  Send,
  Sparkles,
  FileCheck2,
  MapPin,
  Phone,
  SlidersHorizontal,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { ToothIcon } from './ToothIcon';
import {
  BillingStatus,
  CityRegion,
  PartnerClinic,
  PatientSubmission,
  SubmissionStatus,
  UrgencyLevel,
  VisualAssessment,
} from '../types';
import {
  CITY_LABELS,
  CITY_NEIGHBORHOODS,
  COMMON_TEETH_LABELS,
  COORDINATOR_WHATSAPP_NUMBER,
  DENTAL_COMPLAINT_OPTIONS,
  MESSENGER_LABELS,
  URGENCY_LABELS,
  buildBaleLink,
  buildClinicHandoffMessage,
  buildPatientReferralMessage,
  buildWhatsAppLink,
  formatShamsiDate,
  formatToman,
  toPersianDigits,
} from '../utils/persian';
import { RadiographInspector } from './RadiographInspectorModal';

interface AdminDashboardProps {
  submissions: PatientSubmission[];
  clinics: PartnerClinic[];
  onSaveSubmission: (sub: PatientSubmission) => Promise<void>;
  onDeleteSubmission: (id: string) => Promise<void>;
  onSaveClinic: (clinic: PartnerClinic) => Promise<void>;
  onDeleteClinic: (id: string) => Promise<void>;
}

const QUICK_CLINICAL_PRESETS = [
  {
    title: 'پوسیدگی عمیق + نیاز به عصب‌کشی و روکش',
    findings:
      'در بررسی گرافی ارسالی، پوسیدگی عمیق تاج با درگیری کامل شاخک پالپ و التهاب فضای پریودنتال در انتهای ریشه مشاهده می‌شود. طول و فرم ریشه‌ها مناسب بوده و دندان کاملاً قابل نگهداری است.',
    treatment: 'درمان ریشه تخصصی (عصب‌کشی) + بازسازی تاج (بیلدآپ) و روکش سرامیکی',
    patientNote:
      'دندان شما نیازی به کشیدن ندارد و با یک عصب‌کشی دقیق و روکش کاملاً حفظ خواهد شد. پیشنهاد می‌شود قبل از تشدید درد یا آبسه، در همین هفته درمان را آغاز فرمایید.',
    urgency: 'high' as UrgencyLevel,
    minCost: 4500000,
    maxCost: 7500000,
  },
  {
    title: 'کاندید کاشت ایمپلنت (تراکم استخوان مناسب)',
    findings:
      'در ناحیه بی‌دندانی مشخص‌شده در گرافی OPG، ارتفاع و ضخامت استخوان فک تا مجاور سینوس/کانال عصب فکی مناسب ارزیابی می‌شود و امکان کاشت فیکسچر ایمپلنت بدون پیوند استخوان پیچیده وجود دارد.',
    treatment: 'کاشت فیکسچر ایمپلنت تیتانیومی + روکش زیرکونیا دیجیتال',
    patientNote:
      'در بررسی عکس OPG شما، وضعیت استخوان فک بسیار خوب است و می‌توانید با خیال راحت اقدام به کاشت ایمپلنت نمایید.',
    urgency: 'normal' as UrgencyLevel,
    minCost: 14000000,
    maxCost: 22000000,
  },
  {
    title: 'جراحی دندان عقل نهفته / نیمه‌نهفته',
    findings:
      'دندان عقل (شماره ۸) دارای زاویه مزیوآنگولار بوده و به ریشه دندان آسیاب دوم (شماره ۷) فشار وارد می‌کند که مستعد ایجاد پوسیدگی دیستال دندان ۷ و التهاب لثه (پری‌کرونیت) است.',
    treatment: 'جراحی تخصصی خارج‌سازی دندان عقل نهفته/نیمه‌نهفته',
    patientNote:
      'به دلیل زاویه رویش دندان عقل و فشار به دندان کناری، توصیه می‌شود توسط دندانپزشک ماهر در جراحی خارج شود تا به دندان آسیاب سالم شما آسیب نرسد.',
    urgency: 'high' as UrgencyLevel,
    minCost: 2800000,
    maxCost: 4800000,
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  submissions,
  clinics,
  onSaveSubmission,
  onDeleteSubmission,
  onSaveClinic,
  onDeleteClinic,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<
    'workstation' | 'clinics' | 'billing' | 'campaigns'
  >('workstation');

  // Filter & Selection for Workstation
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [cityFilter, setCityFilter] = useState<CityRegion | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string>(submissions[0]?.id || '');

  const selectedSubmission =
    submissions.find((s) => s.id === selectedId) || submissions[0] || null;

  // Assessment Form State for Selected Submission
  const [affectedTeeth, setAffectedTeeth] = useState<string[]>([]);
  const [radiographicFindings, setRadiographicFindings] = useState('');
  const [recommendedTreatment, setRecommendedTreatment] = useState('');
  const [patientSummaryNote, setPatientSummaryNote] = useState('');
  const [clinicPrivateNote, setClinicPrivateNote] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('high');
  const [estimatedCostMinToman, setEstimatedCostMinToman] = useState<number>(4500000);
  const [estimatedCostMaxToman, setEstimatedCostMaxToman] = useState<number>(7000000);

  // Referral Assignment State
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [expectedTreatmentAmount, setExpectedTreatmentAmount] = useState<number>(6000000);
  const [customCoordinationFee, setCustomCoordinationFee] = useState<number>(900000);

  // Communication Hub Message Preview State
  const [messageTarget, setMessageTarget] = useState<'patient' | 'clinic'>('patient');
  const [customMessageText, setCustomMessageText] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState('');

  // New Clinic Modal / Form State
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newMedicalCode, setNewMedicalCode] = useState('');
  const [newClinicCity, setNewClinicCity] = useState<CityRegion>('mahdasht');
  const [newClinicNeighborhood, setNewClinicNeighborhood] = useState(
    CITY_NEIGHBORHOODS.mahdasht[0]
  );
  const [newClinicAddress, setNewClinicAddress] = useState('');
  const [newClinicPhone, setNewClinicPhone] = useState('');
  const [newClinicWhatsapp, setNewClinicWhatsapp] = useState('');
  const [newClinicBale, setNewClinicBale] = useState('');
  const [newClinicCommissionModel, setNewClinicCommissionModel] = useState<
    'percentage' | 'fixed'
  >('percentage');
  const [newClinicPercent, setNewClinicPercent] = useState<number>(15);
  const [newClinicFixedFee, setNewClinicFixedFee] = useState<number>(500000);
  const [newClinicNote, setNewClinicNote] = useState('');

  // Campaign Generator State
  const [campaignCity, setCampaignCity] = useState<CityRegion>('mahdasht');
  const [campaignChannel, setCampaignChannel] = useState('bale_mahdasht');

  // Sync assessment & referral fields when selectedSubmission changes
  useEffect(() => {
    if (!selectedSubmission) return;
    const a = selectedSubmission.assessment;
    if (a) {
      setAffectedTeeth(a.affectedTeeth || []);
      setRadiographicFindings(a.radiographicFindings || '');
      setRecommendedTreatment(a.recommendedTreatment || '');
      setPatientSummaryNote(a.patientSummaryNote || '');
      setClinicPrivateNote(a.clinicPrivateNote || '');
      setUrgency(a.urgency || 'high');
      setEstimatedCostMinToman(a.estimatedCostMinToman || 4000000);
      setEstimatedCostMaxToman(a.estimatedCostMaxToman || 7000000);
    } else {
      setAffectedTeeth(['۶ پایین راست (آسیاب اول)']);
      setRadiographicFindings('');
      setRecommendedTreatment('');
      setPatientSummaryNote('');
      setClinicPrivateNote('');
      setUrgency(selectedSubmission.painLevel >= 8 ? 'emergency' : 'high');
      setEstimatedCostMinToman(4000000);
      setEstimatedCostMaxToman(7000000);
    }

    // Default clinic selection in same city
    if (selectedSubmission.referral?.clinicId) {
      setSelectedClinicId(selectedSubmission.referral.clinicId);
      setExpectedTreatmentAmount(selectedSubmission.referral.actualTreatmentAmountToman || 6000000);
      setCustomCoordinationFee(selectedSubmission.referral.coordinationFeeToman || 900000);
    } else {
      const sameCityClinic =
        clinics.find((c) => c.active && c.city === selectedSubmission.city) || clinics[0];
      if (sameCityClinic) {
        setSelectedClinicId(sameCityClinic.id);
        const avgTreatment = 6000000;
        setExpectedTreatmentAmount(avgTreatment);
        const calcFee =
          sameCityClinic.commissionModel === 'percentage'
            ? Math.round((avgTreatment * sameCityClinic.defaultCommissionPercent) / 100)
            : sameCityClinic.defaultFixedFeeToman;
        setCustomCoordinationFee(calcFee);
      }
    }
  }, [selectedSubmission?.id]);

  // Update message text when target or assessment/referral changes
  useEffect(() => {
    if (!selectedSubmission) return;
    const matchedClinic = clinics.find((c) => c.id === selectedClinicId);
    if (messageTarget === 'patient') {
      setCustomMessageText(buildPatientReferralMessage(selectedSubmission, matchedClinic));
    } else {
      setCustomMessageText(buildClinicHandoffMessage(selectedSubmission));
    }
  }, [
    selectedSubmission,
    messageTarget,
    selectedClinicId,
    radiographicFindings,
    recommendedTreatment,
  ]);

  const handleClinicSelectChange = (clinicId: string, treatmentVal = expectedTreatmentAmount) => {
    setSelectedClinicId(clinicId);
    const c = clinics.find((item) => item.id === clinicId);
    if (c) {
      const fee =
        c.commissionModel === 'percentage'
          ? Math.round((treatmentVal * c.defaultCommissionPercent) / 100)
          : c.defaultFixedFeeToman;
      setCustomCoordinationFee(fee);
    }
  };

  const toggleTooth = (tooth: string) => {
    setAffectedTeeth((prev) =>
      prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]
    );
  };

  const handleApplyPreset = (preset: (typeof QUICK_CLINICAL_PRESETS)[0]) => {
    setRadiographicFindings(preset.findings);
    setRecommendedTreatment(preset.treatment);
    setPatientSummaryNote(preset.patientNote);
    setUrgency(preset.urgency);
    setEstimatedCostMinToman(preset.minCost);
    setEstimatedCostMaxToman(preset.maxCost);
    const avg = Math.round((preset.minCost + preset.maxCost) / 2);
    setExpectedTreatmentAmount(avg);
    handleClinicSelectChange(selectedClinicId, avg);
  };

  const handleSaveAssessmentOnly = async () => {
    if (!selectedSubmission) return;
    const assessmentObj: VisualAssessment = {
      reviewedAt: new Date().toISOString(),
      reviewerName: 'مدیر تریاژ و بررسی تخصصی گرافی',
      affectedTeeth,
      radiographicFindings:
        radiographicFindings.trim() || 'بررسی کامل گرافی و تصاویر انجام شد.',
      recommendedTreatment:
        recommendedTreatment.trim() || selectedSubmission.chiefComplaintCategories.join('، '),
      patientSummaryNote:
        patientSummaryNote.trim() ||
        'لطفاً جهت انجام درمان به کلینیک منتخب معرفی‌شده مراجعه فرمایید.',
      clinicPrivateNote: clinicPrivateNote.trim(),
      urgency,
      estimatedCostMinToman,
      estimatedCostMaxToman,
    };

    const updated: PatientSubmission = {
      ...selectedSubmission,
      status: selectedSubmission.status === 'new' ? 'assessed' : selectedSubmission.status,
      assessment: assessmentObj,
    };
    await onSaveSubmission(updated);
    showToast('نتیجه بررسی چشمی گرافی با موفقیت ذخیره شد.');
  };

  const handleIssueReferralVoucher = async () => {
    if (!selectedSubmission) return;
    const clinic = clinics.find((c) => c.id === selectedClinicId);
    if (!clinic) return;

    const assessmentObj: VisualAssessment = {
      reviewedAt: selectedSubmission.assessment?.reviewedAt || new Date().toISOString(),
      reviewerName: 'مدیر تریاژ و بررسی تخصصی گرافی',
      affectedTeeth,
      radiographicFindings:
        radiographicFindings.trim() || 'بررسی کامل گرافی و تصاویر انجام شد.',
      recommendedTreatment:
        recommendedTreatment.trim() || selectedSubmission.chiefComplaintCategories.join('، '),
      patientSummaryNote:
        patientSummaryNote.trim() ||
        'معرفی‌نامه رسمی شما جهت مراجعه به دندانپزشک معتمد منطقه صادر شد.',
      clinicPrivateNote: clinicPrivateNote.trim(),
      urgency,
      estimatedCostMinToman,
      estimatedCostMaxToman,
    };

    const cityPrefix =
      clinic.city === 'mahdasht' ? 'MHD' : clinic.city === 'karaj' ? 'KRJ' : 'PRD';
    const voucherCode =
      selectedSubmission.referral?.voucherCode ||
      `${cityPrefix}-1405-${selectedSubmission.trackingCode.split('-')[1] || '840'}`;

    const updated: PatientSubmission = {
      ...selectedSubmission,
      status: 'referred',
      assessment: assessmentObj,
      referral: {
        voucherCode,
        clinicId: clinic.id,
        clinicName: clinic.name,
        doctorName: clinic.doctorName,
        clinicCity: clinic.city,
        clinicNeighborhood: clinic.neighborhood,
        clinicAddress: clinic.address,
        clinicPhone: clinic.phone,
        clinicWhatsapp: clinic.whatsappNumber,
        clinicBaleId: clinic.baleId,
        referredAt: new Date().toISOString(),
        commissionModel: clinic.commissionModel,
        commissionPercent: clinic.defaultCommissionPercent,
        coordinationFeeToman: customCoordinationFee,
        actualTreatmentAmountToman: expectedTreatmentAmount,
        billingStatus: selectedSubmission.referral?.billingStatus || 'pending_visit',
      },
    };

    await onSaveSubmission(updated);
    showToast(`معرفی‌نامه رسمی با کد ${voucherCode} برای «${clinic.name}» صادر شد!`);
  };

  const handleUpdateBillingStatus = async (
    sub: PatientSubmission,
    newBillingStatus: BillingStatus,
    newTreatmentAmount?: number
  ) => {
    if (!sub.referral) return;
    const amount = newTreatmentAmount ?? sub.referral.actualTreatmentAmountToman;
    const fee =
      sub.referral.commissionModel === 'percentage'
        ? Math.round((amount * sub.referral.commissionPercent) / 100)
        : sub.referral.coordinationFeeToman;

    const updated: PatientSubmission = {
      ...sub,
      status: newBillingStatus === 'settled' ? 'completed' : sub.status,
      referral: {
        ...sub.referral,
        actualTreatmentAmountToman: amount,
        coordinationFeeToman: fee,
        billingStatus: newBillingStatus,
        settledAt: newBillingStatus === 'settled' ? new Date().toISOString() : undefined,
      },
    };
    await onSaveSubmission(updated);
    showToast('وضعیت مالی و کمیسیون ارجاع به‌روزرسانی شد.');
  };

  const handleCreateNewClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName.trim() || !newDoctorName.trim()) return;
    const created: PartnerClinic = {
      id: `clinic-${Date.now()}`,
      name: newClinicName.trim(),
      doctorName: newDoctorName.trim(),
      medicalCouncilCode: newMedicalCode.trim() || '۱۵۰۰۰۰',
      city: newClinicCity,
      neighborhood: newClinicNeighborhood,
      address: newClinicAddress.trim() || `${CITY_LABELS[newClinicCity]}، ${newClinicNeighborhood}`,
      phone: newClinicPhone.trim() || '02637300000',
      whatsappNumber: newClinicWhatsapp.trim() || '09120000000',
      baleId: newClinicBale.trim() || 'dental_partner',
      specialties: DENTAL_COMPLAINT_OPTIONS.slice(0, 4),
      commissionModel: newClinicCommissionModel,
      defaultCommissionPercent: newClinicPercent,
      defaultFixedFeeToman: newClinicFixedFee,
      rating: 4.9,
      verifiedNote:
        newClinicNote.trim() || 'دندانپزشک معتمد و تاییدشده در شبکه ارجاع دنتال‌یار',
      workingHours: 'شنبه تا پنجشنبه ۹ الی ۲۰',
      active: true,
    };
    await onSaveClinic(created);
    setShowAddClinic(false);
    setNewClinicName('');
    setNewDoctorName('');
    setNewClinicAddress('');
    showToast(`کلینیک «${created.name}» به شبکه همکاران اضافه شد.`);
  };

  const showToast = (msg: string) => {
    setCopiedFeedback(msg);
    setTimeout(() => setCopiedFeedback(''), 3200);
  };

  const copyAndOpenBale = (baleTarget: string, text: string) => {
    navigator.clipboard.writeText(text);
    showToast('متن پیام کپی شد! در حال باز کردن پیام‌رسان بله...');
    window.open(buildBaleLink(baleTarget), '_blank', 'noopener,noreferrer');
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchCity = cityFilter === 'all' || s.city === cityFilter;
    return matchStatus && matchCity;
  });

  // Financial Metrics Calculation (Pillar 5: Monetization)
  const referredSubmissions = submissions.filter((s) => Boolean(s.referral));
  const totalSettledRevenue = referredSubmissions
    .filter((s) => s.referral?.billingStatus === 'settled')
    .reduce((acc, s) => acc + (s.referral?.coordinationFeeToman || 0), 0);
  const totalUnpaidReceivables = referredSubmissions
    .filter((s) => s.referral?.billingStatus === 'visited_unpaid')
    .reduce((acc, s) => acc + (s.referral?.coordinationFeeToman || 0), 0);
  const totalExpectedPipeline = referredSubmissions
    .filter((s) => s.referral?.billingStatus === 'pending_visit')
    .reduce((acc, s) => acc + (s.referral?.coordinationFeeToman || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {copiedFeedback && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-2xl border border-teal-500">
          <Check className="h-4 w-4 text-teal-400" />
          <span>{copiedFeedback}</span>
        </div>
      )}

      {/* Top Admin KPI & Navigation Header */}
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-teal-500/20 px-3 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30 mb-1">
              پنل مدیریت، بررسی چشمی گرافی و ارجاع دندانپزشکی
            </span>
            <h1 className="text-xl sm:text-2xl font-black">
              میز کار مرکزی ارجاع بیماران (ماهدشت، کرج و پردیس)
            </h1>
          </div>

          {/* 4 Main Admin Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMainTab('workstation')}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeMainTab === 'workstation'
                  ? 'bg-teal-500 text-slate-950 font-black shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>میز کار بررسی گرافی ({toPersianDigits(submissions.length)})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('clinics')}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeMainTab === 'clinics'
                  ? 'bg-teal-500 text-slate-950 font-black shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>دندانپزشکان همکار ({toPersianDigits(clinics.length)})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('billing')}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeMainTab === 'billing'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>مدیریت کمیسیون و تسویه کلینیک‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('campaigns')}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeMainTab === 'campaigns'
                  ? 'bg-teal-500 text-slate-950 font-black shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Megaphone className="h-4 w-4" />
              <span>لینک‌ساز جذب بیمار (بله / اینستاگرام)</span>
            </button>
          </div>
        </div>

        {/* Quick Summary KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-800/90 p-4 border border-slate-700">
            <span className="text-xs text-slate-400 block">گرافی‌های جدید در انتظار بررسی</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {toPersianDigits(submissions.filter((s) => s.status === 'new').length)} پرونده
            </span>
          </div>
          <div className="rounded-2xl bg-slate-800/90 p-4 border border-slate-700">
            <span className="text-xs text-slate-400 block">ارجاع‌های صادرشده به کلینیک‌ها</span>
            <span className="text-2xl font-black text-teal-400 mt-1 block">
              {toPersianDigits(referredSubmissions.length)} بیمار
            </span>
          </div>
          <div className="rounded-2xl bg-slate-800/90 p-4 border border-slate-700">
            <span className="text-xs text-slate-400 block">مطالبات کمیسیون از کلینیک‌ها</span>
            <span className="text-lg sm:text-xl font-black text-sky-400 mt-1 block">
              {formatToman(totalUnpaidReceivables + totalExpectedPipeline)}
            </span>
          </div>
          <div className="rounded-2xl bg-slate-800/90 p-4 border border-slate-700">
            <span className="text-xs text-slate-400 block">درآمد تسویه‌شده شما</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 mt-1 block">
              {formatToman(totalSettledRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: VISUAL REVIEW & REFERRAL WORKSTATION                           */}
      {/* ===================================================================== */}
      {activeMainTab === 'workstation' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Right Sidebar: Patient Queue List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-teal-600" />
                  <span>صف پرونده‌ها و گرافی‌های ارسالی</span>
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  {toPersianDigits(filteredSubmissions.length)} مورد
                </span>
              </div>

              {/* Filter by City */}
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'mahdasht', 'karaj', 'pardis'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCityFilter(c)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      cityFilter === c
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c === 'all' ? 'همه شهرها' : CITY_LABELS[c]}
                  </button>
                ))}
              </div>

              {/* Filter by Status */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: 'همه وضعیت‌ها' },
                    { id: 'new', label: 'جدید (منتظر بررسی)' },
                    { id: 'assessed', label: 'بررسی‌شده' },
                    { id: 'referred', label: 'ارجاع‌شده' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Submissions Cards List */}
              <div className="space-y-2.5 max-h-[680px] overflow-y-auto pl-1">
                {filteredSubmissions.map((sub) => {
                  const isSelected = selectedSubmission?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedId(sub.id)}
                      className={`rounded-2xl border-2 p-3.5 transition cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-sm text-slate-900">{sub.fullName}</span>
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                          {sub.trackingCode}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-bold text-slate-800">
                          📍 {CITY_LABELS[sub.city]}
                        </span>
                        <span>•</span>
                        <span>شدت درد: {toPersianDigits(sub.painLevel)}/۱۰</span>
                        <span>•</span>
                        <span>{toPersianDigits(sub.images.length)} تصویر گرافی</span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        {sub.status === 'new' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            <Clock className="h-3 w-3" />
                            در انتظار بررسی گرافی
                          </span>
                        )}
                        {sub.status === 'assessed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                            <FileCheck2 className="h-3 w-3" />
                            بررسی شده (آماده ارجاع)
                          </span>
                        )}
                        {(sub.status === 'referred' || sub.status === 'completed') && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            ارجاع به: {sub.referral?.clinicName.slice(0, 22)}...
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400">
                          {formatShamsiDate(sub.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Left Main Column: Visual Radiograph Inspector + Assessment + Clinic Matching + Bale/WhatsApp */}
          <div className="lg:col-span-8 space-y-6">
            {selectedSubmission ? (
              <>
                {/* Patient Info Banner */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900">
                          پرونده بالینی: {selectedSubmission.fullName}
                        </h2>
                        <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-extrabold text-teal-900">
                          {CITY_LABELS[selectedSubmission.city]} — {selectedSubmission.neighborhood}
                        </span>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                            selectedSubmission.painLevel >= 7
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          شدت درد: {toPersianDigits(selectedSubmission.painLevel)} از ۱۰
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        کد رهگیری: <strong className="font-mono">{selectedSubmission.trackingCode}</strong>{' '}
                        • کانال ورودی: <strong>{selectedSubmission.sourceChannel}</strong> • پیام‌رسان
                        ترجیحی:{' '}
                        <strong className="text-teal-700">
                          {MESSENGER_LABELS[selectedSubmission.preferredMessenger]}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selectedSubmission.phone}`}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200"
                      >
                        <Phone className="h-3.5 w-3.5 text-teal-600" />
                        <span>{toPersianDigits(selectedSubmission.phone)}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onDeleteSubmission(selectedSubmission.id)}
                        className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        title="حذف پرونده"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                      <span className="font-bold text-slate-500 block mb-1">
                        شکایت اصلی و توضیحات بیمار:
                      </span>
                      <p className="font-semibold text-slate-900 leading-relaxed">
                        {selectedSubmission.patientDescription}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedSubmission.chiefComplaintCategories.map((c) => (
                          <span
                            key={c}
                            className="rounded-md bg-teal-100/80 px-2 py-0.5 text-[11px] font-bold text-teal-900"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 space-y-1.5">
                      <div>
                        <span className="font-bold text-slate-500">ناحیه فک درگیر: </span>
                        <strong className="text-slate-900">{selectedSubmission.jawRegion}</strong>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">مدت زمان مشکل: </span>
                        <strong className="text-slate-900">{selectedSubmission.painDuration}</strong>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">سابقه پزشکی / دارویی: </span>
                        <strong className="text-slate-900">
                          {selectedSubmission.medicalHistory}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Embedded Radiograph Visual Inspector */}
                  <RadiographInspector
                    images={selectedSubmission.images}
                    patientName={selectedSubmission.fullName}
                    inline
                  />
                </div>

                {/* STEP A: Visual Review & Clinical Assessment Form */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-extrabold text-teal-600">
                        مرحله اول ارزیابی شما
                      </span>
                      <h3 className="text-lg font-black text-slate-900">
                        ثبت نظر تخصصی بررسی گرافی (OPG / عکس دندان)
                      </h3>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-500">الگوی آماده تشخیص:</span>
                      {QUICK_CLINICAL_PRESETS.map((preset) => (
                        <button
                          key={preset.title}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-[11px] font-bold text-teal-900 hover:bg-teal-100 cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3 text-teal-600" />
                          <span>{preset.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Tooth Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      انتخاب دندان‌های نیازمند درمان (مشاهده‌شده در گرافی):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_TEETH_LABELS.map((tooth) => {
                        const active = affectedTeeth.includes(tooth);
                        return (
                          <button
                            key={tooth}
                            type="button"
                            onClick={() => toggleTooth(tooth)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                              active
                                ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            🦷 {tooth}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        یافته‌های رادیولوژی و بررسی چشمی شما:
                      </label>
                      <textarea
                        rows={3}
                        value={radiographicFindings}
                        onChange={(e) => setRadiographicFindings(e.target.value)}
                        placeholder="مثلاً: در گرافی OPG ارسالی، پوسیدگی عمیق دیستال دندان ۶ پایین راست همراه با ضایعه پری‌اپیکال دیده می‌شود..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        طرح درمان پیشنهادی:
                      </label>
                      <textarea
                        rows={3}
                        value={recommendedTreatment}
                        onChange={(e) => setRecommendedTreatment(e.target.value)}
                        placeholder="مثلاً: درمان ریشه تخصصی (عصب‌کشی ۳ کاناله) + بیلدآپ و روکش زیرکونیا..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        توضیح ساده و اطمینان‌بخش برای بیمار (در معرفی‌نامه درج می‌شود):
                      </label>
                      <textarea
                        rows={2}
                        value={patientSummaryNote}
                        onChange={(e) => setPatientSummaryNote(e.target.value)}
                        placeholder="مثلاً: جای نگرانی نیست؛ ریشه دندان شما سالم است و با عصب‌کشی حفظ می‌شود..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        یادداشت بالینی اختصاصی برای دندانپزشک همکار:
                      </label>
                      <textarea
                        rows={2}
                        value={clinicPrivateNote}
                        onChange={(e) => setClinicPrivateNote(e.target.value)}
                        placeholder="مثلاً: بیمار استرس دندانپزشکی دارد؛ لطفاً نوبت اول عصر هماهنگ شود..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        درجه فوریت ارجاع:
                      </label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900"
                      >
                        {(Object.keys(URGENCY_LABELS) as UrgencyLevel[]).map((u) => (
                          <option key={u} value={u}>
                            {URGENCY_LABELS[u].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        حداقل هزینه تخمینی درمان (تومان):
                      </label>
                      <input
                        type="number"
                        step={500000}
                        value={estimatedCostMinToman}
                        onChange={(e) => setEstimatedCostMinToman(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900"
                      />
                      <span className="text-[11px] text-slate-500">
                        {formatToman(estimatedCostMinToman)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        حداکثر هزینه تخمینی درمان (تومان):
                      </label>
                      <input
                        type="number"
                        step={500000}
                        value={estimatedCostMaxToman}
                        onChange={(e) => setEstimatedCostMaxToman(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900"
                      />
                      <span className="text-[11px] text-slate-500">
                        {formatToman(estimatedCostMaxToman)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAssessmentOnly}
                      className="rounded-xl border border-teal-600 bg-teal-50 px-5 py-2.5 text-xs font-extrabold text-teal-900 hover:bg-teal-100 cursor-pointer"
                    >
                      ذخیره موقت ارزیابی بالینی
                    </button>
                  </div>
                </div>

                {/* STEP B: Connect Patient with Vetted Local Dentist & Calculate Commission */}
                <div className="rounded-3xl border-2 border-teal-600/30 bg-white p-6 shadow-md space-y-5">
                  <div>
                    <span className="text-xs font-extrabold text-teal-600">
                      مرحله دوم — شبکه ارجاع و درآمدزایی از کلینیک همکار
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      انتخاب دندانپزشک معتمد در {CITY_LABELS[selectedSubmission.city]} و صدور کد معرفی‌نامه
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        انتخاب کلینیک / دندانپزشک همکار (اولویت با شهر {CITY_LABELS[selectedSubmission.city]}):
                      </label>
                      <select
                        value={selectedClinicId}
                        onChange={(e) => handleClinicSelectChange(e.target.value)}
                        className="w-full rounded-xl border-2 border-teal-600/40 bg-teal-50/30 px-4 py-3 text-sm font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                      >
                        {clinics
                          .filter((c) => c.active)
                          .sort((a, b) =>
                            a.city === selectedSubmission.city
                              ? -1
                              : b.city === selectedSubmission.city
                              ? 1
                              : 0
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              [{CITY_LABELS[c.city]}] {c.name} — {c.doctorName} (کمیسیون همکار:{' '}
                              {c.commissionModel === 'percentage'
                                ? `${toPersianDigits(c.defaultCommissionPercent)}٪ از درمان`
                                : formatToman(c.defaultFixedFeeToman)}
                              )
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        برآورد مبلغ طرح درمان بیمار در کلینیک (تومان):
                      </label>
                      <input
                        type="number"
                        step={500000}
                        value={expectedTreatmentAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setExpectedTreatmentAmount(val);
                          handleClinicSelectChange(selectedClinicId, val);
                        }}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900"
                      />
                      <span className="text-[11px] text-slate-500">
                        {formatToman(expectedTreatmentAmount)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        حق هماهنگی و معرفی دریافتی از کلینیک (تومان):
                      </label>
                      <input
                        type="number"
                        step={100000}
                        value={customCoordinationFee}
                        onChange={(e) => setCustomCoordinationFee(Number(e.target.value))}
                        className="w-full rounded-xl border border-emerald-400 bg-emerald-50/50 px-3.5 py-2.5 text-sm font-black text-emerald-950"
                      />
                      <span className="text-[11px] font-bold text-emerald-700">
                        سهم شما از کلینیک: {formatToman(customCoordinationFee)} (برای بیمار: رایگان)
                      </span>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleIssueReferralVoucher}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-teal-700 to-emerald-600 px-4 py-3 text-xs sm:text-sm font-black text-white shadow-md hover:from-teal-600 hover:to-emerald-500 transition cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>ثبت نهایی بررسی و صدور معرفی‌نامه</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* STEP C: Seamless Bale & WhatsApp Communication Hub */}
                <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-xl space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-bold text-teal-400">
                        مرحله سوم — ارتباط یک‌کلیکی در پیام‌رسان بله (Bale) و واتساپ (WhatsApp)
                      </span>
                      <h3 className="text-lg font-black mt-0.5">
                        ارسال نتیجه بررسی گرافی به بیمار و معرفی بیمار به کلینیک همکار
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMessageTarget('patient')}
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                          messageTarget === 'patient'
                            ? 'bg-teal-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        پیام به بیمار ({selectedSubmission.fullName})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessageTarget('clinic')}
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                          messageTarget === 'clinic'
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        پیام معرفی به کلینیک همکار
                      </button>
                    </div>
                  </div>

                  {/* Quick Message Templates */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400">قالب پیام آماده:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMessageText(
                          buildPatientReferralMessage(
                            selectedSubmission,
                            clinics.find((c) => c.id === selectedClinicId)
                          )
                        )
                      }
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-teal-300 hover:bg-slate-700 cursor-pointer"
                    >
                      ۱. نتیجه بررسی گرافی + معرفی‌نامه بیمار
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMessageText(
                          `سلام ${selectedSubmission.fullName} عزیز 🌷\nتصویر ارسالی شما در سامانه دندانپزشکی ${CITY_LABELS[selectedSubmission.city]} دریافت شد، اما کمی تار است یا نور فلاش روی طلق گرافی افتاده است.\nلطفاً طلق گرافی را روی صفحه سفید مانیتور یا مقابل نور پنجره روز (بدون فلاش) قرار داده و یک عکس واضح‌تر در همین پیام‌رسان بفرستید تا دقیق بررسی کنیم.`
                        )
                      }
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-amber-300 hover:bg-slate-700 cursor-pointer"
                    >
                      ۲. درخواست عکس واضح‌تر از گرافی OPG
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMessageText(buildClinicHandoffMessage(selectedSubmission))
                      }
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-sky-300 hover:bg-slate-700 cursor-pointer"
                    >
                      ۳. معرفی بیمار به دندانپزشک همکار
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={customMessageText}
                    onChange={(e) => setCustomMessageText(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs sm:text-sm leading-relaxed text-slate-100 focus:border-teal-400 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(customMessageText);
                        showToast('متن کامل پیام کپی شد!');
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
                    >
                      <Copy className="h-4 w-4 text-teal-400" />
                      <span>کپی متن پیام</span>
                    </button>

                    {messageTarget === 'patient' ? (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            copyAndOpenBale(
                              selectedSubmission.messengerId || selectedSubmission.phone,
                              customMessageText
                            )
                          }
                          className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-black text-white hover:bg-sky-500 transition cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                          <span>کپی پیام و ارسال در «بله» به بیمار</span>
                        </button>

                        <a
                          href={buildWhatsAppLink(selectedSubmission.phone, customMessageText)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-500 transition"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>ارسال مستقیم در «واتساپ» به بیمار</span>
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        {(() => {
                          const targetClinic = clinics.find((c) => c.id === selectedClinicId);
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  copyAndOpenBale(
                                    targetClinic?.baleId || targetClinic?.whatsappNumber || '',
                                    customMessageText
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-black text-white hover:bg-sky-500 transition cursor-pointer"
                              >
                                <Send className="h-4 w-4" />
                                <span>ارسال در «بله» به کلینیک همکار</span>
                              </button>
                              <a
                                href={buildWhatsAppLink(
                                  targetClinic?.whatsappNumber || COORDINATOR_WHATSAPP_NUMBER,
                                  customMessageText
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-500 transition"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>ارسال در «واتساپ» به کلینیک همکار</span>
                              </a>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                یک پرونده را از ستون سمت راست جهت بررسی گرافی انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PARTNER CLINICS NETWORK (MAHDASHT, KARAJ, PARDIS)              */}
      {/* ===================================================================== */}
      {activeMainTab === 'clinics' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                مدیریت شبکه دندانپزشکان معتمد و همکار (ماهدشت، کرج و پردیس)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                اضافه کردن مطب‌ها و کلینیک‌های طرف قرارداد و تعیین مدل کمیسیون/حق هماهنگی ارجاع بیمار
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddClinic((v) => !v)}
              className="flex items-center gap-2 rounded-2xl bg-teal-700 px-5 py-3 text-xs sm:text-sm font-black text-white hover:bg-teal-600 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>افزودن دندانپزشک / کلینیک همکار جدید</span>
            </button>
          </div>

          {showAddClinic && (
            <form
              onSubmit={handleCreateNewClinic}
              className="rounded-3xl border-2 border-teal-600 bg-white p-6 shadow-xl space-y-4"
            >
              <h3 className="text-base font-black text-slate-900">
                ثبت کلینیک یا مطب دندانپزشکی همکار جدید
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نام کلینیک یا مطب *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClinicName}
                    onChange={(e) => setNewClinicName(e.target.value)}
                    placeholder="مثلاً: کلینیک دندانپزشکی نور ماهدشت"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نام دندانپزشک مسئول *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    placeholder="مثلاً: دکتر رضا کریمی"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شهر (ماهدشت / کرج / پردیس)
                  </label>
                  <select
                    value={newClinicCity}
                    onChange={(e) => {
                      const c = e.target.value as CityRegion;
                      setNewClinicCity(c);
                      setNewClinicNeighborhood(CITY_NEIGHBORHOODS[c][0]);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="mahdasht">ماهدشت</option>
                    <option value="karaj">کرج</option>
                    <option value="pardis">پردیس</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    محدوده / محله
                  </label>
                  <select
                    value={newClinicNeighborhood}
                    onChange={(e) => setNewClinicNeighborhood(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {CITY_NEIGHBORHOODS[newClinicCity].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تلفن مطب / کلینیک
                  </label>
                  <input
                    type="text"
                    value={newClinicPhone}
                    onChange={(e) => setNewClinicPhone(e.target.value)}
                    placeholder="0263730..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شماره واتساپ هماهنگی
                  </label>
                  <input
                    type="text"
                    value={newClinicWhatsapp}
                    onChange={(e) => setNewClinicWhatsapp(e.target.value)}
                    placeholder="0912..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مدل تسویه حق هماهنگی با شما
                  </label>
                  <select
                    value={newClinicCommissionModel}
                    onChange={(e) =>
                      setNewClinicCommissionModel(e.target.value as 'percentage' | 'fixed')
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="percentage">درصدی از کل طرح درمان بیمار</option>
                    <option value="fixed">مبلغ ثابت به ازای هر بیمار ارجاعی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    درصد کمیسیون پیش‌فرض (٪)
                  </label>
                  <input
                    type="number"
                    value={newClinicPercent}
                    onChange={(e) => setNewClinicPercent(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حق هماهنگی ثابت (تومان)
                  </label>
                  <input
                    type="number"
                    step={50000}
                    value={newClinicFixedFee}
                    onChange={(e) => setNewClinicFixedFee(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نشانی دقیق پستی
                  </label>
                  <input
                    type="text"
                    value={newClinicAddress}
                    onChange={(e) => setNewClinicAddress(e.target.value)}
                    placeholder="خیابان، ساختمان پزشکان، طبقه..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    آیدی بله کلینیک / پزشک
                  </label>
                  <input
                    type="text"
                    value={newClinicBale}
                    onChange={(e) => setNewClinicBale(e.target.value)}
                    placeholder="مثلاً: dr_karimi_dental"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClinic(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 px-6 py-2 text-xs font-black text-white cursor-pointer"
                >
                  ذخیره کلینیک در شبکه همکاران
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {clinics.map((clinic) => {
              const clinicReferrals = referredSubmissions.filter(
                (s) => s.referral?.clinicId === clinic.id
              );
              return (
                <div
                  key={clinic.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-black text-teal-900">
                        {CITY_LABELS[clinic.city]} — {clinic.neighborhood}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
                        {clinic.commissionModel === 'percentage'
                          ? `کمیسیون توافقی: ${toPersianDigits(clinic.defaultCommissionPercent)}٪`
                          : `تعرفه ثابت معرفی: ${formatToman(clinic.defaultFixedFeeToman)}`}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900">{clinic.name}</h3>
                    <p className="text-xs font-bold text-slate-600">
                      <ToothIcon className="inline h-3.5 w-3.5 text-teal-600 ml-1" />
                      {clinic.doctorName} (نظام پزشکی: {clinic.medicalCouncilCode})
                    </p>
                    <p className="text-xs text-slate-500">
                      <MapPin className="inline h-3.5 w-3.5 text-slate-400 ml-1" />
                      {clinic.address}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                    <span className="font-bold text-teal-800">
                      تعداد بیماران ارجاع‌شده: {toPersianDigits(clinicReferrals.length)} نفر
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={buildWhatsAppLink(
                          clinic.whatsappNumber,
                          `سلام وقت بخیر خدمت همکاران محترم در ${clinic.name}`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        واتساپ کلینیک
                      </a>
                      <button
                        type="button"
                        onClick={() => onDeleteClinic(clinic.id)}
                        className="rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        title="حذف کلینیک"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: MONETIZATION & PARTNER CLINIC BILLING LEDGER                   */}
      {/* ===================================================================== */}
      {activeMainTab === 'billing' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-teal-600">
                  مدل درآمدی پلتفرم: رایگان برای بیمار — دریافت حق هماهنگی و معرفی از کلینیک‌های همکار
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  دفتر کل حسابداری کمیسیون و تسویه‌حساب دندانپزشکان همکار
                </h2>
              </div>
            </div>

            {referredSubmissions.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                هنوز معرفی‌نامه‌ای برای بیماران صادر نشده است. از تب «میز کار بررسی گرافی» یک بیمار را
                به کلینیک معرفی کنید.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="p-3 font-extrabold">کد معرفی‌نامه / بیمار</th>
                      <th className="p-3 font-extrabold">کلینیک پذیرنده (شهر)</th>
                      <th className="p-3 font-extrabold">مبلغ درمان بیمار (تومان)</th>
                      <th className="p-3 font-extrabold">کمیسیون / حق هماهنگی شما</th>
                      <th className="p-3 font-extrabold">وضعیت مالی کلینیک</th>
                      <th className="p-3 font-extrabold">عملیات تسویه و پیگیری</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {referredSubmissions.map((sub) => {
                      const ref = sub.referral!;
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80">
                          <td className="p-3">
                            <div className="font-black text-slate-900">{sub.fullName}</div>
                            <div className="font-mono text-xs text-teal-700">{ref.voucherCode}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{ref.clinicName}</div>
                            <div className="text-xs text-slate-500">
                              {CITY_LABELS[ref.clinicCity]} • {ref.doctorName}
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              step={500000}
                              value={ref.actualTreatmentAmountToman}
                              onChange={(e) =>
                                handleUpdateBillingStatus(
                                  sub,
                                  ref.billingStatus,
                                  Number(e.target.value)
                                )
                              }
                              className="w-36 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-900"
                            />
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {formatToman(ref.actualTreatmentAmountToman)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-black text-emerald-800">
                              {formatToman(ref.coordinationFeeToman)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {ref.commissionModel === 'percentage'
                                ? `${toPersianDigits(ref.commissionPercent)}٪ از مبلغ درمان`
                                : 'تعرفه ثابت معرفی'}
                            </div>
                          </td>
                          <td className="p-3">
                            {ref.billingStatus === 'pending_visit' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                <Clock className="h-3.5 w-3.5" />
                                در انتظار مراجعه بیمار
                              </span>
                            )}
                            {ref.billingStatus === 'visited_unpaid' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                بیمار مراجعه کرده — بدهکار
                              </span>
                            )}
                            {ref.billingStatus === 'settled' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                تسویه شده توسط کلینیک
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateBillingStatus(sub, 'visited_unpaid')
                                }
                                className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                              >
                                ثبت مراجعه بیمار
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateBillingStatus(sub, 'settled')}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 cursor-pointer"
                              >
                                ثبت تسویه حساب
                              </button>
                              <a
                                href={buildWhatsAppLink(
                                  ref.clinicWhatsapp,
                                  `سلام وقت بخیر خدمت مدیریت محترم ${ref.clinicName} 🌷\nجهت هماهنگی تسویه حساب معرفی بیمار «${sub.fullName}» (کد معرفی‌نامه: ${ref.voucherCode}) به مبلغ حق هماهنگی ${formatToman(ref.coordinationFeeToman)} پیام ارسال شد.`
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                              >
                                صورتحساب واتساپ
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: MEDIA CHANNELS & UTM CAMPAIGN GENERATOR (PILLAR 1)             */}
      {/* ===================================================================== */}
      {activeMainTab === 'campaigns' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md space-y-6">
          <div>
            <span className="text-xs font-extrabold text-teal-600">
              گام اول جذب بیمار — کانال‌های بله، گروه‌های محلی و پیج‌های اینستاگرام ماهدشت، کرج و پردیس
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              ابزار تولید لینک اختصاصی و متن تبلیغاتی آماده انتشار در رسانه‌ها
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              با انتشار لینک و متن زیر در کانال‌های محلی ماهدشت، کرج و پردیس، بیماران مستقیماً وارد فرم
              همان شهر شده و منبع ورودی آن‌ها در پنل شما ثبت می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شهر هدف کمپین:
              </label>
              <select
                value={campaignCity}
                onChange={(e) => {
                  const c = e.target.value as CityRegion;
                  setCampaignCity(c);
                  setCampaignChannel(`bale_${c}`);
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
              >
                <option value="mahdasht">ماهدشت و حومه</option>
                <option value="karaj">کرج (مرکز، عظیمیه، گوهردشت، فردیس)</option>
                <option value="pardis">پردیس، بومهن و رودهن</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رسانه / کانال انتشار:
              </label>
              <select
                value={campaignChannel}
                onChange={(e) => setCampaignChannel(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
              >
                <option value={`bale_${campaignCity}`}>
                  کانال‌ها و گروه‌های پیام‌رسان بله ({CITY_LABELS[campaignCity]})
                </option>
                <option value="instagram">پیج‌های محلی اینستاگرام</option>
                <option value="whatsapp_group">گروه‌های واتساپ محلی</option>
              </select>
            </div>
          </div>

          {(() => {
            const origin =
              typeof window !== 'undefined'
                ? window.location.origin
                : 'https://dentalyar.web.app';
            const campaignUrl = `${origin}/?city=${campaignCity}&utm_source=${campaignChannel}`;
            const adCopy = `🦷 *بررسی تخصصی و رایگان عکس رادیولوژی دندان (OPG) ویژه ساکنین محترم ${CITY_LABELS[campaignCity]}*

❓ آیا عکس رادیولوژی (OPG) گرفته‌اید و می‌خواهید قبل از مراجعه حضوری بدانید کدام دندان واقعاً نیاز به عصب‌کشی، ایمپلنت یا ترمیم دارد و هزینه واقعی آن چقدر است؟
❓ آیا به دنبال یک دندانپزشک متعهد، منصف و امتحان‌پس‌داده در *${CITY_LABELS[campaignCity]}* هستید؟

✅ کافیست عکس گرافی (OPG) یا عکس دندان خود را در سامانه زیر بارگذاری کنید:
۱. گرافی شما شخصاً و با دقت بررسی می‌شود.
۲. طرح درمان واقعی و تخمین هزینه در پیام‌رسان *بله* یا *واتساپ* برایتان ارسال می‌گردد.
۳. معرفی‌نامه رسمی با اولویت نوبت‌دهی برای بهترین دندانپزشکان معتمد *${CITY_LABELS[campaignCity]}* دریافت می‌کنید.
🎁 *این خدمت برای بیماران کاملاً رایگان است!*

👇 *لینک ارسال عکس گرافی و دریافت مشاوره رایگان:*
${campaignUrl}`;

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl bg-slate-100 p-4 border border-slate-300">
                  <code className="flex-1 text-xs sm:text-sm font-mono font-bold text-teal-900 dir-ltr text-left break-all">
                    {campaignUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(campaignUrl);
                      showToast('لینک کمپین کپی شد!');
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-black text-white hover:bg-teal-600 cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    <span>کپی لینک اختصاصی</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    متن آماده تبلیغاتی جهت انتشار در کانال بله، واتساپ یا اینستاگرام {CITY_LABELS[campaignCity]}:
                  </label>
                  <textarea
                    rows={10}
                    readOnly
                    value={adCopy}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 text-xs sm:text-sm leading-relaxed text-slate-800"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(adCopy);
                        showToast('متن تبلیغاتی کامل کپی شد!');
                      }}
                      className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <Copy className="h-4 w-4 text-teal-400" />
                      <span>کپی متن تبلیغاتی آماده انتشار</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
