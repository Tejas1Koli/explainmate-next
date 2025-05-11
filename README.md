# UPSC Explain

This is a NextJS application built with Firebase Studio that provides AI-powered explanations for UPSC (Union Public Service Commission) exam-related questions.

## Core Features

- **User Authentication**: Secure signup and login for personalized experiences.
- **Question Input**: Users can input their UPSC-related questions into a text area.
- **AI Explanation**: The application utilizes a GenAI flow to generate clear and student-friendly explanations for the submitted questions, including Markdown and LaTeX formatting.
- **Additional Notes**: Users can add their personal notes to the AI-generated explanation.
- **Save & View Notes**: Logged-in users can save their questions, AI explanations, and personal notes. They can view, edit, and delete these saved notes.
- **PDF Export**: Saved notes can be exported as PDF files.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A Firebase project

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
    Create a `.env` file in the root of your project. Copy the contents of `.env.example` (if provided) or use the following template. You need to replace the placeholder values with your actual Firebase project credentials.

    ```env
    # Firebase Configuration
    # Replace with your actual Firebase project credentials.
    # You can find these in your Firebase project settings:
    # Project settings > General > Your apps > Web app > SDK setup and configuration > Config

    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"

    # Genkit/Google AI Configuration (if using Google AI provider for Genkit)
    # Ensure you have a Google AI Studio API Key if you are using the googleAI plugin for Genkit
    # GENKIT_GOOGLEAI_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY"
    ```
    **How to get Firebase credentials:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project (or create a new one).
    *   Go to **Project settings** (click the gear icon next to "Project Overview").
    *   Under the **General** tab, scroll down to the "Your apps" section.
    *   If you haven't registered a web app, click the web icon (`</>`) to add one.
    *   Once your web app is registered, you'll find the `firebaseConfig` object. Copy the values from this object into your `.env` file.
    *   **Important for Firestore:** Ensure you have enabled Firestore in your Firebase project and set up appropriate security rules. For development, you can start with rules that allow reads/writes if authenticated:
        ```json
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId}/{document=**} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```

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
-   **`src/contexts/`**: React Context providers.
    -   `src/contexts/auth-context.tsx`: Manages user authentication state.
-   **`src/hooks/`**: Custom React hooks.
    -   `src/hooks/use-toast.ts`: Hook for displaying toast notifications.

## Troubleshooting Firebase API Key Error

If you encounter an error like `Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`:

1.  **Ensure `.env` is Correct:** Make sure you have a `.env` file in the root of your project (not `src/.env` or similar).
2.  **Correct Variable Names:** Verify that the environment variable names in your `.env` file start with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`). This prefix is required by Next.js to expose variables to the browser.
3.  **Accurate Credentials:** Double-check that all Firebase credentials in your `.env` file are copied correctly from your Firebase project settings. Even a small typo can cause this error.
4.  **Restart Development Server:** After creating or modifying the `.env` file, you **must** restart your Next.js development server for the changes to take effect.
    ```bash
    # Stop the server (Ctrl+C) then restart:
    npm run dev
    ```
5.  **Verify Firebase Project Setup:** Confirm that your Firebase project is correctly set up, the web app is registered, and the necessary services (Authentication, Firestore) are enabled.

If you are using the Google AI provider for Genkit, ensure `GENKIT_GOOGLEAI_API_KEY` is also set in your `.env` file if your Genkit setup relies on it.
