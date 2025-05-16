
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
  question?: string; // The question that was asked (for explanation feedback)
  explanation?: string; // The AI-generated explanation (for explanation feedback)
  isHelpful?: boolean; // Was the explanation helpful? (for explanation feedback)
  feedbackText: string; // User's textual feedback (required for general, optional for helpful explanation)
  feedbackType: 'explanation' | 'general'; // To distinguish feedback type
  createdAt: Timestamp; // Firestore Timestamp
}

// Type for data passed to addFeedback function
export type AddFeedbackData = Omit<FeedbackEntry, 'id' | 'createdAt'>;

// Firestore collection path for feedback
const FEEDBACK_COLLECTION = 'explanationsFeedback';

/**
 * Adds a new feedback entry to Firestore.
 * @param feedbackData - The feedback data to save.
 * @returns True if the feedback was saved successfully, false otherwise.
 */
export async function addFeedback(
  feedbackData: AddFeedbackData
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

