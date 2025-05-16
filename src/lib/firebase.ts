
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // This is optional for basic Firebase auth/firestore
};

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (!firebaseConfig.apiKey) {
  console.error(
    'Firebase Initialization Failed: API Key is missing. \n' +
    '1. Make sure NEXT_PUBLIC_FIREBASE_API_KEY is set in your .env file in the project root.\n' +
    '2. Ensure the .env file has the correct values from your Firebase project settings.\n' +
    '3. Restart your Next.js development server after any .env file changes.'
  );
} else {
  if (!getApps().length) {
    console.log("Firebase API Key:", firebaseConfig.apiKey);
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
     console.error(
      'Firebase App Initialization Failed for an unknown reason, even though API key was present.'
     );
  }
}

export { app, auth, db };
