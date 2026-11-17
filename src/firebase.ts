import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { PartnerClinic, PatientSubmission } from './types';
import { INITIAL_PARTNER_CLINICS, INITIAL_SAMPLE_SUBMISSIONS } from './data/seedData';

const firebaseConfig = {
  projectId: 'mahdasht-dental-arvin',
  appId: '1:841244469455:web:3d68ae081d2dfaa5ffefba',
  storageBucket: 'mahdasht-dental-arvin.firebasestorage.app',
  apiKey: 'AIzaSyAx56xEkGC-42KxW8kS2oxT1L_6hSku8ww',
  authDomain: 'mahdasht-dental-arvin.firebaseapp.com',
  messagingSenderId: '841244469455',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const SUBMISSIONS_COLLECTION = 'submissions';
const CLINICS_COLLECTION = 'clinics';

const LOCAL_SUBMISSIONS_KEY = 'mahdasht_dental_submissions_v1';
const LOCAL_CLINICS_KEY = 'mahdasht_dental_clinics_v1';

export function getLocalSubmissions(): PatientSubmission[] {
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return INITIAL_SAMPLE_SUBMISSIONS;
}

export function setLocalSubmissions(items: PatientSubmission[]) {
  try {
    localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function getLocalClinics(): PartnerClinic[] {
  try {
    const raw = localStorage.getItem(LOCAL_CLINICS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return INITIAL_PARTNER_CLINICS;
}

export function setLocalClinics(items: PartnerClinic[]) {
  try {
    localStorage.setItem(LOCAL_CLINICS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

/**
 * Ensures initial vetted clinics and sample submissions exist in Firestore on first launch
 */
export async function ensureInitialDataSeeded(): Promise<void> {
  try {
    const clinicsSnap = await getDocs(collection(db, CLINICS_COLLECTION));
    if (clinicsSnap.empty) {
      for (const clinic of INITIAL_PARTNER_CLINICS) {
        await setDoc(doc(db, CLINICS_COLLECTION, clinic.id), clinic);
      }
    }
    const subsSnap = await getDocs(collection(db, SUBMISSIONS_COLLECTION));
    if (subsSnap.empty) {
      for (const sub of INITIAL_SAMPLE_SUBMISSIONS) {
        await setDoc(doc(db, SUBMISSIONS_COLLECTION, sub.id), sub);
      }
    }
  } catch (err) {
    console.warn('Firestore seed skipped or offline mode active:', err);
  }
}

export function subscribeToSubmissions(
  onUpdate: (submissions: PatientSubmission[], isCloudSynced: boolean) => void
) {
  return onSnapshot(
    collection(db, SUBMISSIONS_COLLECTION),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(getLocalSubmissions(), true);
        return;
      }
      const list: PatientSubmission[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PatientSubmission);
      });
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLocalSubmissions(list);
      onUpdate(list, true);
    },
    (err) => {
      console.warn('Firestore submissions listener fallback to local:', err);
      onUpdate(getLocalSubmissions(), false);
    }
  );
}

export function subscribeToClinics(
  onUpdate: (clinics: PartnerClinic[], isCloudSynced: boolean) => void
) {
  return onSnapshot(
    collection(db, CLINICS_COLLECTION),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(getLocalClinics(), true);
        return;
      }
      const list: PartnerClinic[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PartnerClinic);
      });
      setLocalClinics(list);
      onUpdate(list, true);
    },
    (err) => {
      console.warn('Firestore clinics listener fallback to local:', err);
      onUpdate(getLocalClinics(), false);
    }
  );
}

export async function saveSubmissionToCloud(submission: PatientSubmission): Promise<void> {
  // Update local cache immediately for instant UI responsiveness
  const current = getLocalSubmissions();
  const idx = current.findIndex((s) => s.id === submission.id);
  if (idx >= 0) {
    current[idx] = submission;
  } else {
    current.unshift(submission);
  }
  setLocalSubmissions(current);

  // Persist to Firebase Firestore
  const cleanPayload = JSON.parse(JSON.stringify(submission));
  await setDoc(doc(db, SUBMISSIONS_COLLECTION, submission.id), cleanPayload);
}

export async function deleteSubmissionFromCloud(id: string): Promise<void> {
  const current = getLocalSubmissions().filter((s) => s.id !== id);
  setLocalSubmissions(current);
  await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, id));
}

export async function saveClinicToCloud(clinic: PartnerClinic): Promise<void> {
  const current = getLocalClinics();
  const idx = current.findIndex((c) => c.id === clinic.id);
  if (idx >= 0) {
    current[idx] = clinic;
  } else {
    current.push(clinic);
  }
  setLocalClinics(current);

  const cleanPayload = JSON.parse(JSON.stringify(clinic));
  await setDoc(doc(db, CLINICS_COLLECTION, clinic.id), cleanPayload);
}

export async function deleteClinicFromCloud(id: string): Promise<void> {
  const current = getLocalClinics().filter((c) => c.id !== id);
  setLocalClinics(current);
  await deleteDoc(doc(db, CLINICS_COLLECTION, id));
}
