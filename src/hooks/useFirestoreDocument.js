import { useState, useEffect, useRef } from 'react';

export function useFirestoreDocument(docPath, initialValue = {}) {
  const storageKey = `apex_${docPath ?? 'null'}`;

  const [state, setState] = useState(() => {
    if (!docPath) return initialValue;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return { ...initialValue, ...JSON.parse(stored) };
    } catch (e) {}
    return initialValue;
  });

  // Re-read from localStorage when docPath changes (uid comes in)
  useEffect(() => {
    if (!docPath) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setState({ ...initialValue, ...JSON.parse(stored) });
    } catch (e) {}
  }, [docPath]);

  const setValue = (newValueOrUpdater) => {
    setState(prev => {
      const newValue = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prev)
        : { ...prev, ...newValueOrUpdater };
      if (docPath) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newValue));
        } catch (e) {}
      }
      return newValue;
    });
  };

  return [state, setValue];
}
