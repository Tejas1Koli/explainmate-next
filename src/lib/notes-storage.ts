
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

export interface SavedNote {
  id: string; // Firestore document ID
  userId: string;
  question: string;
  userNotes?: string;
  savedAt: Timestamp; // Firestore Timestamp for server-side sorting
  createdAt: Timestamp;
}

// Firestore collection path: users/{userId}/notes
const getNotesCollectionRef = (userId: string) => collection(db, 'users', userId, 'notes');

export async function getSavedNotes(userId: string): Promise<SavedNote[]> {
  if (!userId) {
    console.warn("User ID is required to fetch notes.");
    return [];
  }
  try {
    const notesCollectionRef = getNotesCollectionRef(userId);
    const q = query(notesCollectionRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedNote));
  } catch (error) {
    console.error("Error fetching notes from Firestore:", error);
    return [];
  }
}

export async function addSavedNote(userId: string, question: string, userNotes?: string): Promise<SavedNote | null> {
   if (!userId) {
    console.warn("User ID is required to save a note.");
    return null;
  }
  try {
    const notesCollectionRef = getNotesCollectionRef(userId);
    const now = serverTimestamp();
    const docRef = await addDoc(notesCollectionRef, {
      userId,
      question,
      userNotes: userNotes ?? '',
      savedAt: now,
      createdAt: now,
    });
    // For immediate client-side update, we use a local timestamp. Firestore will handle server one.
    const localTimestamp = Timestamp.now();
    return {
      id: docRef.id,
      userId,
      question,
      userNotes: userNotes ?? '',
      savedAt: localTimestamp,
      createdAt: localTimestamp,
    };
  } catch (error) {
    console.error("Error saving note to Firestore:", error);
    return null;
  }
}

export async function updateSavedNote(userId: string, noteId: string, newQuestion: string, newUserNotes?: string): Promise<SavedNote | null> {
  if (!userId || !noteId) {
    console.warn("User ID and Note ID are required to update a note.");
    return null;
  }
  try {
    const noteDocRef = doc(db, 'users', userId, 'notes', noteId);
    const updatedData: Partial<Omit<SavedNote, 'id' | 'userId' | 'createdAt'>> = {
      question: newQuestion,
      userNotes: newUserNotes ?? '',
      savedAt: serverTimestamp(),
    };
    await updateDoc(noteDocRef, updatedData);
    
    // For optimistic update, return the new data with a local timestamp
    const localTimestamp = Timestamp.now();
    // We would need to fetch the original createdAt if we want to keep it strictly
    // For simplicity, if it's needed, one might fetch the doc before update.
    // Here, we are just returning the updated fields.
    const currentNotes = await getSavedNotes(userId);
    const updatedNoteInList = currentNotes.find(n => n.id === noteId);


    return updatedNoteInList ? 
    {
        ...updatedNoteInList, // spread existing fields like createdAt
        question: newQuestion,
        userNotes: newUserNotes ?? '',
        savedAt: localTimestamp, // use local for immediate feedback
    } : null;

  } catch (error) {
    console.error("Error updating note in Firestore:", error);
    return null;
  }
}

export async function deleteSavedNote(userId: string, noteId: string): Promise<boolean> {
  if (!userId || !noteId) {
    console.warn("User ID and Note ID are required to delete a note.");
    return false;
  }
  try {
    const noteDocRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(noteDocRef);
    return true;
  } catch (error) {
    console.error("Error deleting note from Firestore:", error);
    return false;
  }
}

export async function deleteAllSavedNotes(userId: string): Promise<boolean> {
  if (!userId) {
    console.warn("User ID is required to delete all notes.");
    return false;
  }
  try {
    const notesCollectionRef = getNotesCollectionRef(userId);
    const querySnapshot = await getDocs(notesCollectionRef);
    
    if (querySnapshot.empty) {
      return true; // No notes to delete
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting all notes from Firestore:", error);
    return false;
  }
}
