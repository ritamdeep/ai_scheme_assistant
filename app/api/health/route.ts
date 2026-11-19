import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  const configuredPrimary = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const configuredFallback = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
  const configuredEmbedding = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

  if (!geminiKey) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'GEMINI_API_KEY is missing from environment variables (.env.local).',
        configured: {
          GEMINI_MODEL: configuredPrimary,
          GEMINI_FALLBACK_MODEL: configuredFallback,
          GEMINI_EMBEDDING_MODEL: configuredEmbedding,
        },
      },
      { status: 503 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const listResponse = await ai.models.list();

    const availableModels: Array<{ name: string; supportedActions: string[] }> = [];

    // Extract models from the iterator or page object
    if (listResponse && (listResponse as any).pageInternal) {
      const page = (listResponse as any).pageInternal || [];
      page.forEach((m: any) => {
        availableModels.push({
          name: (m.name || '').replace(/^models\//, ''),
          supportedActions: m.supportedActions || [],
        });
      });
    } else if (Symbol.asyncIterator in Object(listResponse)) {
      for await (const m of listResponse as any) {
        availableModels.push({
          name: (m.name || '').replace(/^models\//, ''),
          supportedActions: m.supportedActions || [],
        });
      }
    }

    const primaryFound = availableModels.find((m) => m.name === configuredPrimary);
    const fallbackFound = availableModels.find((m) => m.name === configuredFallback);
    const embeddingFound = availableModels.find((m) => m.name === configuredEmbedding);

    const primaryOk = !!primaryFound && primaryFound.supportedActions.includes('generateContent');
    const fallbackOk = !!fallbackFound && fallbackFound.supportedActions.includes('generateContent');
    const embeddingOk = !!embeddingFound && embeddingFound.supportedActions.includes('embedContent');

    const allOk = primaryOk && fallbackOk;

    const availableGenerateModels = availableModels
      .filter((m) => m.supportedActions.includes('generateContent'))
      .map((m) => m.name);

    const availableEmbedModels = availableModels
      .filter((m) => m.supportedActions.includes('embedContent'))
      .map((m) => m.name);

    const responsePayload = {
      status: allOk ? 'healthy' : 'misconfigured',
      timestamp: new Date().toISOString(),
      configured: {
        GEMINI_MODEL: configuredPrimary,
        GEMINI_FALLBACK_MODEL: configuredFallback,
        GEMINI_EMBEDDING_MODEL: configuredEmbedding,
      },
      checks: {
        apiKeyConfigured: true,
        primaryModel: {
          name: configuredPrimary,
          exists: !!primaryFound,
          supportsGenerateContent: primaryOk,
        },
        fallbackModel: {
          name: configuredFallback,
          exists: !!fallbackFound,
          supportsGenerateContent: fallbackOk,
        },
        embeddingModel: {
          name: configuredEmbedding,
          exists: !!embeddingFound,
          supportsEmbedContent: embeddingOk,
        },
      },
      recommendations: !allOk
        ? {
            recommendedChatModels: ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'],
            recommendedEmbeddingModels: ['gemini-embedding-001'],
          }
        : undefined,
      availableGenerateModelsCount: availableGenerateModels.length,
      availableEmbedModelsCount: availableEmbedModels.length,
    };

    return NextResponse.json(responsePayload, { status: allOk ? 200 : 503 });
  } catch (err: any) {
    console.error('[Health Check] Error calling ListModels:', err?.stack || err?.message || err);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to communicate with Google Gemini ListModels API.',
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
