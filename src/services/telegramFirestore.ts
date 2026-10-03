import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, ensureAuthenticated, getPersistentUserId } from './firebase';
import { GameSaveData } from '../types/game';
import { parseAndMergeSave } from './cloudSave';

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

export const loadUserProgress = async (): Promise<GameSaveData | null> => {
  try {
    await ensureAuthenticated();
    const userId = getPersistentUserId();
    if (!userId) return null;

    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (typeof data.saveData === 'string') {
        const parsed = parseAndMergeSave(data.saveData);
        if (parsed) return parsed;
      }
      return parseAndMergeSave(JSON.stringify(data));
    }
  } catch (error) {
    console.warn('Firestore load progress warning:', error);
  }
  return null;
};

export const saveUserProgress = async (
  data: GameSaveData
): Promise<{ success: boolean; timestamp: number; error?: string }> => {
  try {
    await ensureAuthenticated();
    const userId = getPersistentUserId();
    const now = Date.now();

    const docRef = doc(db, 'users', userId);

    const fullSaveJson = JSON.stringify({
      ...data,
      userId,
      lastSavedTimestamp: now,
    });

    const sanitizedData = removeUndefined({
      ...data,
      userId,
      saveData: fullSaveJson, // Explicit JSON string backup guarantees zero perks loss
      perks: data.perks || {},
      perkPoints: data.perkPoints || 0,
      respecTokens: data.respecTokens ?? 1,
      lastSavedTimestamp: now,
      cloudSyncVersion: 4,
    });

    await setDoc(docRef, sanitizedData, { merge: true });

    return { success: true, timestamp: now };
  } catch (error: any) {
    console.warn('Firestore save progress warning:', error);
    return { success: false, timestamp: Date.now(), error: error?.message || 'Cloud save error' };
  }
};
