'use client';

export interface SavedNote {
  id: string;
  question: string;
  userNotes?: string; // User's custom notes, optional
  savedAt: string; // Represents the last modified timestamp
}

const NOTES_STORAGE_KEY = 'upscSavedNotes';

export function getSavedNotes(): SavedNote[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const notesJson = localStorage.getItem(NOTES_STORAGE_KEY);
    const parsedNotes = notesJson ? JSON.parse(notesJson) : [];
    // Sort by savedAt descending to ensure newest are first
    return parsedNotes.sort((a: SavedNote, b: SavedNote) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (error) {
    console.error("Error parsing saved notes from localStorage:", error);
    localStorage.removeItem(NOTES_STORAGE_KEY); // Clear corrupted data
    return [];
  }
}

export function addSavedNote(question: string, userNotes?: string): SavedNote | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn("localStorage is not available.");
    return null;
  }
  try {
    const notes = getSavedNotes();
    const newNote: SavedNote = {
      id: crypto.randomUUID(),
      question,
      userNotes: userNotes ?? '', // Default to empty string if undefined or null
      savedAt: new Date().toISOString(),
    };
    // Add to the beginning and re-sort to be absolutely sure, though getSavedNotes already sorts
    const updatedNotes = [newNote, ...notes].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    return newNote;
  } catch (error) {
    console.error("Error saving note to localStorage:", error);
    return null;
  }
}

export function updateSavedNote(noteId: string, newQuestion: string, newUserNotes?: string): SavedNote | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn("localStorage is not available for updating.");
    return null;
  }
  try {
    const notes = getSavedNotes();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      console.warn(`Note with id ${noteId} not found for updating.`);
      return null;
    }
    const updatedNote: SavedNote = {
      ...notes[noteIndex],
      question: newQuestion,
      userNotes: newUserNotes ?? '', // Default to empty string if undefined or null
      savedAt: new Date().toISOString(), // Update timestamp to reflect edit time
    };
    notes[noteIndex] = updatedNote;
    // Re-sort after update to maintain order by savedAt
    const updatedNotes = notes.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNote;
  } catch (error) {
    console.error("Error updating note in localStorage:", error);
    return null;
  }
}

export function deleteSavedNote(noteId: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn("localStorage is not available.");
    return false;
  }
  try {
    let notes = getSavedNotes();
    const initialLength = notes.length;
    notes = notes.filter(note => note.id !== noteId);
    if (notes.length < initialLength) {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting note from localStorage:", error);
    return false;
  }
}

export function deleteAllSavedNotes(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn("localStorage is not available.");
    return false;
  }
  try {
    localStorage.removeItem(NOTES_STORAGE_KEY);
    return true;
  } catch (error)
    {
    console.error("Error deleting all notes from localStorage:", error);
    return false;
  }
}
