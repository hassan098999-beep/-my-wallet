import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore DB
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, (firebaseConfig as any).firestoreDatabaseId);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper function to handle Google Sign-In (with popup and mobile redirect fallback)
export const signInWithGoogle = async () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    try {
      return await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.warn('signInWithRedirect failed, trying popup fallback:', err);
      return await signInWithPopup(auth, googleProvider);
    }
  }

  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      console.warn('Popup blocked/closed, attempting redirect...');
      return await signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
};

export const logout = () => signOut(auth);

export { onAuthStateChanged, signInWithRedirect, getRedirectResult };
