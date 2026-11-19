import { Scheme, SchemeChunk, SourceCitation } from './types';

export interface RetrievedChunk {
  chunk: SchemeChunk;
  similarity: number;
}

// Chunks a scheme into semantic sections
export function getSchemeChunks(scheme: Scheme): SchemeChunk[] {
  const chunks: SchemeChunk[] = [];
  const lines = scheme.source_text.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentTitle = `${scheme.name} - General Overview`;
  let currentParagraphs: string[] = [];

  for (const line of lines) {
    if (
      line.endsWith(':') ||
      line.startsWith('Official') ||
      line.startsWith('Eligibility Criteria') ||
      line.startsWith('Exclusions') ||
      line.startsWith('Required Documents') ||
      line.startsWith('Components') ||
      line.startsWith('Benefit Structure') ||
      line.startsWith('Financial Assistance')
    ) {
      if (currentParagraphs.length > 0) {
        chunks.push({
          schemeId: scheme.id,
          schemeName: scheme.name,
          title: currentTitle,
          content: currentParagraphs.join('\n'),
        });
        currentParagraphs = [];
      }
      currentTitle = `${scheme.name} - ${line.replace(':', '')}`;
    } else {
      currentParagraphs.push(line);
    }
  }

  if (currentParagraphs.length > 0) {
    chunks.push({
      schemeId: scheme.id,
      schemeName: scheme.name,
      title: currentTitle,
      content: currentParagraphs.join('\n'),
    });
  }

  // Also include the required documents chunk explicitly
  chunks.push({
    schemeId: scheme.id,
    schemeName: scheme.name,
    title: `${scheme.name} - Official Required Documents & Application Portal`,
    content: `Required Documents for applying:\n- ${scheme.required_documents.join('\n- ')}\nOfficial Apply Portal: ${scheme.official_apply_url}\nBenefit Summary: ${scheme.benefit_summary}`,
  });

  return chunks;
}

// Tokenizer & Term frequency generator for fast, reliable semantic cosine similarity
function tokenize(text: string): Map<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF]/g, ' ') // Support Devanagari, Bengali, Tamil & English
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return freq;
}

// Compute cosine similarity between two term-frequency vectors
function computeCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const [, val] of vecA.entries()) {
    magA += val * val;
  }
  for (const [, val] of vecB.entries()) {
    magB += val * val;
  }

  if (magA === 0 || magB === 0) return 0;

  for (const [key, valA] of vecA.entries()) {
    const valB = vecB.get(key);
    if (valB) {
      dotProduct += valA * valB;
    }
  }

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Retrieve top-k chunks for a given query over a scheme's source text
export function retrieveTopChunks(
  scheme: Scheme,
  query: string,
  topK = 3,
  similarityThreshold = 0.08
): RetrievedChunk[] {
  const chunks = getSchemeChunks(scheme);
  const queryVec = tokenize(query);

  const scored: RetrievedChunk[] = chunks.map((chunk) => {
    const chunkVec = tokenize(`${chunk.title} ${chunk.content}`);
    const similarity = computeCosineSimilarity(queryVec, chunkVec);
    return { chunk, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);

  const results = scored.filter((s) => s.similarity >= similarityThreshold).slice(0, topK);

  if (results.length === 0 && chunks.length > 0) {
    return [
      {
        chunk: chunks[0],
        similarity: 0.1,
      },
    ];
  }

  return results;
}

// Check if a query is a greeting
export function isGreetingQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  const greetings = [
    'hello', 'hi', 'hey', 'namaste', 'namaskar', 'pranam', 'good morning', 'good evening',
    'নমস্কার', 'হ্যালো', 'হাই', 'কেমন আছেন',
    'नमस्ते', 'प्रणाम', 'नमस्कार', 'आप कैसे हैं',
    'வணக்கம்', 'ஹலோ',
    'నమస్కారం', 'హలో',
    'নমস্কাৰ'
  ];
  return greetings.some(g => q === g || q.startsWith(g + ' ') || q.endsWith(' ' + g));
}

// Check if a query is out-of-scope (unrelated to government schemes/welfare)
export function isOutOfScopeQuery(query: string, maxScore: number): boolean {
  if (isGreetingQuery(query)) return false;
  const q = query.toLowerCase();
  const schemeKeywords = [
    'scheme', 'yojana', 'prakalpa', 'thittam', 'pathakam', 'subsidy', 'aid', 'eligible',
    'apply', 'form', 'benefit', 'money', 'pension', 'loan', 'scholarship', 'farmer',
    'student', 'vendor', 'ration', 'bpl', 'health', 'insurance', 'doctor', 'hospital',
    'योजना', 'प्रकल्प', 'প্রকল্প', 'திட்டம்', 'పథకం', 'किसान', 'কৃষক', 'ছাত্র', 'छात्र'
  ];
  const hasKeyword = schemeKeywords.some(k => q.includes(k));
  return maxScore < 0.12 && !hasKeyword;
}

// Search across ALL schemes to find the top matching schemes for open conversational discovery
export function searchAllSchemes(
  query: string,
  schemes: Scheme[],
  topK = 3
): Array<{ scheme: Scheme; score: number; topChunk: SchemeChunk }> {
  const queryLower = query.toLowerCase();
  const queryVec = tokenize(query);

  const scoredSchemes = schemes.map((scheme) => {
    let score = 0;

    // 1. Keyword direct match in tags, name, category
    if (scheme.occupation_tags.some((t) => queryLower.includes(t.toLowerCase()))) {
      score += 0.45;
    }
    if (queryLower.includes(scheme.name.toLowerCase()) || (scheme.hindi_name && queryLower.includes(scheme.hindi_name))) {
      score += 0.5;
    }
    if (queryLower.includes('farmer') || queryLower.includes('किसान') || queryLower.includes('কৃষক')) {
      if (scheme.id === 'pm-kisan') score += 0.4;
    }
    if (queryLower.includes('student') || queryLower.includes('छात्र') || queryLower.includes('ছাত্র') || queryLower.includes('scholarship')) {
      if (scheme.id === 'pm-usp-scholarship' || scheme.id === 'nsigse-samagra') score += 0.4;
    }
    if (queryLower.includes('pension') || queryLower.includes('पेंशन') || queryLower.includes('senior') || queryLower.includes('65') || queryLower.includes('वृद्ध')) {
      if (scheme.id === 'ignoaps' || scheme.id === 'pm-sym') score += 0.4;
    }
    if (queryLower.includes('vendor') || queryLower.includes('रेहड़ी') || queryLower.includes('thela') || queryLower.includes('auto')) {
      if (scheme.id === 'pm-svanidhi') score += 0.4;
    }
    if (queryLower.includes('health') || queryLower.includes('hospital') || queryLower.includes('इलाज') || queryLower.includes('स्वास्थ्य')) {
      if (scheme.id === 'pm-jay' || scheme.id === 'cghs') score += 0.4;
    }

    // 2. Cosine similarity over scheme content
    const chunks = getSchemeChunks(scheme);
    let bestChunk = chunks[0];
    let bestSim = 0;

    for (const chunk of chunks) {
      const chunkVec = tokenize(`${chunk.title} ${chunk.content}`);
      const sim = computeCosineSimilarity(queryVec, chunkVec);
      if (sim > bestSim) {
        bestSim = sim;
        bestChunk = chunk;
      }
    }

    score += bestSim;

    return { scheme, score, topChunk: bestChunk };
  });

  scoredSchemes.sort((a, b) => b.score - a.score);
  return scoredSchemes.slice(0, topK);
}

// Convert scheme chunk to SourceCitation object
export function chunkToSourceCitation(scheme: Scheme, chunk: SchemeChunk): SourceCitation {
  return {
    id: `${scheme.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    documentTitle: `${scheme.name} Operational Guidelines`,
    schemeId: scheme.id,
    schemeName: scheme.name,
    ministry: scheme.ministry,
    sectionTitle: chunk.title.replace(`${scheme.name} - `, ''),
    excerpt: chunk.content.split('\n').filter(Boolean).slice(0, 3).join(' '),
    officialUrl: scheme.official_apply_url,
    sourceType: 'myscheme.gov.in',
  };
}

// Fuzzy matching for "Other" raw occupation against scheme occupation_tags
export function matchOccupationFuzzy(
  occupationRaw: string,
  scheme: Scheme,
  threshold = 0.25
): { isMatch: boolean; score: number } {
  if (!occupationRaw || !scheme.occupation_tags || scheme.occupation_tags.length === 0) {
    return { isMatch: false, score: 0 };
  }

  const userVec = tokenize(occupationRaw);
  const tagsText = scheme.occupation_tags.join(' ');
  const tagsVec = tokenize(tagsText);

  // 1. Direct keyword match
  const rawLower = occupationRaw.toLowerCase();
  for (const tag of scheme.occupation_tags) {
    if (rawLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(rawLower)) {
      return { isMatch: true, score: 0.95 };
    }
  }

  // 2. Cosine similarity against tag collection
  const score = computeCosineSimilarity(userVec, tagsVec);
  return {
    isMatch: score >= threshold,
    score,
  };
}
