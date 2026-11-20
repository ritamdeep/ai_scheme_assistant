/**
 * ============================================================================
 * SEVA.AI STATIC AUDIO GENERATOR (scripts/generate-audio.ts)
 * ============================================================================
 * Generates static audio files for all 15 schemes across 4 supported languages:
 * English (en), Hindi (hi), Bengali (bn), Tamil (ta).
 *
 * Saves files to:
 *   public/audio/{lang}/{schemeId}/{section}.mp3
 *
 * Sections per scheme:
 *   - card: Scheme title + short benefit summary for scheme card
 *   - name: Scheme title
 *   - whatYouGet: Full benefit amount and explanation
 *   - whoCanApply: Eligibility criteria overview
 *   - documents: List of required documents
 *   - howToApply: Step-by-step application process
 *
 * MODEL: Uses Google Gemini's CURRENT GA Free-Tier Text-to-Speech model:
 *   "gemini-3.8-flash-lite-tts" (fallback: "gemini-3.8-flash-tts")
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { SCHEMES_DATA } from '../lib/schemes-data';

// Load API key from environment or .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  const m = content.match(/GEMINI_API_KEY=(.+)/);
  if (m) apiKey = m[1].trim();
}

if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is missing from environment and .env.local');
  process.exit(1);
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
];

const SECTIONS = ['card', 'name', 'whatYouGet', 'whoCanApply', 'documents', 'howToApply'] as const;
type SectionName = (typeof SECTIONS)[number];

const AUDIO_BASE_DIR = path.join(process.cwd(), 'public', 'audio');
const TRANSLATIONS_DIR = path.join(process.cwd(), 'data', 'translations');

// Gemini TTS models from environment variables
const TTS_PRIMARY_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';
const TTS_FALLBACK_MODEL = process.env.GEMINI_TTS_FALLBACK_MODEL || 'gemini-3.8-flash-tts';

const SECTION_HEADERS: Record<string, { documents: string; howToApply: string }> = {
  en: { documents: 'Required documents: ', howToApply: 'How to apply: ' },
  hi: { documents: 'आवश्यक दस्तावेज: ', howToApply: 'आवेदन प्रक्रिया: ' },
  bn: { documents: 'প্রয়োজনীয় কাগজপত্র: ', howToApply: 'আবেদন প্রক্রিয়া: ' },
  ta: { documents: 'தேவையான ஆவணங்கள்: ', howToApply: 'விண்ணப்பிக்கும் முறை: ' },
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSchemeTranslation(lang: string, schemeId: string): any {
  const filePath = path.join(TRANSLATIONS_DIR, lang, `${schemeId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.warn(`Could not parse translation file at ${filePath}`);
    }
  }

  // Fallback to English file or SCHEMES_DATA
  const baseScheme = SCHEMES_DATA.find((s) => s.id === schemeId);
  return {
    name: baseScheme?.name || schemeId,
    benefit_amount: baseScheme?.benefit_amount || baseScheme?.benefit_summary,
    benefit_summary: baseScheme?.benefit_summary || '',
    who_can_apply_intro: `All eligible citizens who meet the ${baseScheme?.name || ''} guidelines.`,
    required_documents: baseScheme?.required_documents || [
      'Aadhaar Card',
      'Bank Account Passbook',
      'Mobile Number',
    ],
    application_steps: [
      'Check that your Aadhaar card and active bank passbook are ready.',
      'Visit the official portal or your local Common Service Centre.',
      'Fill in the application details and complete your e-KYC.',
      'Receive your application reference number to track verification.',
    ],
  };
}

function buildSectionText(section: SectionName, trans: any, langCode: string = 'en'): string {
  const headers = SECTION_HEADERS[langCode] || SECTION_HEADERS.en;
  switch (section) {
    case 'card': {
      const summary = trans.benefit_summary ? trans.benefit_summary.slice(0, 140) : '';
      return `${trans.name}. ${summary}`;
    }
    case 'name':
      return trans.name;
    case 'whatYouGet': {
      const amount = trans.benefit_amount ? `${trans.benefit_amount}. ` : '';
      return `${amount}${trans.benefit_summary || ''}`;
    }
    case 'whoCanApply': {
      const intro = trans.who_can_apply_intro || 'Who can apply:';
      let criteria = '';
      if (trans.eligibility_templates) {
        criteria = Object.values(trans.eligibility_templates)
          .slice(0, 3)
          .join('. ')
          .replace(/\{[a-z_]+\}/g, '');
      }
      return `${intro} ${criteria}`.trim();
    }
    case 'documents': {
      const docs = Array.isArray(trans.required_documents)
        ? trans.required_documents.join('. ')
        : '';
      return `${headers.documents}${docs}`;
    }
    case 'howToApply': {
      const steps = Array.isArray(trans.application_steps)
        ? trans.application_steps.join('. ')
        : '';
      return `${headers.howToApply}${steps}`;
    }
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const exhaustedModels = new Set<string>();

async function generateTTSAudio(text: string, langCode: string): Promise<Buffer | null> {
  const models = [TTS_PRIMARY_MODEL, TTS_FALLBACK_MODEL].filter((m) => !exhaustedModels.has(m));
  const cleanText = text.trim();

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            input: [
              {
                type: 'user_input',
                content: [
                  {
                    type: 'text',
                    text: cleanText,
                  },
                ],
              },
            ],
            response_format: { type: 'audio' },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const audioContent = json.steps
          ?.flatMap((s: any) => s.content || [])
          ?.find((c: any) => c.type === 'audio' || c.data);

        if (audioContent?.data) {
          return Buffer.from(audioContent.data, 'base64');
        }
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || JSON.stringify(errJson);
        console.warn(
          `  ⚠️ TTS API returned HTTP ${res.status} with model "${model}":`,
          errMsg
        );
        if (res.status === 429) {
          if (errMsg.includes('requests per day')) {
            console.log(`  🚫 Model "${model}" daily quota exhausted. Skipping for remainder of run.`);
            exhaustedModels.add(model);
          } else {
            // Per-minute rate limit pause
            console.log('  ⏳ Rate limited. Waiting 12 seconds before retry...');
            await sleep(12000);
          }
        }
      }
    } catch (err: any) {
      console.warn(`  ⚠️ Exception calling model "${model}":`, err?.message || err);
    }
  }

  return null;
}

export async function generateAllAudio(limitPerLang?: number, targetLangs?: string[]) {
  const activeLanguages = targetLangs && targetLangs.length > 0
    ? LANGUAGES.filter((l) => targetLangs.includes(l.code.toLowerCase()))
    : LANGUAGES;

  console.log('================================================================');
  console.log('SEVA.AI STATIC AUDIO GENERATION');
  console.log(`Primary Model: ${TTS_PRIMARY_MODEL} (Current Free-Tier GA)`);
  console.log(`Fallback Model: ${TTS_FALLBACK_MODEL}`);
  console.log(`Languages: ${activeLanguages.map((l) => `${l.name} [${l.code}]`).join(', ')}`);
  console.log(`Total Schemes: ${SCHEMES_DATA.length}`);
  console.log(`Sections: ${SECTIONS.join(', ')}`);
  console.log('================================================================\n');

  ensureDir(AUDIO_BASE_DIR);

  const stats = {
    generated: 0,
    skipped: 0,
    failed: 0,
    byLanguage: {} as Record<string, { success: number; failed: number }>,
  };

  for (const lang of activeLanguages) {
    stats.byLanguage[lang.code] = { success: 0, failed: 0 };
    console.log(`\n▶ Processing Language: ${lang.name} [${lang.code}]...`);

    const schemesToProcess = limitPerLang
      ? SCHEMES_DATA.slice(0, limitPerLang)
      : SCHEMES_DATA;

    for (const scheme of schemesToProcess) {
      const schemeAudioDir = path.join(AUDIO_BASE_DIR, lang.code, scheme.id);
      ensureDir(schemeAudioDir);

      const trans = loadSchemeTranslation(lang.code, scheme.id);

      for (const section of SECTIONS) {
        const destFile = path.join(schemeAudioDir, `${section}.mp3`);

        if (fs.existsSync(destFile) && fs.statSync(destFile).size > 100) {
          stats.skipped++;
          stats.byLanguage[lang.code].success++;
          continue;
        }

        const text = buildSectionText(section, trans, lang.code);
        console.log(`  Generating audio: [${lang.code}] ${scheme.id}/${section}...`);

        const audioBuf = await generateTTSAudio(text, lang.code);
        if (audioBuf && audioBuf.length > 0) {
          fs.writeFileSync(destFile, audioBuf);
          stats.generated++;
          stats.byLanguage[lang.code].success++;
          console.log(`  ✓ Saved ${destFile} (${audioBuf.length} bytes)`);
        } else {
          stats.failed++;
          stats.byLanguage[lang.code].failed++;
          console.error(`  ❌ Failed to generate [${lang.code}] ${scheme.id}/${section}`);
        }

        // Small delay to respect rate limit
        await sleep(1500);
      }
    }
  }

  console.log('\n================================================================');
  console.log('AUDIO GENERATION SUMMARY:');
  console.log(`- Newly Generated: ${stats.generated}`);
  console.log(`- Skipped (Already existed): ${stats.skipped}`);
  console.log(`- Failed: ${stats.failed}`);
  for (const [code, counts] of Object.entries(stats.byLanguage)) {
    console.log(`- [${code}]: ${counts.success} available, ${counts.failed} failed`);
  }
  console.log('================================================================');
  return stats;
}

if (require.main === module) {
  // Support args: e.g. "tsx scripts/generate-audio.ts --langs bn,ta --limit 1"
  // or "npm run generate:audio -- 2"
  const args = process.argv.slice(2);
  let limitArg: number | undefined;
  let targetLangsArg: string[] | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--langs' && args[i + 1]) {
      targetLangsArg = args[i + 1].split(',').map((s) => s.trim().toLowerCase());
      i++;
    } else if (arg === '--limit' && args[i + 1]) {
      limitArg = parseInt(args[i + 1], 10);
      i++;
    } else if (!isNaN(parseInt(arg, 10)) && limitArg === undefined) {
      limitArg = parseInt(arg, 10);
    }
  }

  // Also support env var TARGET_LANGS
  if (!targetLangsArg && process.env.TARGET_LANGS) {
    targetLangsArg = process.env.TARGET_LANGS.split(',').map((s) => s.trim().toLowerCase());
  }

  generateAllAudio(limitArg, targetLangsArg).catch(console.error);
}
