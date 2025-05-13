
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';

export interface FeedbackEntry {
  id?: string; // Firestore document ID (optional for creation)
  userId?: string; // ID of the user who provided feedback, if logged in
  question: string; // The question that was asked
  explanation: string; // The AI-generated explanation
  isHelpful: boolean; // Was the explanation helpful?
  feedbackText?: string; // User's textual feedback if not helpful
  createdAt: Timestamp; // Firestore Timestamp
}

// Firestore collection path for feedback
const FEEDBACK_COLLECTION = 'explanationsFeedback';

/**
 * Adds a new feedback entry to Firestore.
 * @param feedbackData - The feedback data to save.
 * @returns True if the feedback was saved successfully, false otherwise.
 */
export async function addFeedback(
  feedbackData: Omit<FeedbackEntry, 'id' | 'createdAt'>
): Promise<boolean> {
  try {
    const feedbackCollectionRef = collection(db, FEEDBACK_COLLECTION);
    await addDoc(feedbackCollectionRef, {
      ...feedbackData,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error saving feedback to Firestore:", error);
    return false;
  }
}
