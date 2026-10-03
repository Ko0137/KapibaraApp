import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (using specific databaseId if provided in config)
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Returns a persistent user ID based on Telegram ID, Firebase Auth UID, or unique device ID.
 */
export function getPersistentUserId(): string {
  try {
    // @ts-ignore
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (tgId) {
      return `tg_${tgId}`;
    }
  } catch {}

  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  try {
    let localUid = localStorage.getItem('megatap_device_uid');
    if (!localUid) {
      localUid = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('megatap_device_uid', localUid);
    }
    return localUid;
  } catch {
    return 'guest_' + Date.now();
  }
}

/**
 * Ensures user is authenticated via Firebase Anonymous Auth or fallback persistent identity.
 */
export async function ensureAuthenticated(): Promise<{ uid: string }> {
  if (auth.currentUser) {
    return { uid: auth.currentUser.uid };
  }

  try {
    const cred = await signInAnonymously(auth);
    if (cred.user) {
      return { uid: cred.user.uid };
    }
  } catch (err: any) {
    // Non-blocking fallback to persistent device / Telegram ID
  }

  return { uid: getPersistentUserId() };
}

// Validation connection helper as required by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or unreachable');
      return false;
    }
    return true;
  }
}
