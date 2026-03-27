import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreDocument(docPath, initialValue = {}) {
  const [state, setState] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!docPath) { setState(initialValue); return; }
    const ref = doc(db, docPath);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setState(prev => ({ ...initialValue, ...prev, ...snap.data() }));
      }
      setLoaded(true);
    });
    return unsubscribe;
  }, [docPath]);

  const setValue = useCallback(async (newValueOrUpdater) => {
    setState(prev => {
      const newValue = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prev)
        : newValueOrUpdater;
      if (docPath) {
        setDoc(doc(db, docPath), newValue, { merge: true }).catch(e =>
          console.error('Firestore write error:', e)
        );
      }
      return newValue;
    });
  }, [docPath]);

  return [state, setValue, loaded];
}
