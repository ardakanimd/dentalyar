export type CityRegion = 'mahdasht' | 'karaj' | 'pardis';

export type PreferredMessenger = 'bale' | 'whatsapp' | 'phone';

export type SubmissionStatus =
  | 'new'         // جدید - در انتظار بررسی گرافی
  | 'assessed'    // بررسی شده - آماده انتخاب دندانپزشک
  | 'referred'    // ارجاع شده به کلینیک منتخب
  | 'completed';  // مراجعه نهایی و تکمیل درمان

export type UrgencyLevel = 'emergency' | 'high' | 'normal';

export type BillingStatus =
  | 'pending_visit'   // در انتظار مراجعه بیمار به کلینیک
  | 'visited_unpaid'  // بیمار مراجعه کرده - در انتظار تسویه حق هماهنگی کلینیک
  | 'settled';        // تسویه شده توسط کلینیک همکار

export interface UploadedDentalImage {
  id: string;
  category: 'opg' | 'periapical' | 'intraoral';
  label: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface VisualAssessment {
  reviewedAt: string;
  reviewerName: string;
  affectedTeeth: string[];
  radiographicFindings: string;
  recommendedTreatment: string;
  patientSummaryNote: string;
  clinicPrivateNote: string;
  urgency: UrgencyLevel;
  estimatedCostMinToman: number;
  estimatedCostMaxToman: number;
}

export interface ReferralDetails {
  voucherCode: string;
  clinicId: string;
  clinicName: string;
  doctorName: string;
  clinicCity: CityRegion;
  clinicNeighborhood: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicWhatsapp: string;
  clinicBaleId: string;
  referredAt: string;
  commissionModel: 'fixed' | 'percentage';
  commissionPercent: number;
  coordinationFeeToman: number;
  actualTreatmentAmountToman: number;
  billingStatus: BillingStatus;
  settledAt?: string;
}

export interface PatientSubmission {
  id: string;
  trackingCode: string;
  createdAt: string;
  fullName: string;
  phone: string;
  age?: string;
  city: CityRegion;
  neighborhood: string;
  preferredMessenger: PreferredMessenger;
  messengerId: string; // شماره یا آیدی بله/واتساپ
  chiefComplaintCategories: string[];
  painLevel: number; // 1 to 10
  painDuration: string;
  jawRegion: string; // مثلاً فک پایین سمت راست
  medicalHistory: string;
  patientDescription: string;
  sourceChannel: string; // مثلاً کانال بله ماهدشت، اینستاگرام کرج، جستجوی گوگل
  status: SubmissionStatus;
  images: UploadedDentalImage[];
  assessment?: VisualAssessment;
  referral?: ReferralDetails;
}

export interface PartnerClinic {
  id: string;
  name: string;
  doctorName: string;
  medicalCouncilCode: string;
  city: CityRegion;
  neighborhood: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  baleId: string;
  specialties: string[];
  commissionModel: 'fixed' | 'percentage';
  defaultCommissionPercent: number;
  defaultFixedFeeToman: number;
  rating: number;
  verifiedNote: string;
  workingHours: string;
  active: boolean;
}
