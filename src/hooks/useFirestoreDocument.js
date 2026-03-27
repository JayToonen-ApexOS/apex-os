import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreDocument(docPath, initialValue = {}) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    if (!docPath) { setState(initialValue); return; }
    const ref = doc(db, docPath);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) setState({ ...initialValue, ...snap.data() });
    });
    return unsubscribe;
  }, [docPath]);

  const setValue = useCallback(async (newValueOrUpdater) => {
    const newValue = typeof newValueOrUpdater === 'function'
      ? newValueOrUpdater(state)
      : newValueOrUpdater;
    setState(newValue);
    if (!docPath) return;
    try {
      await setDoc(doc(db, docPath), newValue, { merge: true });
    } catch (e) {
      console.error('Firestore write error:', e);
    }
  }, [docPath, state]);

  return [state, setValue];
}
