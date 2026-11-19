import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Maximum allowed base64 audio payload size (~5MB raw audio)
const MAX_AUDIO_PAYLOAD_CHARS = 7 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Per-IP Rate Limiting (20 requests/minute)
    const clientIp = getClientIp(req.headers);
    const rateCheck = checkRateLimit(clientIp, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured for transcription.' },
        { status: 503 }
      );
    }

    let base64Audio = '';
    let mimeType = 'audio/webm';
    let langCode = 'en-IN';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('audio') as File | null;
      const langParam = formData.get('langCode') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'No audio file provided in form data' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      base64Audio = Buffer.from(arrayBuffer).toString('base64');
      mimeType = file.type || 'audio/webm';
      if (langParam) langCode = langParam;
    } else {
      const body = await req.json();
      base64Audio = body.audioBase64 || '';
      mimeType = body.mimeType || 'audio/webm';
      langCode = body.langCode || 'en-IN';
    }

    if (!base64Audio) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    if (base64Audio.length > MAX_AUDIO_PAYLOAD_CHARS) {
      return NextResponse.json(
        { error: 'Audio file exceeds the maximum size limit.' },
        { status: 400 }
      );
    }

    // Clean mime type (remove codecs=... suffix if present)
    const cleanMime = mimeType.split(';')[0].trim() || 'audio/webm';

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const langNameMap: Record<string, string> = {
      'en-IN': 'Indian English',
      'hi-IN': 'Hindi (हिन्दी)',
      'bn-IN': 'Bengali (বাংলা)',
      'ta-IN': 'Tamil (தமிழ்)',
    };
    const expectedLang = langNameMap[langCode] || langCode;

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: primaryModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: base64Audio,
                },
              },
              {
                text: `You are an accurate multilingual audio transcriber for Indian government civic services.
The user is speaking in ${expectedLang}.
Transcribe what the citizen said verbatim in that exact language and script.
Do NOT translate to English.
Do NOT add comments, explanations, formatting, or quotes.
Return ONLY the transcribed sentence(s).`,
              },
            ],
          },
        ],
      });
    } catch (primaryErr: any) {
      console.warn(`[SEVA AI Transcribe] Model ${primaryModel} failed, retrying with ${fallbackModel}:`, primaryErr?.message);
      response = await ai.models.generateContent({
        model: fallbackModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: base64Audio,
                },
              },
              {
                text: `You are an accurate multilingual audio transcriber for Indian government civic services.
The user is speaking in ${expectedLang}.
Transcribe what the citizen said verbatim in that exact language and script.
Do NOT translate to English.
Do NOT add comments, explanations, formatting, or quotes.
Return ONLY the transcribed sentence(s).`,
              },
            ],
          },
        ],
      });
    }

    const transcript = response.text?.trim() || '';

    return NextResponse.json({
      text: transcript,
      langCode,
    });
  } catch (error: any) {
    console.error('[SEVA AI Transcribe] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
