import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Ensure local persistence is active so login session survives page refreshes & tab closes
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Failed to set browserLocalPersistence:', err);
});

// Initialize Firestore DB with persistent offline IndexedDB cache across multiple tabs
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, (firebaseConfig as any).firestoreDatabaseId);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper function to handle Google Sign-In
// Uses signInWithPopup directly on all devices (mobile & desktop) as it preserves session state in-memory
// without relying on cross-domain redirect storage that gets blocked on GitHub Pages or strict privacy browsers.
export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.warn('signInWithPopup error:', error);
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Popup blocked, attempting redirect fallback...');
      return await signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
};

export const logout = () => signOut(auth);

export { onAuthStateChanged, signInWithRedirect, getRedirectResult };

