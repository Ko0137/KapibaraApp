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

let currentUser: User | null = null;
let authReadyPromise: Promise<User> | null = null;

export function ensureAuthenticated(): Promise<User> {
  if (currentUser) return Promise.resolve(currentUser);
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          unsubscribe();
          resolve(cred.user);
        } catch (err) {
          console.warn('Anonymous auth failed:', err);
          unsubscribe();
          reject(err);
        }
      }
    });
  });

  return authReadyPromise;
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
    // Document might just not exist, which is fine
    return true;
  }
}
