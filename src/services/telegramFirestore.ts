import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, ensureAuthenticated } from './firebase';
import { GameSaveData } from '../types/game';

// Recursive function to remove undefined values
const removeUndefined = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, removeUndefined(v)])
  );
};

export const getTelegramUserId = (): string => {
  try {
    // @ts-ignore
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || 'debug_user_123';
  } catch {
    return 'debug_user_123';
  }
};

export const loadUserProgress = async (): Promise<GameSaveData | null> => {
  try {
    const user = await ensureAuthenticated();
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as GameSaveData;
    }
  } catch (error) {
    console.error('Error loading progress from Firestore:', error);
  }
  return null;
};

export const saveUserProgress = async (data: GameSaveData): Promise<void> => {
  try {
    const user = await ensureAuthenticated();
    const docRef = doc(db, 'users', user.uid);
    
    // Deeply sanitize data: remove undefined values
    const sanitizedData = removeUndefined({ ...data, lastSavedTimestamp: Date.now() });
    
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error('Error saving progress to Firestore:', error);
  }
};
