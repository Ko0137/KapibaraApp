import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GameSaveData } from '../types/game';

export const getTelegramUserId = (): string => {
  try {
    // @ts-ignore
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || 'debug_user_123';
  } catch {
    return 'debug_user_123';
  }
};

export const loadUserProgress = async (userId: string): Promise<GameSaveData | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as GameSaveData;
    }
  } catch (error) {
    console.error('Error loading progress from Firestore:', error);
  }
  return null;
};

export const saveUserProgress = async (userId: string, data: GameSaveData): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    
    // Sanitize data: remove undefined values
    const sanitizedData = Object.fromEntries(
      Object.entries({ ...data, lastSavedTimestamp: Date.now() }).filter(([_, v]) => v !== undefined)
    );
    
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error('Error saving progress to Firestore:', error);
  }
};
