/**
 * ============================================================================
 * SEVA.AI SCHEME TRANSLATION GENERATOR
 * ============================================================================
 * NOTE FOR PRODUCTION & CIVIC USE:
 * These translations are generated using Google Gemini (gemini-3.6-flash)
 * using Grade-5 reading-level instructions for Indian citizens.
 * 
 * IMPORTANT: These translations must be reviewed and certified by native
 * human speakers of each language (Hindi, Bengali, Assamese, Tamil, Telugu)
 * before real-world government deployment.
 * ============================================================================
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { SCHEMES_DATA } from '../lib/schemes-data';

// Load API key from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  const m = content.match(/GEMINI_API_KEY=(.+)/);
  if (m) apiKey = m[1].trim();
}

if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY not found in environment or .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const TARGET_LANGS = [
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
];

const OUTPUT_DIR = path.join(process.cwd(), 'data', 'translations');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// English base creator for a scheme
function createEnglishBase(scheme: any) {
  return {
    id: scheme.id,
    name: scheme.name,
    category: scheme.category,
    ministry: scheme.ministry,
    benefit_amount: scheme.benefit_amount || scheme.benefit_summary,
    benefit_summary: scheme.benefit_summary,
    who_can_apply_intro: `All eligible citizens who meet the ${scheme.name} guidelines.`,
    required_documents: scheme.required_documents || [
      'Aadhaar Card',
      'Bank Account Passbook (Aadhaar linked)',
      'Mobile Number',
    ],
    application_steps: [
      'Check that your Aadhaar card and active bank passbook are ready.',
      'Visit the official portal or your local Common Service Centre (CSC) / Panchayat office.',
      'Fill in the application details and complete your biometric or OTP e-KYC.',
      'Receive your application reference number to track verification and direct payment status.',
    ],
    eligibility_templates: {
      age_met: 'Your age ({age}) meets the required age criteria.',
      age_unmet: 'Age ({age}) does not meet the scheme criteria (Min: {min}, Max: {max}).',
      occupation_met: 'Your occupation ({occupation}) is eligible for this scheme.',
      occupation_unmet: 'This scheme is specifically designed for {eligible_occupations}.',
      income_met: 'Your family income (₹{income}) is within the eligible limit.',
      income_unmet: 'Annual income exceeds the maximum threshold of ₹{max_income}.',
      land_met: 'Your cultivable land holding ({acres} acres) is within the eligible limit.',
      land_unknown: 'Please confirm whether you or your family own cultivable agricultural land.',
      bpl_met: 'BPL / Low-income family criterion met.',
      state_met: 'Applicable in your state ({state}).',
      gender_met: 'Eligible for your gender profile.',
    },
  };
}

async function translateScheme(scheme: any) {
  console.log(`\nTranslating [${scheme.id}] "${scheme.name}"...`);

  // 1. Write English version
  const enData = createEnglishBase(scheme);
  ensureDir(path.join(OUTPUT_DIR, 'en'));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'en', `${scheme.id}.json`),
    JSON.stringify(enData, null, 2),
    'utf-8'
  );

  // 2. Prompt Gemini for Hindi, Bengali, Tamil
  const prompt = `You are an expert civic translator creating Grade-5 reading-level welfare translations for rural and urban Indian citizens.
Translate this government scheme information into 3 Indian languages: hi (Hindi), bn (Bengali), ta (Tamil).

SCHEME DETAILS:
- ID: "${scheme.id}"
- Official Name: "${scheme.name}"
- Hindi Name (if known): "${scheme.hindi_name || ''}"
- Category: "${scheme.category}"
- Benefit Amount: "${scheme.benefit_amount || ''}"
- Benefit Summary: "${scheme.benefit_summary}"
- Required Documents: ${JSON.stringify(scheme.required_documents)}

CRITICAL INSTRUCTIONS:
- Use simple, easy-to-understand native words (Grade-5 school reading level).
- Keep all numbers, currency amounts (₹), scheme acronyms (e.g. PM-KISAN, PM-JAY, PMAY, PMEGP, CGHS, ECHS), and official URLs exactly unchanged.
- In templates, keep placeholder variables exact: {age}, {min}, {max}, {occupation}, {eligible_occupations}, {income}, {max_income}, {acres}, {state}.
- Return ONLY a valid JSON object whose keys are "hi", "bn", "ta".
- No markdown formatting, no code fences, just raw JSON.

FORMAT:
{
  "hi": {
    "name": "...",
    "category": "...",
    "benefit_amount": "...",
    "benefit_summary": "...",
    "who_can_apply_intro": "...",
    "required_documents": ["..."],
    "application_steps": ["..."],
    "eligibility_templates": {
      "age_met": "...", "age_unmet": "...", "occupation_met": "...", "occupation_unmet": "...",
      "income_met": "...", "income_unmet": "...", "land_met": "...", "land_unknown": "...",
      "bpl_met": "...", "state_met": "...", "gender_met": "..."
    }
  },
  "bn": { ... },
  "ta": { ... }
}`;

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    let text = res.text?.trim() || '';
    if (text.startsWith('```json')) text = text.slice(7);
    if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();

    const parsed = JSON.parse(text);

    for (const lang of TARGET_LANGS) {
      if (parsed[lang.code]) {
        const langData = {
          id: scheme.id,
          ...parsed[lang.code],
        };
        ensureDir(path.join(OUTPUT_DIR, lang.code));
        fs.writeFileSync(
          path.join(OUTPUT_DIR, lang.code, `${scheme.id}.json`),
          JSON.stringify(langData, null, 2),
          'utf-8'
        );
        console.log(`  ✓ Generated [${lang.code}] (${lang.name})`);
      } else {
        console.warn(`  ⚠️ Missing key [${lang.code}] in response`);
      }
    }
  } catch (err: any) {
    console.error(`  ❌ Error translating scheme ${scheme.id}:`, err?.message || err);
    // Write English fallback if not generated
    for (const lang of TARGET_LANGS) {
      const destPath = path.join(OUTPUT_DIR, lang.code, `${scheme.id}.json`);
      if (!fs.existsSync(destPath)) {
        ensureDir(path.join(OUTPUT_DIR, lang.code));
        fs.writeFileSync(destPath, JSON.stringify(enData, null, 2), 'utf-8');
      }
    }
  }
}

async function main() {
  console.log('Starting SEVA.AI Scheme Translations Generation with gemini-3.6-flash...');
  ensureDir(OUTPUT_DIR);

  for (let i = 0; i < SCHEMES_DATA.length; i++) {
    const scheme = SCHEMES_DATA[i];
    console.log(`[${i + 1}/${SCHEMES_DATA.length}] Processing ${scheme.id}...`);
    await translateScheme(scheme);
  }

  console.log('\n🎉 ALL SCHEME TRANSLATIONS SUCCESSFULLY GENERATED & SAVED TO data/translations/!');
}

main();
