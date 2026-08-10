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
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, (firebaseConfig as any).firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth Helpers
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
    // If popup blocked or closed, try redirect
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      console.warn('Popup blocked/closed, attempting redirect...');
      return await signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
};

export const logout = () => signOut(auth);

export { onAuthStateChanged, signInWithRedirect, getRedirectResult };


