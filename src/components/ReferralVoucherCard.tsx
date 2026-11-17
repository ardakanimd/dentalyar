import React, { useState } from 'react';
import {
  CheckCircle2,
  Printer,
  Copy,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { PatientSubmission } from '../types';
import {
  CITY_LABELS,
  COORDINATOR_BALE_ID,
  COORDINATOR_WHATSAPP_NUMBER,
  URGENCY_LABELS,
  buildBaleLink,
  buildPatientReferralMessage,
  buildWhatsAppLink,
  formatToman,
  toPersianDigits,
} from '../utils/persian';
import { ToothIcon } from './ToothIcon';

interface ReferralVoucherCardProps {
  submission: PatientSubmission;
  coordinatorPhone?: string;
  coordinatorBaleId?: string;
}

export const ReferralVoucherCard: React.FC<ReferralVoucherCardProps> = ({
  submission,
  coordinatorPhone = COORDINATOR_WHATSAPP_NUMBER,
  coordinatorBaleId = COORDINATOR_BALE_ID,
}) => {
  const [copied, setCopied] = useState(false);
  const { assessment, referral } = submission;

  const handleCopyText = () => {
    const text = buildPatientReferralMessage(submission);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-3xl border-2 border-teal-600/30 bg-white shadow-xl overflow-hidden">
      {/* Rich Gradient Header Banner (Initial Theme) */}
      <div className="bg-gradient-to-l from-teal-800 via-teal-700 to-emerald-700 px-6 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25">
              <ToothIcon className="h-6 w-6 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                معرفی‌نامه رسمی و نتیجه بررسی گرافی
              </h3>
              <p className="text-xs text-teal-100 mt-0.5">
                {submission.fullName} • {CITY_LABELS[submission.city]} (رایگان برای بیمار)
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm border border-white/20">
            <div className="text-[11px] text-teal-100">کد معرفی‌نامه</div>
            <div className="font-mono text-base font-black tracking-wider text-amber-300">
              {referral?.voucherCode || submission.trackingCode}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {assessment ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-teal-950">نتیجه بررسی گرافی</span>
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-bold ${
                  URGENCY_LABELS[assessment.urgency].badgeClass
                }`}
              >
                {URGENCY_LABELS[assessment.urgency].label}
              </span>
            </div>

            {assessment.affectedTeeth.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assessment.affectedTeeth.map((tooth) => (
                  <span
                    key={tooth}
                    className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-200"
                  >
                    🦷 {tooth}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm leading-relaxed text-slate-800">
              {assessment.radiographicFindings}
            </p>

            <div className="pt-2 border-t border-teal-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500">درمان پیشنهادی: </span>
                <strong className="text-teal-900">{assessment.recommendedTreatment}</strong>
              </div>
              {assessment.estimatedCostMinToman > 0 && (
                <div>
                  <span className="text-slate-500">حدود هزینه: </span>
                  <strong className="text-slate-900">
                    {formatToman(assessment.estimatedCostMinToman)} تا{' '}
                    {formatToman(assessment.estimatedCostMaxToman)}
                  </strong>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm font-bold text-amber-900">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>گرافی شما در صف بررسی است و نتیجه در واتساپ یا بله ارسال می‌شود.</span>
          </div>
        )}

        {/* Matched Vetted Clinic */}
        {referral && (
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-bl from-emerald-50/70 via-white to-teal-50/40 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  کلینیک منتخب
                </span>
                <h4 className="text-base font-black text-slate-900">
                  {referral.clinicName} ({referral.doctorName})
                </h4>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                کد اولویت: {referral.voucherCode}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-teal-600" />
                {referral.clinicAddress}
              </span>
              <a
                href={`tel:${referral.clinicPhone}`}
                className="flex items-center gap-1 font-bold text-teal-700 hover:underline"
              >
                <Phone className="h-4 w-4" />
                {toPersianDigits(referral.clinicPhone)}
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>چاپ معرفی‌نامه</span>
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Copy className="h-4 w-4 text-teal-600" />
              <span>{copied ? 'کپی شد!' : 'کپی متن'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={buildWhatsAppLink(
                coordinatorPhone,
                `سلام، کد پیگیری پرونده من ${submission.trackingCode} (${submission.fullName}) است.`
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
            >
              <MessageCircle className="h-4 w-4" />
              <span>پیگیری در واتساپ</span>
            </a>
            <a
              href={buildBaleLink(coordinatorBaleId)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition"
            >
              <MessageCircle className="h-4 w-4" />
              <span>بله</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
