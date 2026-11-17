import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Cloud,
  MapPin,
  MessageCircle,
  Lock,
  Unlock,
  Download,
  X,
  Share,
  PlusSquare,
} from 'lucide-react';
import { PartnerClinic, PatientSubmission } from './types';
import {
  deleteClinicFromCloud,
  deleteSubmissionFromCloud,
  ensureInitialDataSeeded,
  getLocalClinics,
  getLocalSubmissions,
  saveClinicToCloud,
  saveSubmissionToCloud,
  subscribeToClinics,
  subscribeToSubmissions,
} from './firebase';
import { PatientPortal } from './components/PatientPortal';
import { AdminDashboard } from './components/AdminDashboard';
import {
  COORDINATOR_BALE_ID,
  COORDINATOR_WHATSAPP_NUMBER,
  buildBaleLink,
  buildWhatsAppLink,
  toEnglishDigits,
  toPersianDigits,
} from './utils/persian';
import { ToothIcon } from './components/ToothIcon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function App() {
  const [viewMode, setViewMode] = useState<'patient' | 'admin'>('patient');
  const [submissions, setSubmissions] = useState<PatientSubmission[]>(() =>
    getLocalSubmissions()
  );
  const [clinics, setClinics] = useState<PartnerClinic[]>(() => getLocalClinics());
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    ensureInitialDataSeeded();
    const unsubSubmissions = subscribeToSubmissions((list, synced) => {
      setSubmissions(list);
      setIsCloudSynced(synced);
    });
    const unsubClinics = subscribeToClinics((list) => {
      setClinics(list);
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubSubmissions();
      unsubClinics();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const newQueueCount = submissions.filter((s) => s.status === 'new').length;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPin = toEnglishDigits(pinInput.trim());
    if (normalizedPin === '1374') {
      setAdminUnlocked(true);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('کد امنیتی واردشده معتبر نیست.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Top Dark Regional Accent Bar (Initial Theme) */}
      <div className="no-print bg-slate-900 text-slate-200 border-b border-slate-800 px-4 py-2 text-xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 font-bold text-amber-300">
              <MapPin className="h-3.5 w-3.5" />
              ماهدشت • کرج • پردیس
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-300">
              بررسی رایگان گرافی و معرفی دندانپزشک معتمد
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden md:flex items-center gap-1 text-[11px] text-teal-300">
              <Cloud className="h-3.5 w-3.5" />
              {isCloudSynced ? 'آنلاین' : 'آفلاین'}
            </span>
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1 rounded-lg bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 hover:bg-amber-400/30 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>نصب اپ</span>
            </button>
            <a
              href={buildBaleLink(COORDINATOR_BALE_ID)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-sky-600/30 border border-sky-500/40 px-2.5 py-0.5 text-[11px] font-bold text-sky-200 hover:bg-sky-600/50"
            >
              <MessageCircle className="h-3 w-3" />
              <span>بله</span>
            </a>
            <a
              href={buildWhatsAppLink(
                COORDINATOR_WHATSAPP_NUMBER,
                'سلام، جهت بررسی عکس رادیولوژی دندان و معرفی دندانپزشک معتمد پیام می‌دهم.'
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-600/50"
            >
              <MessageCircle className="h-3 w-3" />
              <span>واتساپ</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Navbar */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo with Tooth Icon */}
          <div
            onClick={() => setViewMode('patient')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-bl from-teal-700 to-emerald-600 text-white shadow-md">
              <ToothIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  دنتال‌یار
                </span>
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-extrabold text-teal-800">
                  ماهدشت • کرج • پردیس
                </span>
              </div>
              <p className="text-xs text-slate-500">
                بررسی تخصصی گرافی و ارجاع دندانپزشکی
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('patient')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                viewMode === 'patient'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-4 w-4 text-teal-600" />
              <span>پورتال بیمار</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>پنل ارزیاب</span>
              {newQueueCount > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-black text-white">
                  {toPersianDigits(newQueueCount)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6">
        {viewMode === 'patient' ? (
          <PatientPortal
            submissions={submissions}
            clinics={clinics}
            onCreateSubmission={saveSubmissionToCloud}
          />
        ) : !adminUnlocked ? (
          <div className="mx-auto max-w-md my-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 shadow-md">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">ورود به پنل ارزیاب</h2>
            <p className="text-xs text-slate-500">کد امنیتی مدیریت را وارد نمایید</p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest focus:border-teal-600 focus:outline-none"
              />
              {pinError && <p className="text-xs font-bold text-rose-600">{pinError}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-l from-teal-700 to-emerald-600 py-3 text-sm font-black text-white shadow-md hover:from-teal-600 hover:to-emerald-500 cursor-pointer"
              >
                ورود به پنل
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAdminUnlocked(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>قفل پنل مدیریت</span>
              </button>
            </div>
            <AdminDashboard
              submissions={submissions}
              clinics={clinics}
              onSaveSubmission={saveSubmissionToCloud}
              onDeleteSubmission={deleteSubmissionFromCloud}
              onSaveClinic={saveClinicToCloud}
              onDeleteClinic={deleteClinicFromCloud}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ToothIcon className="h-4 w-4 text-teal-600" />
            <strong className="text-slate-800">دنتال‌یار</strong> — ماهدشت، کرج و پردیس
          </div>
          <div>خدمات بررسی گرافی و معرفی دندانپزشک برای بیماران کاملاً رایگان است.</div>
        </div>
      </footer>

      {/* Install PWA Instructions Modal */}
      {showInstallModal && (
        <div
          onClick={() => setShowInstallModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-bl from-teal-700 to-emerald-600 text-white">
                  <ToothIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">نصب اپ دنتال‌یار</h3>
                  <p className="text-xs text-slate-500">افزودن به صفحه اصلی گوشی</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-3 rounded-2xl bg-teal-50/70 p-3.5 border border-teal-200">
                <Share className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 mb-0.5">آیفون (Safari):</strong>
                  <span>
                    دکمه <strong>Share</strong> و سپس <strong>Add to Home Screen</strong> را بزنید.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-teal-50/70 p-3.5 border border-teal-200">
                <PlusSquare className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 mb-0.5">اندروید (Chrome):</strong>
                  <span>
                    منوی سه‌نقطه مرورگر و سپس <strong>Install App</strong> را بزنید.
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full rounded-xl bg-gradient-to-l from-teal-700 to-emerald-600 py-3 text-xs font-black text-white shadow-md cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
