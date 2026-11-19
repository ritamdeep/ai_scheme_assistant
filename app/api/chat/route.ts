import { NextRequest, NextResponse } from 'next/server';
import { SCHEMES_DATA } from '@/lib/schemes-data';
import { retrieveTopChunks, searchAllSchemes, isGreetingQuery, isOutOfScopeQuery, chunkToSourceCitation } from '@/lib/rag';
import { generateRAGAnswer, detectLikelyLanguage } from '@/lib/gemini';
import { evaluateEligibility } from '@/lib/rule-engine';
import { UserProfile, Scheme } from '@/lib/types';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Maximum allowed input length for chat queries
const MAX_INPUT_LENGTH = 500;

// In-memory answer cache: key = `${lang}:${normalizedQuery}:${schemeId}`
interface CachedAnswer {
  response: any;
  timestamp: number;
}
const chatAnswerCache = new Map<string, CachedAnswer>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function normalizeQueryForCache(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[?!.,।॥]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Per-IP Rate Limiting (30 requests per minute)
    const clientIp = getClientIp(req.headers);
    const rateCheck = checkRateLimit(clientIp, 30, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment before asking again.',
          resetMs: rateCheck.resetMs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { schemeId, message, userProfile, conversationHistory } = body;

    // 2. Input validation & Maximum Input Length enforcement
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'User message is required.' },
        { status: 400 }
      );
    }

    if (message.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `Question exceeds maximum allowed length of ${MAX_INPUT_LENGTH} characters. Please shorten your question.`,
        },
        { status: 400 }
      );
    }

    // 3. Check (Question + Language) Cache
    const detectedLang = detectLikelyLanguage(message);
    const normalizedQuery = normalizeQueryForCache(message);
    const cacheKey = `${detectedLang}:${schemeId || 'all'}:${normalizedQuery}`;

    const cached = chatAnswerCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.response, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const currentProfile: UserProfile = userProfile || {
      name: 'Citizen',
      age: 35,
      annual_income: 180000,
      occupation: 'Other',
      state: 'All India',
      gender: 'any',
      special_conditions: [],
    };

    const profileSummary = `Age: ${currentProfile.age ?? 'Not specified'}, Income: ₹${currentProfile.annual_income?.toLocaleString('en-IN') ?? 'Not specified'}, Occupation: ${currentProfile.occupation === 'Other' ? currentProfile.occupation_raw || 'Other' : currentProfile.occupation}, State: ${currentProfile.state}, Land: ${currentProfile.land_holding_acres !== null && currentProfile.land_holding_acres !== undefined ? currentProfile.land_holding_acres + ' acres' : 'Unknown'}`;

    const isGreeting = isGreetingQuery(message);

    // Case 1: Specific Scheme Q&A
    if (schemeId && schemeId !== 'all') {
      const scheme = SCHEMES_DATA.find((s) => s.id === schemeId);
      if (!scheme) {
        return NextResponse.json({ error: 'Scheme not found.' }, { status: 404 });
      }

      const verdict = evaluateEligibility(scheme, currentProfile);
      const retrievedChunks = retrieveTopChunks(scheme, message, 3);

      const ragResult = await generateRAGAnswer({
        scheme,
        userQuery: message,
        retrievedChunks,
        conversationHistory,
        userProfileSummary: profileSummary,
        missingFieldPrompt: verdict.status === 'Needs More Info' ? verdict.missingFieldPrompt : null,
        isGreeting,
      });

      const responsePayload = {
        answer: ragResult.answer,
        reply: ragResult.answer, // Guarantee compatibility with both keys
        structuredAnswer: ragResult.structuredAnswer,
        detectedLanguage: ragResult.detectedLanguage,
        citations: ragResult.citations,
        sources: ragResult.sources,
        verdict,
        relevantSchemes: [{ scheme, verdict }],
        retrievedChunkCount: retrievedChunks.length,
        providerUsed: ragResult.providerUsed,
        modelUsed: ragResult.modelUsed,
      };

      // Store in answer cache
      chatAnswerCache.set(cacheKey, {
        response: responsePayload,
        timestamp: Date.now(),
      });

      return NextResponse.json(responsePayload, {
        headers: { 'X-Cache': 'MISS' },
      });
    }

    // Case 2: Global Cross-Scheme Discovery Query
    const matchedSchemesResult = searchAllSchemes(message, SCHEMES_DATA, 3);
    const topScore = matchedSchemesResult[0]?.score || 0;
    const isOutOfScope = isOutOfScopeQuery(message, topScore);

    const candidateSchemes = isOutOfScope || isGreeting ? [] : matchedSchemesResult.map((m) => m.scheme);

    const relevantSchemesWithVerdicts = candidateSchemes.map((scheme) => ({
      scheme,
      verdict: evaluateEligibility(scheme, currentProfile),
    }));

    // Collect top chunks from each matched scheme if relevant
    const combinedChunks = isOutOfScope || isGreeting
      ? []
      : matchedSchemesResult.map((m) => ({
          chunk: m.topChunk,
          similarity: m.score,
        }));

    const primaryScheme = candidateSchemes[0] || null;
    const topVerdict = relevantSchemesWithVerdicts[0]?.verdict;

    const ragResult = await generateRAGAnswer({
      scheme: candidateSchemes.length === 1 ? primaryScheme : null,
      relevantSchemes: candidateSchemes,
      userQuery: message,
      retrievedChunks: combinedChunks,
      conversationHistory,
      userProfileSummary: profileSummary,
      missingFieldPrompt: topVerdict?.status === 'Needs More Info' ? topVerdict.missingFieldPrompt : null,
      isGreeting,
      isOutOfScope,
    });

    const responsePayload = {
      answer: ragResult.answer,
      reply: ragResult.answer, // Guarantee compatibility with both keys
      structuredAnswer: ragResult.structuredAnswer,
      detectedLanguage: ragResult.detectedLanguage,
      citations: ragResult.citations,
      sources: ragResult.sources,
      verdict: topVerdict,
      relevantSchemes: relevantSchemesWithVerdicts,
      retrievedChunkCount: combinedChunks.length,
      providerUsed: ragResult.providerUsed,
      modelUsed: ragResult.modelUsed,
    };

    // Store in answer cache
    chatAnswerCache.set(cacheKey, {
      response: responsePayload,
      timestamp: Date.now(),
    });

    return NextResponse.json(responsePayload, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error: any) {
    console.error('[SEVA AI Backend] API /api/chat error:', error?.stack || error?.message || error);
    const isConfigError = error?.message?.includes('LLM configuration is missing');
    if (isConfigError) {
      return NextResponse.json(
        {
          error: 'AI service configuration is missing. Please check GEMINI_API_KEY in your environment.',
          isConfigError: true,
        },
        { status: 400 }
      );
    }

    // Never expose raw technical error messages, 404s, or stack traces in chat
    return NextResponse.json(
      {
        answer: 'SEVA AI is temporarily busy. Please try asking your question again in a moment, or visit your nearest Common Service Centre (CSC) for official guidance.',
        reply: 'SEVA AI is temporarily busy. Please try asking your question again in a moment, or visit your nearest Common Service Centre (CSC) for official guidance.',
        structuredAnswer: {
          summary: 'SEVA AI is temporarily busy. Please try asking your question again in a moment.',
          benefit: '',
          documents: [],
          next_step: 'Please visit your nearest CSC or local Panchayat office for official scheme assistance.',
          source_url: 'https://myscheme.gov.in',
          follow_up_question: null,
        },
        citations: [],
        sources: [],
      },
      { status: 200 }
    );
  }
}
