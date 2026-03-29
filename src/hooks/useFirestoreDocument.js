import { useState, useEffect } from 'react';

export function useFirestoreDocument(docPath, initialValue = {}) {
  const [state, setState] = useState(initialValue);
  const [currentKey, setCurrentKey] = useState(null);

  useEffect(() => {
    if (!docPath) return;
    const key = `apex_${docPath.replace(/\//g, '_')}`;
    setCurrentKey(key);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setState({ ...initialValue, ...JSON.parse(stored) });
      }
    } catch (e) {}
  }, [docPath]);

  const setValue = (newValueOrUpdater) => {
    setState(prev => {
      const newValue = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prev)
        : { ...prev, ...newValueOrUpdater };
      if (currentKey) {
        try {
          localStorage.setItem(currentKey, JSON.stringify(newValue));
        } catch (e) {}
      }
      return newValue;
    });
  };

  return [state, setValue];
}
