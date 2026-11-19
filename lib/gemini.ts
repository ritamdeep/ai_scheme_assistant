import { GoogleGenAI } from '@google/genai';
import { Scheme, SourceCitation, StructuredChatAnswer } from './types';
import { RetrievedChunk, chunkToSourceCitation } from './rag';
import { SCHEMES_DATA } from './schemes-data';

export interface RAGChatOptions {
  scheme?: Scheme | null;
  relevantSchemes?: Scheme[];
  userQuery: string;
  retrievedChunks: RetrievedChunk[];
  conversationHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  userProfileSummary?: string;
  missingFieldPrompt?: { fieldKey: string; questionText: string } | null;
  isOutOfScope?: boolean;
  isGreeting?: boolean;
}

export interface RAGResponse {
  answer: string;
  structuredAnswer?: StructuredChatAnswer | null;
  detectedLanguage: string;
  citations: string[];
  sources: SourceCitation[];
  providerUsed: string;
  modelUsed: string;
}

export function parseStructuredAnswer(
  raw: string,
  targetSchemeUrl?: string
): { structured: StructuredChatAnswer | null; fallbackText: string } {
  let clean = raw.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  clean = clean.trim();

  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === 'object' && (parsed.summary || parsed.benefit)) {
      const structured: StructuredChatAnswer = {
        summary: String(parsed.summary || '').trim(),
        benefit: String(parsed.benefit || '').trim(),
        documents: Array.isArray(parsed.documents)
          ? parsed.documents.map((d: any) => String(d).trim()).filter(Boolean)
          : [],
        next_step: String(parsed.next_step || '').trim(),
        source_url: parsed.source_url
          ? String(parsed.source_url).trim()
          : (targetSchemeUrl || undefined),
        follow_up_question: parsed.follow_up_question
          ? String(parsed.follow_up_question).trim()
          : null,
      };

      const parts = [
        structured.summary,
        structured.benefit ? `**What you get:** ${structured.benefit}` : '',
        structured.documents.length
          ? `**Documents you need:**\n${structured.documents.map((d) => `- ${d}`).join('\n')}`
          : '',
        structured.next_step ? `**Next step:** ${structured.next_step}` : '',
        structured.follow_up_question || '',
      ].filter(Boolean);

      return {
        structured,
        fallbackText: parts.join('\n\n'),
      };
    }
  } catch (e) {
    // If JSON parsing fails
  }

  // Fallback: sanitize raw markdown output (remove ### and --- symbols)
  const sanitized = raw
    .replace(/^###+\s*/gm, '') // Remove ### symbols
    .replace(/^---+$/gm, '') // Remove horizontal rules
    .trim();

  return {
    structured: null,
    fallbackText: sanitized,
  };
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

export function detectLikelyLanguage(query: string, activeLocale?: string): string {
  // 1. Devanagari script (Hindi)
  if (/[\u0900-\u097F]/.test(query)) return 'हिन्दी (Hindi)';
  // 2. Bengali script
  if (/[\u0980-\u09FF]/.test(query)) return 'বাংলা (Bengali)';
  // 3. Tamil script
  if (/[\u0B80-\u0BFF]/.test(query)) return 'தமிழ் (Tamil)';

  // 4. Romanized Hindi (Hinglish) heuristic (e.g., "Main ek kisan hun...", "mujhe pension chahiye")
  const HINGLISH_PATTERNS = [
    /\b(main|mein|mujhe|mera|meri|mere|hum|humein|aap|tum)\b/i,
    /\b(kisan|kisaan|kheti|yojana|yojna|pension|paise|labh)\b/i,
    /\b(kaise|kya|kyun|kab|kaha|kahan|kitna|kitni|kaun)\b/i,
    /\b(milega|milegi|milenge|karo|karna|hoga|hogi|chahiye)\b/i,
    /\b(sarkar|sarkari|aavedan|shuru|madad|batao|batayein)\b/i,
    /\b(hai|hain|hun|hoon|tha|the|thi|nahi|nahin)\b/i,
  ];
  const hinglishMatchCount = HINGLISH_PATTERNS.filter((pattern) => pattern.test(query)).length;
  const isExplicitHinglish =
    hinglishMatchCount >= 2 ||
    /\b(main ek kisan hun|mujhe yojana chahiye|kisan yojana|pension kaise|pm kisan kaise)\b/i.test(query);

  if (isExplicitHinglish && activeLocale !== 'bn' && activeLocale !== 'ta') {
    return 'हिन्दी (Hindi)';
  }

  return 'English';
}

export async function detectChatLanguage(
  query: string,
  geminiKey?: string,
  activeLocale?: string
): Promise<string> {
  // 1. Immediate script & Hinglish detection
  const fastDetect = detectLikelyLanguage(query, activeLocale);
  if (fastDetect !== 'English') {
    return fastDetect;
  }

  // 2. If Latin script and language is unclear (e.g. subtle Hinglish/regional phrasing), ask Gemini
  if (geminiKey && query.trim().length > 3) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `Classify the language of this user query into exactly one of: "English", "Hindi", "Bengali", "Tamil".
CRITICAL: If the query is written in romanized Hindi / Hinglish (e.g. "Main ek kisan hun", "mujhe scheme chahiye", "kheti ke liye loan"), classify it as "Hindi".
Query: "${query.slice(0, 200)}"
Respond with ONLY the single language name: English, Hindi, Bengali, or Tamil.`;

      const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
      const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';

      let resText = '';
      try {
        const res = await ai.models.generateContent({
          model: primaryModel,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        resText = res.text?.trim() || '';
      } catch (primaryErr) {
        console.warn(`[SEVA AI] Language detect failed on ${primaryModel}, trying fallback ${fallbackModel}`);
        const res = await ai.models.generateContent({
          model: fallbackModel,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        resText = res.text?.trim() || '';
      }

      const detected = resText.toLowerCase();
      if (detected.includes('hindi')) return 'हिन्दी (Hindi)';
      if (detected.includes('bengali') || detected.includes('bangla')) return 'বাংলা (Bengali)';
      if (detected.includes('tamil')) return 'தமிழ் (Tamil)';
    } catch (e) {
      console.warn('[SEVA AI] Gemini language classification fallback warning:', e);
    }
  }

  return 'English';
}

/**
 * Executes a REAL call to the configured LLM provider (Google Gemini or Groq).
 * NEVER falls back to hardcoded, static, or canned responses.
 * If API keys are missing or provider fails, throws an explicit error for the UI.
 */
export async function generateRAGAnswer(options: RAGChatOptions): Promise<RAGResponse> {
  const {
    scheme,
    relevantSchemes,
    userQuery,
    retrievedChunks,
    conversationHistory = [],
    userProfileSummary,
    missingFieldPrompt,
    isOutOfScope,
    isGreeting,
  } = options;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  const groqKey = process.env.GROQ_API_KEY || '';

  console.log('[SEVA AI Backend] ──────────────────────────────────────────────────');
  console.log(`[SEVA AI Backend] 1. Request received: "${userQuery}"`);

  // Verify that an LLM provider is configured FIRST
  if (!geminiKey && !groqKey) {
    console.error('[SEVA AI Backend] ERROR: Neither GEMINI_API_KEY nor GROQ_API_KEY is configured in environment.');
    throw new Error(
      'LLM configuration is missing. Please set GEMINI_API_KEY or GROQ_API_KEY in your .env.local file to enable genuine AI responses.'
    );
  }

  const detectedLang = await detectChatLanguage(userQuery, geminiKey);
  console.log(`[SEVA AI Backend] 2. Language detected: ${detectedLang}`);

  const targetSchemes = scheme ? [scheme] : relevantSchemes || [];
  const primarySchemeName = scheme
    ? scheme.name
    : targetSchemes.map((s) => s.name).join(', ') || 'Government Schemes';

  console.log(`[SEVA AI Backend] 3. RAG retrieval attempted: ${retrievedChunks.length} chunks retrieved`);
  retrievedChunks.forEach((r, idx) => {
    console.log(`     [Chunk ${idx + 1}] ${r.chunk.schemeName} - "${r.chunk.title}" (similarity: ${r.similarity.toFixed(3)})`);
  });

  const sources: SourceCitation[] = retrievedChunks
    .slice(0, 4)
    .map((r) => {
      const s =
        targetSchemes.find((sc) => sc.name === r.chunk.schemeName) ||
        SCHEMES_DATA.find((sc) => sc.name === r.chunk.schemeName) ||
        SCHEMES_DATA.find((sc) => sc.id === r.chunk.schemeId) ||
        targetSchemes[0] ||
        SCHEMES_DATA[0];
      return s ? chunkToSourceCitation(s, r.chunk) : null;
    })
    .filter((s): s is SourceCitation => s !== null);

  const contextText = retrievedChunks
    .map((r, i) => `[Document ${i + 1}: ${r.chunk.schemeName} - ${r.chunk.title}]\n${r.chunk.content}`)
    .join('\n\n');

  // Build the strict civic grounding system instruction
  const primarySchemeUrl = targetSchemes[0]?.official_apply_url || 'https://myscheme.gov.in';

  const systemInstruction = `You are SEVA AI, the official Multilingual Citizen Scheme Assistant for Indian Government Schemes (Origin Hackathon PS-2).
Your role is to assist Indian citizens in discovering welfare schemes, understanding preliminary eligibility, and preparing required documents.

CRITICAL INSTRUCTIONS:
1. STRICT TRUTH & GROUNDING:
   - Base your facts exclusively on the verified official scheme context provided below.
   - Do NOT hallucinate eligibility criteria, financial amounts, or deadlines.
   - Write numbers and currency amounts (₹) accurately; NEVER invent figures not present in the verified context.
2. SCOPE & GENERAL QUESTIONS:
   ${
     isGreeting
       ? '- The citizen is greeting you. Greet them warmly and respectfully in their language, and guide them to find schemes for farming, pensions, students, health, or jobs.'
       : ''
   }
   ${
     isOutOfScope
       ? '- The citizen is asking about an unrelated topic (e.g. sports, entertainment). Politely guide them back to Indian Government welfare schemes.'
       : ''
   }
3. MULTILINGUAL RESPONSES:
   - The citizen's detected language is: ${detectedLang}.
   - SEVA.AI officially supports 4 languages: English, Hindi (हिन्दी), Bengali (বাংলা), and Tamil (தமிழ்).
   - ALWAYS reply in that EXACT same language with natural, culturally respectful phrasing at a simple Grade-5 reading level.
   - CRITICAL FOR HINDI / HINGLISH: If the citizen writes in romanized Hindi (Hinglish, e.g. "Main ek kisan hun...", "mujhe pension chahiye"), ALWAYS answer in simple, pure Hindi using Devanagari script (हिन्दी), unless they explicitly selected another regional language. NEVER reply in romanized Latin script (Hinglish).
4. RESPONSE STRUCTURE & JSON FORMAT:
   - You MUST respond with a single, strictly valid JSON object matching this exact schema:
{
  "summary": "Short 1-line core answer to the user's question (max 25 words).",
  "benefit": "What you get (financial assistance, pension, subsidy). Use **bold** for key amounts (e.g. **₹6,000 per year**).",
  "documents": ["Aadhaar Card", "Bank Account Passbook", "Active Mobile Number"],
  "next_step": "Actionable next step on where and how to apply (e.g. visit local CSC centre, Panchayat office, or official portal).",
  "source_url": "${primarySchemeUrl}",
  "follow_up_question": ${missingFieldPrompt ? `"${missingFieldPrompt.questionText}"` : 'null'}
}

FORMAT RULES:
- Keep the entire answer short: maximum about 120 words total.
- Do NOT use markdown headings (no #, ##, ###) and do NOT use horizontal rules (no ---).
- Use **bold** ONLY for key facts, numbers, and amounts.
- Write amounts and numbers in the same numerals as the rest of the text.
- Return ONLY the JSON object. Do not wrap in markdown fences.`;

  const promptWithContext = `VERIFIED GOVERNMENT SCHEME CONTEXT:
${contextText || 'No specific scheme documents retrieved for this general query.'}

CITIZEN PROFILE INFORMATION:
${userProfileSummary || 'General citizen inquiry (No detailed profile provided)'}

CURRENT CITIZEN QUESTION:
"${userQuery}"

Return the JSON response now:`;

  // -------------------------------------------------------------
  // Provider 1: Google Gemini (@google/genai)
  // -------------------------------------------------------------
  if (geminiKey) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
    const candidateModels = [primaryModel, fallbackModel].filter(Boolean);

    console.log(`[SEVA AI Backend] 4. Calling Google Gemini API (Primary: "${primaryModel}", Fallback: "${fallbackModel}")`);

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // Format conversation history for Gemini multi-turn format
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Add prior conversation turns (capped at last 6 turns for optimal context)
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      if (!msg.text || !msg.text.trim()) continue;
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    // Add current turn with full system instruction and retrieved context
    contents.push({
      role: 'user',
      parts: [{ text: `${systemInstruction}\n\n${promptWithContext}` }],
    });

    let lastGeminiError: any = null;

    for (const model of candidateModels) {
      try {
        console.log(`[SEVA AI Backend] Calling Gemini model: "${model}"...`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text?.trim();
        if (rawText) {
          const { structured, fallbackText } = parseStructuredAnswer(rawText, primarySchemeUrl);
          console.log(`[SEVA AI Backend] 5. LLM response received successfully (${fallbackText.length} chars) from ${model}`);
          console.log(`[SEVA AI Backend] 6. Returning response to frontend.`);
          return {
            answer: fallbackText,
            structuredAnswer: structured,
            detectedLanguage: detectedLang,
            citations: targetSchemes.map((s) => s.name),
            sources,
            providerUsed: 'Google Gemini',
            modelUsed: model,
          };
        }
      } catch (err: any) {
        lastGeminiError = err;
        // Log the full technical error & stack trace on the server only
        console.error(`[SEVA AI Backend] Gemini model "${model}" failed (HTTP / API error):`, err?.stack || err?.message || err);
      }
    }

    console.error('[SEVA AI Backend] All configured Gemini models failed. Proceeding to safe fallback response.');
  }

  // -------------------------------------------------------------
  // Provider 2: Groq (via OpenAI-compatible completions endpoint)
  // -------------------------------------------------------------
  if (groqKey) {
    const groqModel = 'llama-3.3-70b-versatile';
    console.log(`[SEVA AI Backend] 4. Calling Groq API with model "${groqModel}"`);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemInstruction },
    ];

    // Add conversation history
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      if (!msg.text || !msg.text.trim()) continue;
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    // Current turn with context
    messages.push({
      role: 'user',
      content: promptWithContext,
    });

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModel,
          messages,
          temperature: 0.2,
          max_tokens: 1000,
        }),
      });

      if (!groqRes.ok) {
        const errData = await groqRes.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Groq API returned HTTP ${groqRes.status}`);
      }

      const groqData = await groqRes.json();
      const rawText = groqData?.choices?.[0]?.message?.content?.trim();

      if (rawText) {
        const { structured, fallbackText } = parseStructuredAnswer(rawText, primarySchemeUrl);
        console.log(`[SEVA AI Backend] 5. LLM response received successfully (${fallbackText.length} chars) from Groq`);
        console.log(`[SEVA AI Backend] 6. Returning response to frontend.`);
        return {
          answer: fallbackText,
          structuredAnswer: structured,
          detectedLanguage: detectedLang,
          citations: targetSchemes.map((s) => s.name),
          sources,
          providerUsed: 'Groq',
          modelUsed: groqModel,
        };
      } else {
        throw new Error('Groq returned empty text response');
      }
    } catch (err: any) {
      console.error('[SEVA AI Backend] Groq API call error:', err);
    }
  }

  // Safe friendly fallback message without exposing raw API errors or stack traces to the user
  const friendlyMessages: Record<string, string> = {
    en: 'SEVA AI is temporarily busy. Please try asking your question again in a moment, or visit your nearest Common Service Centre (CSC) for official guidance.',
    hi: 'सेवा एआई अभी व्यस्त है। कृपया कुछ क्षण बाद पुनः प्रयास करें, या आधिकारिक सहायता के लिए अपने नजदीकी सीएससी (CSC) केंद्र पर जाएं।',
    bn: 'সেবা এআই এই মুহূর্তে ব্যস্ত রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন, অথবা নিকটবর্তী সিএসসি কেন্দ্রে যোগাযোগ করুন।',
    ta: 'சேவா ஏஐ சேவை தற்போது மிகவும் பிஸியாக உள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும், அல்லது அருகிலுள்ள இ-சேவை மையத்தை அணுகவும்.',
  };

  const detectedLower = detectedLang.toLowerCase();
  const langKey = detectedLower.includes('hindi')
    ? 'hi'
    : detectedLower.includes('bengali') || detectedLower.includes('bangla')
    ? 'bn'
    : detectedLower.includes('tamil')
    ? 'ta'
    : 'en';

  const friendlyText = friendlyMessages[langKey] || friendlyMessages.en;

  return {
    answer: friendlyText,
    structuredAnswer: {
      summary: friendlyText,
      benefit: '',
      documents: [],
      next_step: 'Please visit your nearest CSC or local Panchayat office for immediate scheme assistance.',
      source_url: primarySchemeUrl,
      follow_up_question: null,
    },
    detectedLanguage: detectedLang,
    citations: targetSchemes.map((s) => s.name),
    sources,
    providerUsed: 'Safe Civic Fallback',
    modelUsed: 'none',
  };
}
