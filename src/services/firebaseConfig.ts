import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const DEFAULT_RTDB_URL = 'https://signify-asl-db-default-rtdb.asia-southeast1.firebasedatabase.app';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL?: string;
}

const LOCAL_STORAGE_KEY = 'signify_firebase_config';

// Default / fallback Firebase config (Can be populated from Vite env or admin UI)
export function getSavedFirebaseConfig(): FirebaseConfigParams {
  const envConfig: FirebaseConfigParams = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'signify-asl-db',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || DEFAULT_RTDB_URL,
  };

  try {
    const custom = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      return {
        ...envConfig,
        ...parsed,
        databaseURL: parsed.databaseURL || envConfig.databaseURL || DEFAULT_RTDB_URL,
      };
    }
  } catch {
    // Ignore storage parse issues
  }

  return envConfig;
}

export function saveFirebaseConfig(config: FirebaseConfigParams): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

export function initFirebase(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  isConfigured: boolean;
} {
  const config = getSavedFirebaseConfig();
  const isConfigured = Boolean(config.apiKey && config.projectId);

  if (!isConfigured) {
    return {
      app: null,
      auth: null,
      db: null,
      isConfigured: false,
    };
  }

  try {
    if (!firebaseAppInstance) {
      firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp(config);
      firebaseAuthInstance = getAuth(firebaseAppInstance);
      firestoreInstance = getFirestore(firebaseAppInstance);
    }
    return {
      app: firebaseAppInstance,
      auth: firebaseAuthInstance,
      db: firestoreInstance,
      isConfigured: true,
    };
  } catch (error) {
    console.warn('Firebase initialization note (operating in offline-first mode):', error);
    return {
      app: null,
      auth: null,
      db: null,
      isConfigured: false,
    };
  }
}
