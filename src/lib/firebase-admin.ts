
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Ensure this env variable is set with the base64 encoded service account JSON
const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!admin.apps.length) {
  if (!base64ServiceAccount) {
    console.error("Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.");
    // In a real app, you might throw an error or handle this differently
    // For now, we'll log an error. The app might not function correctly without admin SDK.
  } else {
    try {
      const serviceAccountJson = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
      // Handle initialization error (e.g., invalid service account JSON)
    }
  }
}

export const firebaseAdminAuth = admin.apps.length ? admin.auth() : null;
export const firebaseAdminFirestore = admin.apps.length ? admin.firestore() : null;
