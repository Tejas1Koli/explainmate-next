# UPSC Explain

This is a NextJS application built with Firebase Studio that provides AI-powered explanations for UPSC (Union Public Service Commission) exam-related questions.

## Core Features

- **Question Input**: Users can input their UPSC-related questions into a text area.
- **AI Explanation**: The application utilizes a GenAI flow to generate clear and student-friendly explanations for the submitted questions.
- **Explanation Display**: The generated explanation is displayed below the input area.

## Getting Started

To get started with development:

1.  Ensure you have Node.js and npm/yarn installed.
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will be available at `http://localhost:9002` (or another port if 9002 is occupied).

The main application logic can be found in `src/app/page.tsx` and the core UI component in `src/components/question-explainer.tsx`. The AI flow is located in `src/ai/flows/explain-upsc-question.ts`.
