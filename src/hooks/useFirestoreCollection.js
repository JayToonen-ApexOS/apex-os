import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Drop-in vervanging voor useState die de state automatisch synchroniseert
 * met een Firestore collectie. Items moeten een `id` veld hebben.
 *
 * Gebruik: const [habits, setHabits, loading] = useFirestoreCollection('habits', initialHabits);
 *
 * setHabits werkt net als een gewone setState:
 *   - setHabits(newArray)
 *   - setHabits(prev => prev.map(...))
 */
export function useFirestoreCollection(collectionPath, initialValue = []) {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  // Ref om te voorkomen dat we onze eigen snapshot-update terugkrijgen
  const isSyncing = useRef(false);

  // Real-time listener: Firestore → React state
  useEffect(() => {
    // Wacht tot we een geldig pad hebben (bijv. user is ingelogd)
    if (!collectionPath) {
      setState(initialValue);
      setLoading(false);
      return;
    }
    const colRef = collection(db, collectionPath);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        // Negeer updates die we zelf hebben getriggerd via batch write
        if (isSyncing.current) return;
        const data = snapshot.docs.map((d) => ({ ...d.data() }));
        // Sorteer op id (numeriek) zodat volgorde consistent is
        data.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        setState(data);
        setLoading(false);
      },
      (error) => {
        console.error(`Firestore listener fout (${collectionPath}):`, error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [collectionPath]);

  // Setter: React state + Firestore
  const firestoreSetState = useCallback(
    async (newStateOrUpdater) => {
      // Bereken nieuwe state (ondersteunt zowel waarde als functie)
      const newState =
        typeof newStateOrUpdater === 'function'
          ? newStateOrUpdater(state)
          : newStateOrUpdater;

      // Update local state direct voor snelle UI-respons
      setState(newState);

      if (!collectionPath) return;

      // Sync naar Firestore via batch write
      try {
        isSyncing.current = true;
        const colRef = collection(db, collectionPath);
        const snapshot = await getDocs(colRef);

        const batch = writeBatch(db);

        // Verwijder bestaande docs
        snapshot.docs.forEach((d) => batch.delete(d.ref));

        // Schrijf nieuwe items (gebruik item.id als document-ID)
        if (Array.isArray(newState)) {
          newState.forEach((item) => {
            if (item.id !== undefined && item.id !== null) {
              const docRef = doc(colRef, String(item.id));
              batch.set(docRef, item);
            }
          });
        }

        await batch.commit();
      } catch (error) {
        console.error(`Firestore schrijffout (${collectionPath}):`, error);
      } finally {
        isSyncing.current = false;
      }
    },
    [collectionPath, state]
  );

  return [state, firestoreSetState, loading];
}
