import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// In-memory cache for fast repeated plays (no runtime disk writes on serverless)
const memoryAudioCache = new Map<string, Buffer>();

// Maximum allowed character length for real-time speech generation
const MAX_TTS_TEXT_LENGTH = 1000;

// Map BCP-47 / language codes to standard 4 codes
function normalizeLangCode(lang: string): string {
  const l = (lang || 'en').toLowerCase().trim();
  if (l.startsWith('bn')) return 'bn-IN';
  if (l.startsWith('ta')) return 'ta-IN';
  if (l.startsWith('hi')) return 'hi-IN';
  return 'en-IN';
}

export async function POST(req: NextRequest) {
  try {
    // Per-IP Rate Limiting (30 requests/minute)
    const clientIp = getClientIp(req.headers);
    const rateCheck = checkRateLimit(clientIp, 30, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }
    const body = await req.json();
    const { text, langCode } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const cleanText = text.trim();
    if (cleanText.length > MAX_TTS_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum allowed length of ${MAX_TTS_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const normalizedLang = normalizeLangCode(langCode);

    // Cache key: sha256 hash of lang + text
    const hash = crypto
      .createHash('sha256')
      .update(`${normalizedLang}:${cleanText}`)
      .digest('hex');

    // 1. Check in-memory cache
    if (memoryAudioCache.has(hash)) {
      const cached = memoryAudioCache.get(hash)!;
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': cached.length.toString(),
          'Cache-Control': 'public, max-age=604800, immutable',
          'X-TTS-Source': 'memory-cache',
        },
      });
    }

    // 2. Fallback to Gemini TTS (Try gemini-3.8-flash-lite-tts first, then gemini-3.8-flash-tts)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (!geminiKey) {
      console.warn('[SEVA AI TTS] GEMINI_API_KEY is not configured for TTS fallback.');
      return NextResponse.json(
        { error: 'TTS API key is not configured' },
        { status: 503 }
      );
    }

    const ttsCandidateModels = [
      process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts',
      process.env.GEMINI_TTS_FALLBACK_MODEL || 'gemini-3.8-flash-tts',
    ].filter(Boolean);
    let audioBuffer: Buffer | null = null;
    let ttsSource = 'gemini-tts';

    for (const model of ttsCandidateModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            input: [{
              type: 'user_input',
              content: [{
                type: 'text',
                text: cleanText,
              }],
            }],
            response_format: { type: 'audio' },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const audioContent = json.steps
            ?.flatMap((s: any) => s.content || [])
            ?.find((c: any) => c.type === 'audio' || c.data);

          if (audioContent?.data) {
            audioBuffer = Buffer.from(audioContent.data, 'base64');
            ttsSource = model;
            break;
          }
        } else {
          const errData = await res.json().catch(() => null);
          console.warn(`[SEVA AI TTS] Model "${model}" failed (HTTP ${res.status}):`, errData?.error?.message || errData);
        }
      } catch (err) {
        console.warn(`[SEVA AI TTS] Model "${model}" exception:`, err);
      }
    }

    // 4. Optional Bhashini TTS fallback if configured
    if (!audioBuffer && process.env.BHASHINI_API_KEY && process.env.BHASHINI_USER_ID) {
      try {
        const bhashiniRes = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.BHASHINI_API_KEY,
            'userID': process.env.BHASHINI_USER_ID,
          },
          body: JSON.stringify({
            pipelineTasks: [
              {
                taskType: 'tts',
                config: {
                  language: { sourceLanguage: normalizedLang.slice(0, 2) },
                  gender: 'female',
                  samplingRate: 22050,
                },
              },
            ],
            inputData: {
              input: [{ source: cleanText }],
            },
          }),
        });

        if (bhashiniRes.ok) {
          const bData = await bhashiniRes.json();
          const bAudioBase64 = bData.pipelineResponse?.[0]?.output?.[0]?.audio?.[0]?.audioContent;
          if (bAudioBase64) {
            audioBuffer = Buffer.from(bAudioBase64, 'base64');
            ttsSource = 'bhashini-tts';
          }
        }
      } catch (bErr) {
        console.warn('[SEVA AI TTS] Bhashini fallback failed:', bErr);
      }
    }

    if (!audioBuffer) {
      return NextResponse.json(
        { error: 'Failed to synthesize audio for requested language' },
        { status: 502 }
      );
    }

    // Save to memory cache (fast, non-blocking, zero disk writes on serverless)
    memoryAudioCache.set(hash, audioBuffer);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-TTS-Source': ttsSource,
      },
    });
  } catch (error: any) {
    console.error('[SEVA AI TTS] Server error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal TTS server error' },
      { status: 500 }
    );
  }
}
