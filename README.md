
# ExplainMate AI

This is a NextJS application built with Firebase Studio that provides AI-powered explanations for various questions, with a focus on STEM concepts.

## Core Features

- **User Authentication**: Secure signup and login for personalized experiences.
- **Question Input**: Users can input their STEM questions or concepts into a text area.
- **AI Explanation**: The application utilizes a GenAI flow to generate clear and student-friendly explanations for the submitted questions/concepts, including Markdown and LaTeX formatting.
- **Additional Notes**: Users can add their personal notes to the AI-generated explanation.
- **Save & View Notes**: Logged-in users can save their questions/concepts, AI explanations, and personal notes. They can view, edit, and delete these saved notes.
- **PDF Export**: Saved notes can be exported as PDF files.
- **Feedback**: Users can provide feedback (helpful/not helpful with comments) on AI explanations and general app feedback.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A Firebase project
- A Google AI Studio API Key (for Genkit)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd explainmate-ai 
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    *   **Create the `.env` file:** In the **root directory** of your project (alongside `package.json`), create a file named `.env`.
    *   **Copy and paste the following content** into your newly created `.env` file.
    *   **VERY IMPORTANT:** You **MUST REPLACE** the placeholder values like `"YOUR_API_KEY"`, `"YOUR_AUTH_DOMAIN"`, `"YOUR_GOOGLE_AI_STUDIO_API_KEY"`, etc., with your **actual Firebase project credentials and Google AI Studio API key**.

    ```env
    # Firebase Configuration
    # IMPORTANT: Replace "YOUR_API_KEY", "YOUR_AUTH_DOMAIN", etc.,
    # with your actual Firebase project credentials.
    # You can find these in your Firebase project settings:
    # Project settings > General > Your apps > Web app > SDK setup and configuration > Config

    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional but recommended

    # Genkit/Google AI Configuration
    # Get this from Google AI Studio (https://makersuite.google.com/)
    # This key was previously named GEMINI_API_KEY, it has been renamed to GENKIT_GOOGLEAI_API_KEY
    # for consistency with Genkit's Google AI plugin.
    GENKIT_GOOGLEAI_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY"
    ```
    **How to get Firebase credentials:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project (or create a new one).
    *   Go to **Project settings** (click the gear icon next to "Project Overview").
    *   Under the **General** tab, scroll down to the "Your apps" section.
    *   If you haven't registered a web app, click the web icon (`</>`) to add one. Follow the instructions.
    *   Once your web app is registered, you'll find the `firebaseConfig` object. Copy the values from this object into your `.env` file for the corresponding `NEXT_PUBLIC_FIREBASE_...` variables.

    **How to get Google AI Studio API Key:**
    *   Go to [Google AI Studio](https://makersuite.google.com/).
    *   Sign in or create an account.
    *   Create a new API key or use an existing one. Copy this key for `GENKIT_GOOGLEAI_API_KEY`.

4.  **Enable Firebase Authentication Methods:**
    *   In the Firebase Console, go to **Authentication**.
    *   Under the **Sign-in method** tab, enable the "Email/Password" provider. (Google Sign-In can also be added here if desired later).

5.  **Set up Firestore Database and Security Rules (CRITICAL for "Missing or insufficient permissions" error):**
    *   In the Firebase Console, go to **Firestore Database** (under Build).
    *   Click **Create database**.
    *   Choose to start in **Production mode** (recommended) or Test mode. *If you choose Test mode, remember its rules expire after 30 days.*
    *   Select a Cloud Firestore location.
    *   After the database is created, go to the **Rules** tab within Firestore Database.
    *   **Replace the default rules** with the following rules. These rules are essential for the app to function correctly:
        ```json
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow authenticated users to read and write their own notes
            match /users/{userId}/notes/{noteId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
            // Allow authenticated users to submit feedback.
            // For production, you might want to restrict read access if feedback isn't displayed.
            match /explanationsFeedback/{feedbackId} {
              allow create: if request.auth != null;
              allow read: if request.auth != null; // Or adjust as needed
            }
          }
        }
        ```
    *   Click **Publish**. If you don't publish the rules, your app won't have the necessary permissions.

6.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will be available at `http://localhost:9002` (or another port if 9002 is occupied).
    **Important:** If you just created or modified the `.env` file, or changed Firebase settings, you **MUST restart your development server** for the changes to take effect.

    If you are using Genkit with a local development server (e.g., for testing flows):
    ```bash
    npm run genkit:dev
    # or
    npm run genkit:watch
    ```

## Application Structure

-   **`src/app/`**: Main application pages (App Router).
    -   `src/app/page.tsx`: Homepage with the question/concept explainer.
    -   `src/app/(auth)/login/page.tsx`: Login page.
    -   `src/app/(auth)/signup/page.tsx`: Signup page.
    -   `src/app/saved-notes/page.tsx`: Page to view saved notes.
-   **`src/components/`**: Reusable UI components.
    -   `src/components/question-explainer.tsx`: Core component for question input and explanation display.
    -   `src/components/saved-notes-viewer.tsx`: Component for displaying and managing saved notes.
    -   `src/components/header.tsx`: Application header with navigation and auth status.
    -   `src/components/general-feedback-dialog.tsx`: Dialog for submitting general app feedback.
    -   `src/components/ui/`: Shadcn UI components.
-   **`src/ai/`**: GenAI related code.
    -   `src/ai/flows/explain-stem-concept.ts`: Genkit flow for generating explanations for STEM concepts.
    -   `src/ai/genkit.ts`: Genkit initialization and configuration.
-   **`src/lib/`**: Utility functions and Firebase integration.
    -   `src/lib/firebase.ts`: Firebase initialization.
    *   `src/lib/notes-storage.ts`: Functions for interacting with Firestore to manage saved notes (path: `users/{userId}/notes`).
    *   `src/lib/feedback-storage.ts`: Functions for interacting with Firestore to manage feedback (path: `explanationsFeedback`).
-   **`src/contexts/`**: React Context providers.
    -   `src/contexts/auth-context.tsx`: Manages user authentication state.
-   **`src/hooks/`**: Custom React hooks.
    -   `src/hooks/use-toast.ts`: Hook for displaying toast notifications.

## Troubleshooting Firebase Errors

### Critical: `Firebase: Error (auth/configuration-not-found)` or `Firebase: Error (auth/api-key-not-valid...)`

This is the most common setup error. It means Firebase isn't loading its configuration correctly, usually due to issues with your `.env` file.

**Follow these steps METICULOUSLY:**

1.  **`.env` File Location (CRITICAL):**
    *   The `.env` file **MUST** be in the **ROOT DIRECTORY** of your project. This is the same folder that contains `package.json` and `next.config.ts`.
    *   It should **NOT** be in `src/` or any other subfolder.

2.  **Correct Variable Names in `.env` (CRITICAL):**
    *   Open your `.env` file.
    *   All Firebase variables **MUST** start with `NEXT_PUBLIC_`. For example:
        *   `NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_ACTUAL_API_KEY"`
        *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_ACTUAL_AUTH_DOMAIN"`
        *   ...and so on for all `NEXT_PUBLIC_FIREBASE_...` variables.
    *   The Genkit key is `GENKIT_GOOGLEAI_API_KEY` (no `NEXT_PUBLIC_` prefix as it's used server-side by Genkit).

3.  **Correct Values in `.env` (CRITICAL):**
    *   Ensure you have replaced **ALL placeholder values** (like `"YOUR_API_KEY"`, `"YOUR_GOOGLE_AI_STUDIO_API_KEY"`) with your *actual* credentials from your Firebase project and Google AI Studio.
    *   **No typos!** Even one wrong character will cause this error.
    *   Double-check that you've copied *all* the necessary Firebase config values from your Firebase project settings (Project settings > General > Your apps > Web app > SDK setup and configuration > Config).

4.  **Restart Development Server (CRITICAL):**
    *   **This is the step most often missed.** After creating or making *any* changes to the `.env` file, you **MUST** stop your Next.js development server (usually `Ctrl+C` in the terminal) and then **restart it** (e.g., `npm run dev` or `yarn dev`).
    *   Next.js only loads environment variables when the server starts.

5.  **Verify Firebase Project Setup:**
    *   Go to your [Firebase Console](https://console.firebase.google.com/).
    *   Select your project.
    *   Go to **Project settings** (gear icon) > **General** tab.
    *   Scroll to "Your apps" and select your web app.
    *   In the "SDK setup and configuration" section, choose "Config".
    *   Carefully compare these values with what you have in your `.env` file. Ensure they match exactly.
    *   Confirm that the necessary services (**Authentication** with Email/Password provider enabled, and **Firestore** in Native Mode with the correct **Rules** published) are enabled in your Firebase project.

**Check Browser Console for Diagnostic Logs:**
*   After trying the steps above, open your application's login page.
*   Open your browser's developer console (usually by pressing F12).
*   You should see lines starting with `DIAGNOSTIC: NEXT_PUBLIC_FIREBASE_API_KEY: ...`
*   If `process.env.NEXT_PUBLIC_FIREBASE_API_KEY` shows as `undefined` or the placeholder value, it confirms your `.env` file or server restart is the issue.

If you are using the Google AI provider for Genkit, ensure `GENKIT_GOOGLEAI_API_KEY` is also correctly set in your `.env` file.

### Critical: `FirebaseError: Missing or insufficient permissions.`

This error means your Firestore Security Rules are blocking the app from reading or writing data.

1.  **Ensure Firestore is Set Up:** Follow step 5 in the "Setup" section above to create your Firestore database.
2.  **Deploy Security Rules (VERY IMPORTANT):**
    *   Go to your [Firebase Console](https://console.firebase.google.com/).
    *   Select your project.
    *   Navigate to **Firestore Database** (under "Build").
    *   Click on the **Rules** tab.
    *   **Replace the entire content** of the rules editor with the rules provided in **Step 5 of the Setup section** above.
    *   Click **Publish**.
3.  **Verify User Authentication:** Ensure the user is logged in when trying to perform actions that require authentication (like saving or viewing notes). If `currentUser` is null in `useAuth()`, Firestore operations for authenticated users will fail.
4.  **Check Firestore Paths:** Ensure the paths used in `src/lib/notes-storage.ts` and `src/lib/feedback-storage.ts` correctly match the paths defined in your security rules. The current paths are:
    *   Notes: `users/{userId}/notes/{noteId}`
    *   Feedback: `explanationsFeedback/{feedbackId}`
    These paths align with the provided rules.

If you've deployed the correct rules and are still getting permission errors, check your browser console for any other Firebase errors and ensure your application logic correctly handles user authentication state before attempting Firestore operations.

### PDF Export Error (`Could not export the note to PDF`)
If you encounter issues with PDF export, specifically if KaTeX (math rendering) styles are not applied correctly in the exported PDF:
* The PDF export function in `src/components/saved-notes-viewer.tsx` attempts to dynamically add the KaTeX stylesheet.
* Ensure you are connected to the internet when exporting, as it tries to load `https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css`.
* If issues persist, check the browser console for errors during the `html2canvas` process. The filename for exported PDFs is `stem_concept_note_<note_id_prefix>.pdf`.
