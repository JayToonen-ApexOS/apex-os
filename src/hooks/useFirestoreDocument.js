import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Syncs a single Firestore document to React state.
 * Returns [value, setValue, loading].
 * setValue merges the new value into the document.
 *
 * Usage:
 *   const [settings, setSettings, loading] = useFirestoreDocument(
 *     uid ? `users/${uid}/settings/agenda` : null,
 *     { Google: false, Apple: false }
 *   );
 */
export function useFirestoreDocument(documentPath, initialValue) {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentPath) {
      setState(initialValue);
      setLoading(false);
      return;
    }
    const ref = doc(db, documentPath);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setState({ ...initialValue, ...snap.data() });
        } else {
          setState(initialValue);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore document listener fout (${documentPath}):`, err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [documentPath]);

  const setValue = useCallback(
    async (newValueOrUpdater) => {
      const newValue =
        typeof newValueOrUpdater === 'function'
          ? newValueOrUpdater(state)
          : newValueOrUpdater;
      setState(newValue);
      if (!documentPath) return;
      try {
        await setDoc(doc(db, documentPath), newValue, { merge: true });
      } catch (err) {
        console.error(`Firestore document schrijffout (${documentPath}):`, err);
      }
    },
    [documentPath, state]
  );

  return [state, setValue, loading];
}
