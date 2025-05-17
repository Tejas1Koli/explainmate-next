
# ExplainMate AI

This is a NextJS application built with Firebase Studio that provides AI-powered explanations for various questions, with a focus on STEM concepts.

## Core Features

- **User Authentication**: Secure signup and login for personalized experiences.
- **Question Input**: Users can input their STEM questions or concepts into a text area.
- **AI Explanation**: The application utilizes a GenAI flow to generate clear and student-friendly explanations for the submitted questions/concepts, including Markdown and LaTeX formatting. It also provides an alternative API route `/api/explain` for direct Gemini calls with rate limiting.
- **Additional Notes**: Users can add their personal notes to the AI-generated explanation.
- **Save & View Notes**: Logged-in users can save their questions/concepts, AI explanations, and personal notes. They can view, edit, and delete these saved notes.
- **PDF Export**: Saved notes can be exported as PDF files.
- **Feedback**: Users can provide feedback (helpful/not helpful with comments) on AI explanations and general app feedback.
- **Quizify**: Generate a quiz based on the AI explanation.
- **Dark Mode**: User-selectable light and dark themes.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A Firebase project
- A Google AI Studio API Key (for Genkit flows, e.g., `GENKIT_GOOGLEAI_API_KEY`)
- A Google AI Studio API Key (for the direct SDK usage in `/api/explain`, e.g., `GEMINI_API_KEY`)
- A Firebase Admin SDK Service Account Key (JSON file)

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
    *   **VERY IMPORTANT:** You **MUST REPLACE** the placeholder values with your **actual Firebase project credentials, Google AI Studio API keys, and Firebase Service Account details**.

    ```env
    # Firebase Client Configuration
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
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional

    # Genkit/Google AI Configuration (for Genkit Flows)
    # Get this from Google AI Studio (https://makersuite.google.com/)
    # This key was previously named GEMINI_API_KEY in some contexts,
    # it has been renamed to GENKIT_GOOGLEAI_API_KEY for consistency with Genkit's Google AI plugin.
    GENKIT_GOOGLEAI_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY_FOR_GENKIT"

    # Google Generative AI SDK Configuration (for /api/explain route)
    # This can be the same key as above or a different one.
    # Get this from Google AI Studio (https://makersuite.google.com/)
    GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY_FOR_SDK"

    # Firebase Admin SDK Configuration (for backend token verification and rate limiting)
    # 1. Go to Firebase Console > Project Settings > Service accounts.
    # 2. Click "Generate new private key" and download the JSON file.
    # 3. DO NOT commit this file to Git.
    # 4. Base64 encode the *content* of this JSON file. You can use an online tool or command line:
    #    Linux/macOS: base64 -i path/to/your-service-account-file.json
    #    Windows (PowerShell): [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\your-service-account-file.json"))
    # 5. Paste the resulting base64 string here.
    FIREBASE_SERVICE_ACCOUNT_BASE64="YOUR_BASE64_ENCODED_SERVICE_ACCOUNT_JSON"
    ```
    **How to get Firebase credentials:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project (or create a new one).
    *   Go to **Project settings** (click the gear icon next to "Project Overview").
    *   Under the **General** tab, scroll down to the "Your apps" section.
    *   If you haven't registered a web app, click the web icon (`</>`) to add one. Follow the instructions.
    *   Once your web app is registered, you'll find the `firebaseConfig` object. Copy the values from this object into your `.env` file for the corresponding `NEXT_PUBLIC_FIREBASE_...` variables.

    **How to get Google AI Studio API Key(s):**
    *   Go to [Google AI Studio](https://makersuite.google.com/).
    *   Sign in or create an account.
    *   Create a new API key or use an existing one. Copy this key. You might use the same key for both `GENKIT_GOOGLEAI_API_KEY` and `GEMINI_API_KEY`, or different keys if preferred.

    **How to get Firebase Service Account Key:**
    *   Go to your [Firebase Console](https://console.firebase.google.com/) -> Project Settings -> Service accounts tab.
    *   Click "Generate new private key" under "Firebase Admin SDK." Confirm and download the JSON file.
    *   **Secure this file.** Do not commit it to your repository.
    *   Follow the instructions in the `.env` example above to base64 encode its content and set the `FIREBASE_SERVICE_ACCOUNT_BASE64` variable.

4.  **Enable Firebase Authentication Methods:**
    *   In the Firebase Console, go to **Authentication**.
    *   Under the **Sign-in method** tab, enable the "Email/Password" provider.

5.  **Set up Firestore Database and Security Rules (CRITICAL):**
    *   In the Firebase Console, go to **Firestore Database** (under Build).
    *   Click **Create database**.
    *   Choose to start in **Production mode**.
    *   Select a Cloud Firestore location.
    *   After the database is created, go to the **Rules** tab within Firestore Database.
    *   **Replace the default rules** with the following rules. These rules are essential for the app to function correctly:
        ```firestore_rules
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow authenticated users to read and write their own notes
            match /users/{userId}/notes/{noteId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
            // Allow authenticated users to submit feedback.
            // Read access is disabled for clients to protect feedback privacy.
            // Feedback should be reviewed via the Firebase Console or Admin SDK.
            match /explanationsFeedback/{feedbackId} {
              allow create: if request.auth != null;
              allow read: if false; // Prevents clients from reading feedback lists
            }
            // Allow authenticated users to write their own rate limit entries
            // Only backend (with admin privileges) should ideally read these for enforcement.
            // This rule allows clients to create entries, which the /api/explain route does.
            // For stronger security, only the admin SDK should write here.
            // However, the current API route structure adds new requests directly.
            match /rate_limits/{userId}/user_requests/{requestId} {
              allow create: if request.auth != null && request.auth.uid == userId;
              allow read, list: if request.auth != null && request.auth.uid == userId; // For simplicity, if client ever needed to see its own rate. Server normally checks.
            }
          }
        }
        ```
    *   Click **Publish**.

6.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.
    **Important:** If you just created or modified the `.env` file, or changed Firebase settings, you **MUST restart your development server** for the changes to take effect.

    If you are using Genkit with a local development server (e.g., for testing flows):
    ```bash
    npm run genkit:dev
    # or
    npm run genkit:watch
    ```

## Security Best Practices

*   **API Key Restrictions (CRITICAL):**
    *   **Firebase Client API Key (`NEXT_PUBLIC_FIREBASE_API_KEY`):** In the [Google Cloud Console](https://console.cloud.google.com/) -> APIs & Services -> Credentials, find your Firebase API key. Edit it and under "Application restrictions," select "HTTP referrers (web sites)." Add your deployed application domain(s) (e.g., `your-app-name.vercel.app`, `www.yourdomain.com`) and `localhost:9002` (or your development port). This prevents your Firebase project from being used by unauthorized websites.
    *   **Google AI API Keys (`GENKIT_GOOGLEAI_API_KEY`, `GEMINI_API_KEY`):** In the Google AI Studio or Google Cloud Console, restrict these API keys to only allow access to the "Generative Language API". Avoid giving them overly broad permissions.
    *   **Firebase Service Account Key (`FIREBASE_SERVICE_ACCOUNT_BASE64`):** This key grants admin privileges to your Firebase project. **Protect it carefully.** Do not expose the raw JSON or the base64 string in client-side code or commit it to your repository. Store it securely as an environment variable on your deployment platform.
*   **Firestore Security Rules:** Regularly review your Firestore rules. The provided rules are a good starting point. The feedback `read` rule is set to `allow read: if false;` to protect feedback privacy from client-side queries. The `rate_limits` rules currently allow client creation for simplicity of the API route; in a stricter setup, only a trusted server environment would write these.
*   **Dependency Updates:** Keep your npm packages up-to-date. Use `npm audit` or `yarn audit`.
*   **Rate Limiting:** The `/api/explain` route includes basic server-side rate limiting. Consider more sophisticated strategies for production.

## Application Structure

-   **`src/app/`**: Main application pages (App Router).
    -   `src/app/page.tsx`: Homepage with the question/concept explainer.
    -   `src/app/(auth)/login/page.tsx`: Login page.
    -   `src/app/(auth)/signup/page.tsx`: Signup page.
    -   `src/app/saved-notes/page.tsx`: Page to view saved notes.
    -   `src/app/api/explain/route.ts`: API route for AI explanations with rate limiting.
-   **`src/components/`**: Reusable UI components.
-   **`src/ai/`**: GenAI related code (primarily Genkit flows).
-   **`src/lib/`**: Utility functions, Firebase client & admin integration.
    -   `src/lib/firebase.ts`: Firebase client SDK initialization.
    -   `src/lib/firebase-admin.ts`: Firebase Admin SDK initialization.
    -   `src/lib/notes-storage.ts`: Functions for Firestore note management.
    -   `src/lib/feedback-storage.ts`: Functions for Firestore feedback management.
-   **`src/contexts/`**: React Context providers.
-   **`src/hooks/`**: Custom React hooks.

## Troubleshooting Firebase Errors

### Critical: `Firebase: Error (auth/configuration-not-found)` or `Firebase: Error (auth/api-key-not-valid...)`
This usually means issues with your `.env` file for client-side Firebase.
1.  **`.env` File Location:** Root directory (with `package.json`).
2.  **Correct Variable Names:** `NEXT_PUBLIC_FIREBASE_...` for all client-side Firebase vars.
3.  **Correct Values:** Ensure actual credentials from Firebase project settings.
4.  **Restart Development Server:** Crucial after any `.env` changes.
5.  **Verify Firebase Project Setup:** Check values in Firebase Console.

### Critical: `FirebaseError: Missing or insufficient permissions.`
This means your Firestore Security Rules are blocking an operation.
1.  **Deploy Security Rules:** Ensure the rules from Step 5 of Setup are published in Firebase Console -> Firestore Database -> Rules.
2.  **Verify User Authentication:** The user must be logged in for operations requiring auth.
3.  **Check Firestore Paths:** Ensure paths in code match rules.

### Critical: `Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.` or `Error initializing Firebase Admin SDK`
This means the backend Firebase Admin SDK (used in `/api/explain`) couldn't initialize.
1.  **Service Account Key:** Ensure you have downloaded the service account JSON file from Firebase Project Settings -> Service accounts.
2.  **Base64 Encoding:** Correctly base64 encode the *entire content* of the JSON file.
3.  **Environment Variable:** Ensure `FIREBASE_SERVICE_ACCOUNT_BASE64` is set in your `.env` file (for local development) and in your deployment environment (Vercel, Netlify) with the correct base64 string.
4.  **Restart Server:** If running locally, restart the dev server after setting the `.env` variable.

### PDF Export Error (`Could not export the note to PDF`)
Ensure internet connection for KaTeX CSS loading. Check browser console for `html2canvas` errors.

```

