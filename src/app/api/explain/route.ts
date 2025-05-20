
import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Timestamp } from 'firebase-admin/firestore';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // As requested: GEMINI_API_KEY
const MAX_REQUESTS = 5;
const TIME_WINDOW_SECONDS = 60;

if (!GEMINI_API_KEY) {
  console.error("Gemini API Key (GEMINI_API_KEY) is not set in environment variables.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const genZSystemPrompt = `You are an AI assistant explaining STEM concepts. Your audience is Gen Z.
Your tone should be casual, relatable, engaging, and fun. Use clear language, and if appropriate, sprinkle in some relevant Gen Z slang (like "no cap", "bet", "rizz", "iykyk", "the gag is", "periodt", "vibe check", "main character energy") and emojis (like ✨, 💅, 🧠, 🚀, 🤔, 😅).
Explain concepts as if you're talking to a friend. Make it understandable and low-key entertaining.
Structure your explanation well. Use Markdown for formatting:
- **Headings**: Use Markdown headings (e.g., \`## Sub-topic\`). Start with H2 or H3 for main sections.
- **Emphasis**: Use bold (\`**text**\`) for key terms or important points, and italics (\`*text*\`) for emphasis.
- **Lists**: Use bullet points (\`- point\`) or numbered lists (\`1. point\`).
- **Mathematical Expressions**: For any math, use LaTeX. Inline: \`$...$\`. Block: \`$$...$$\`.
Keep it real and make learning feel like less of a chore and more of a glow-up for their brain!  Glow up that explanation!`;

export async function POST(request: NextRequest) {
  if (!firebaseAdminAuth || !firebaseAdminFirestore) {
    console.error('Firebase Admin SDK not initialized.');
    return NextResponse.json({ error: 'Server configuration error. Kinda sus.' }, { status: 500 });
  }
  if (!genAI) {
    console.error('Gemini SDK not initialized due to missing API key. That\'s a major L.');
    return NextResponse.json({ error: 'AI service not configured. Sadge.' }, { status: 500 });
  }

  try {
    const { prompt, idToken } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required and must be a string. Spill the tea on what you need explained!' }, { status: 400 });
    }
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Firebase ID token is required. Gotta log in, bestie.' }, { status: 400 });
    }

    // 1. Verify Firebase Auth ID token
    let decodedToken;
    try {
      decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return NextResponse.json({ error: 'Invalid authentication token. This ain\'t it, chief.' }, { status: 401 });
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
      return NextResponse.json({ error: `Rate limit exceeded. You're doing too much! Try again in ${TIME_WINDOW_SECONDS} seconds. Chill for a bit. 💅` }, { status: 429 });
    }

    // If allowed, increment request count (by adding a new request document)
    await rateLimitCollectionRef.add({ timestamp: now });

    // 3. Call Gemini API
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        systemInstruction: genZSystemPrompt, // Added system instruction for Gen Z tone
      }); 
      const generationConfig = {
        temperature: 0.7, // A bit of creativity but still factual
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
        return NextResponse.json({ error: `Content generation blocked due to: ${result.response.promptFeedback.blockReason}. Oof, AI said no. 😬` }, { status: 400 });
      }

      const geminiResponseText = result.response.text();
      return NextResponse.json({ explanation: geminiResponseText });

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return NextResponse.json({ error: 'Failed to get explanation from AI service. The AI is having a moment, try again later.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in /api/explain POST handler:', error);
    return NextResponse.json({ error: 'An unexpected server error occurred. Server said 📉.' }, { status: 500 });
  }
}

