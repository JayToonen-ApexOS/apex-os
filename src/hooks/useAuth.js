import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

/**
 * Hook die de Firebase auth-state bijhoudt.
 * Returns: { user, loading, signIn, signOut }
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      // Sluit popup negeren, andere fouten loggen
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Google sign-in fout:', error);
      }
    }
  };

  const signOut = () => firebaseSignOut(auth);

  return { user, loading, signIn, signOut };
}
