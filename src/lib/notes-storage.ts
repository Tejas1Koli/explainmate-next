'use client';

export interface SavedNote {
  id: string;
  question: string;
  explanation: string;
  savedAt: string; // Represents the last modified timestamp
}

const NOTES_STORAGE_KEY = 'upscSavedNotes';

export function getSavedNotes(): SavedNote[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const notesJson = localStorage.getItem(NOTES_STORAGE_KEY);
    return notesJson ? JSON.parse(notesJson) : [];
  } catch (error) {
    console.error("Error parsing saved notes from localStorage:", error);
    localStorage.removeItem(NOTES_STORAGE_KEY); // Clear corrupted data
    return [];
  }
}

export function addSavedNote(question: string, explanation: string): SavedNote | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn("localStorage is not available.");
    return null;
  }
  try {
    const notes = getSavedNotes();
    const newNote: SavedNote = {
      id: crypto.randomUUID(),
      question,
      explanation,
      savedAt: new Date().toISOString(),
    };
    notes.unshift(newNote); // Add to the beginning for most recent first
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    return newNote;
  } catch (error) {
    console.error("Error saving note to localStorage:", error);
    return null;
  }
}

export function updateSavedNote(noteId: string, newQuestion: string, newExplanation: string): SavedNote | null {
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
      explanation: newExplanation,
      savedAt: new Date().toISOString(), // Update timestamp to reflect edit time
    };
    notes[noteIndex] = updatedNote;
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
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

