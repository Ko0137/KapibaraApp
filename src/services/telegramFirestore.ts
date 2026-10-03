import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, ensureAuthenticated, auth } from './firebase';
import { GameSaveData } from '../types/game';

// Recursive function to remove undefined values for Firestore JSON compliance
const removeUndefined = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, removeUndefined(v)])
  );
};

export const getTelegramUserId = (): string | null => {
  try {
    // @ts-ignore
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    return tgId ? tgId.toString() : null;
  } catch {
    return null;
  }
};

export interface AutoSaveStatus {
  isSaving: boolean;
  lastSavedAt: number | null;
  success: boolean;
  error?: string;
}

let lastSavePromise: Promise<boolean> | null = null;

export const loadUserProgress = async (): Promise<GameSaveData | null> => {
  try {
    const user = await ensureAuthenticated();
    if (!user) {
      console.warn('No authenticated user for Firestore load');
      return null;
    }

    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as GameSaveData;
      return data;
    }
  } catch (error) {
    console.error('Error loading progress from Firestore:', error);
  }
  return null;
};

export const saveUserProgress = async (
  data: GameSaveData
): Promise<{ success: boolean; timestamp: number; error?: string }> => {
  try {
    const user = await ensureAuthenticated();
    if (!user) {
      return { success: false, timestamp: Date.now(), error: 'Not authenticated' };
    }

    const docRef = doc(db, 'users', user.uid);
    const now = Date.now();

    // Deeply sanitize data: remove undefined values
    const sanitizedData = removeUndefined({
      ...data,
      lastSavedTimestamp: now,
      cloudSyncVersion: 2,
    });

    await setDoc(docRef, sanitizedData, { merge: true });

    return { success: true, timestamp: now };
  } catch (error: any) {
    console.error('Error saving progress to Firestore:', error);
    return { success: false, timestamp: Date.now(), error: error?.message || 'Cloud save failed' };
  }
};
