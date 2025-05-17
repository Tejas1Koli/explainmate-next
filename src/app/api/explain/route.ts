
import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Timestamp } from 'firebase-admin/firestore';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // As requested: GEMINI_API_KEY
const MAX_REQUESTS = 5;
const TIME_WINDOW_SECONDS = 60;

if (!GEMINI_API_KEY) {
  console.error("Gemini API Key (GEMINI_API_KEY) is not set in environment variables.");
  // Potentially throw an error or handle this so the app doesn't try to run without it
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function POST(request: NextRequest) {
  if (!firebaseAdminAuth || !firebaseAdminFirestore) {
    console.error('Firebase Admin SDK not initialized.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  if (!genAI) {
    console.error('Gemini SDK not initialized due to missing API key.');
    return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 });
  }

  try {
    const { prompt, idToken } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required and must be a string.' }, { status: 400 });
    }
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Firebase ID token is required.' }, { status: 400 });
    }

    // 1. Verify Firebase Auth ID token
    let decodedToken;
    try {
      decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // 2. Rate Limiting
    const rateLimitCollectionRef = firebaseAdminFirestore.collection('rate_limits').doc(userId).collection('user_requests');
    const now = Timestamp.now();
    const windowStart = Timestamp.fromMillis(now.toMillis() - TIME_WINDOW_SECONDS * 1000);

    const requestsSnapshot = await rateLimitCollectionRef
      .where('timestamp', '>=', windowStart)
      .count()
      .get();

    const requestCount = requestsSnapshot.data().count;

    if (requestCount >= MAX_REQUESTS) {
      return NextResponse.json({ error: `Rate limit exceeded. Try again in ${TIME_WINDOW_SECONDS} seconds.` }, { status: 429 });
    }

    // If allowed, increment request count (by adding a new request document)
    await rateLimitCollectionRef.add({ timestamp: now });

    // 3. Call Gemini API
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using gemini-pro as a default
      const generationConfig = {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      };
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{text: prompt}] }],
        generationConfig,
        safetySettings,
      });
      
      if (result.response.promptFeedback && result.response.promptFeedback.blockReason) {
        console.warn('Gemini response blocked:', result.response.promptFeedback.blockReason);
        return NextResponse.json({ error: `Content generation blocked due to: ${result.response.promptFeedback.blockReason}` }, { status: 400 });
      }

      const geminiResponseText = result.response.text();
      return NextResponse.json({ explanation: geminiResponseText });

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return NextResponse.json({ error: 'Failed to get explanation from AI service.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in /api/explain POST handler:', error);
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
