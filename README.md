
# UPSC Explain

This is a NextJS application built with Firebase Studio that provides AI-powered explanations for UPSC (Union Public Service Commission) exam-related questions.

## Core Features

- **User Authentication**: Secure signup and login for personalized experiences.
- **Question Input**: Users can input their UPSC-related questions into a text area.
- **AI Explanation**: The application utilizes a GenAI flow to generate clear and student-friendly explanations for the submitted questions, including Markdown and LaTeX formatting.
- **Additional Notes**: Users can add their personal notes to the AI-generated explanation.
- **Save & View Notes**: Logged-in users can save their questions, AI explanations, and personal notes. They can view, edit, and delete these saved notes.
- **PDF Export**: Saved notes can be exported as PDF files.
- **Feedback**: Users can provide feedback (helpful/not helpful with comments) on AI explanations.

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
    cd upsc-explain
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
    GENKIT_GOOGLEAI_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY"
    ```
    **How to get Firebase credentials:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project (or create a new one).
    *   Go to **Project settings** (click the gear icon next to "Project Overview").
    *   Under the **General** tab, scroll down to the "Your apps" section.
    *   If you haven't registered a web app, click the web icon (`</>`) to add one. Follow the instructions.
    *   Once your web app is registered, you'll find the `firebaseConfig` object. Copy the values from this object into your `.env` file for the corresponding `NEXT_PUBLIC_FIREBASE_...` variables.
    *   **Important for Firestore:** Ensure you have enabled Firestore in your Firebase project and set up appropriate security rules. For development, you can start with rules that allow reads/writes if authenticated:
        ```json
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow users to read and write their own notes
            match /users/{userId}/notes/{noteId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
            // Allow anyone to write feedback (consider restricting in production)
            match /explanationsFeedback/{feedbackId} {
              allow read, write; // Or more restrictive: allow create: if request.auth != null;
            }
          }
        }
        ```

    **How to get Google AI Studio API Key:**
    *   Go to [Google AI Studio](https://makersuite.google.com/).
    *   Sign in or create an account.
    *   Create a new API key or use an existing one. Copy this key for `GENKIT_GOOGLEAI_API_KEY`.

4.  **Enable Firebase Authentication Methods:**
    *   In the Firebase Console, go to **Authentication**.
    *   Under the **Sign-in method** tab, enable the "Email/Password" provider.

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will be available at `http://localhost:9002` (or another port if 9002 is occupied).
    **Important:** If you just created or modified the `.env` file, you **MUST restart your development server** for the changes to take effect.

    If you are using Genkit with a local development server (e.g., for testing flows):
    ```bash
    npm run genkit:dev
    # or
    npm run genkit:watch
    ```

## Application Structure

-   **`src/app/`**: Main application pages (App Router).
    -   `src/app/page.tsx`: Homepage with the question explainer.
    -   `src/app/(auth)/login/page.tsx`: Login page.
    -   `src/app/(auth)/signup/page.tsx`: Signup page.
    -   `src/app/saved-notes/page.tsx`: Page to view saved notes.
-   **`src/components/`**: Reusable UI components.
    -   `src/components/question-explainer.tsx`: Core component for question input and explanation display.
    -   `src/components/saved-notes-viewer.tsx`: Component for displaying and managing saved notes.
    -   `src/components/header.tsx`: Application header with navigation and auth status.
    -   `src/components/ui/`: Shadcn UI components.
-   **`src/ai/`**: GenAI related code.
    -   `src/ai/flows/explain-upsc-question.ts`: Genkit flow for generating explanations.
    -   `src/ai/genkit.ts`: Genkit initialization and configuration.
-   **`src/lib/`**: Utility functions and Firebase integration.
    -   `src/lib/firebase.ts`: Firebase initialization.
    -   `src/lib/notes-storage.ts`: Functions for interacting with Firestore to manage saved notes.
    -   `src/lib/feedback-storage.ts`: Functions for interacting with Firestore to manage feedback.
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
    *   Confirm that the necessary services (**Authentication** with Email/Password provider enabled, and **Firestore** in Native Mode) are enabled in your Firebase project.

**Check Browser Console for Diagnostic Logs:**
*   After trying the steps above, open your application's login page.
*   Open your browser's developer console (usually by pressing F12).
*   You should see lines starting with `DIAGNOSTIC: NEXT_PUBLIC_FIREBASE_API_KEY: ...`
*   If `process.env.NEXT_PUBLIC_FIREBASE_API_KEY` shows as `undefined` or the placeholder value, it confirms your `.env` file or server restart is the issue.

If you are using the Google AI provider for Genkit, ensure `GENKIT_GOOGLEAI_API_KEY` is also correctly set in your `.env` file.
```