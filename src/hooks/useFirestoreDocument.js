import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreDocument(docPath, initialValue = {}) {
  const [state, setState] = useState(initialValue);
  const isSyncing = useRef(false);
  const docPathRef = useRef(docPath);

  useEffect(() => {
    docPathRef.current = docPath;
  }, [docPath]);

  useEffect(() => {
    if (!docPath) {
      setState(initialValue);
      return;
    }

    const ref = doc(db, docPath);
    const unsubscribe = onSnapshot(ref, (snap) => {
      // Ignore snapshots triggered by our own writes
      if (isSyncing.current) return;
      if (snap.exists()) {
        setState({ ...initialValue, ...snap.data() });
      }
    }, (error) => {
      console.error('useFirestoreDocument error:', docPath, error);
    });

    return unsubscribe;
  }, [docPath]);

  const setValue = async (newValueOrUpdater) => {
    const currentPath = docPathRef.current;
    if (!currentPath) return;

    setState(prev => {
      const newValue = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prev)
        : { ...prev, ...newValueOrUpdater };

      isSyncing.current = true;
      setDoc(doc(db, currentPath), newValue, { merge: true })
        .then(() => { isSyncing.current = false; })
        .catch(e => {
          isSyncing.current = false;
          console.error('Firestore write failed:', currentPath, e);
        });

      return newValue;
    });
  };

  return [state, setValue];
}
