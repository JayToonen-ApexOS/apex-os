import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreDocument(docPath, initialValue = {}) {
  const [state, setState] = useState(initialValue);
  const docPathRef = useRef(docPath);
  const hasFetched = useRef(false);

  useEffect(() => {
    docPathRef.current = docPath;
  }, [docPath]);

  // One-time read on mount (or when docPath becomes available)
  useEffect(() => {
    if (!docPath || hasFetched.current) return;
    hasFetched.current = true;

    const ref = doc(db, docPath);
    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          setState({ ...initialValue, ...snap.data() });
        }
      })
      .catch(e => console.error('Firestore read failed:', docPath, e));
  }, [docPath]);

  const setValue = async (newValueOrUpdater) => {
    const currentPath = docPathRef.current;

    setState(prev => {
      const newValue = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prev)
        : { ...prev, ...newValueOrUpdater };

      if (currentPath) {
        setDoc(doc(db, currentPath), newValue, { merge: true })
          .catch(e => console.error('Firestore write failed:', currentPath, e));
      }

      return newValue;
    });
  };

  return [state, setValue];
}
