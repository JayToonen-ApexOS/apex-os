import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreDocument(docPath, initialValue = {}) {
  const [state, setState] = useState(initialValue);
  const docPathRef = useRef(docPath);
  const isRemoteUpdate = useRef(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    docPathRef.current = docPath;
  }, [docPath]);

  // Listen to Firestore changes
  useEffect(() => {
    if (!docPath) {
      setState(initialValue);
      return;
    }

    const ref = doc(db, docPath);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        isRemoteUpdate.current = true;
        setState({ ...initialValue, ...snap.data() });
        hasLoaded.current = true;
      } else {
        hasLoaded.current = true;
      }
    }, (error) => {
      console.error('useFirestoreDocument listener error:', error);
    });

    return unsubscribe;
  }, [docPath]);

  const setValue = async (newValueOrUpdater) => {
    const currentPath = docPathRef.current;
    if (!currentPath) return;

    setState(prev => {
      const newValue = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prev)
        : newValueOrUpdater;

      // Write to Firestore immediately, outside of setState
      setDoc(doc(db, currentPath), newValue, { merge: true })
        .then(() => console.log('Firestore write OK:', currentPath, newValue))
        .catch(e => console.error('Firestore write FAILED:', currentPath, e));

      return newValue;
    });
  };

  return [state, setValue];
}
