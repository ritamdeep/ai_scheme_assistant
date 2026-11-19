import { SupportedLanguage, Scheme } from './types';
import { SCHEMES_DATA } from './schemes-data';

export interface LocalizedSchemeContent {
  id: string;
  name: string;
  category: string;
  benefit_amount?: string;
  benefit_summary: string;
  who_can_apply_intro?: string;
  required_documents: string[];
  application_steps: string[];
  eligibility_templates?: Record<string, string>;
}

// Quick in-memory cache for loaded translations
const translationCache: Record<string, LocalizedSchemeContent> = {};

/**
 * Returns the localized scheme content for the given scheme and language.
 * Falls back cleanly to English / SCHEMES_DATA defaults if a translation isn't available.
 */
export function getSchemeTranslation(
  schemeId: string,
  locale: SupportedLanguage
): LocalizedSchemeContent {
  const cacheKey = `${locale}:${schemeId}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  const baseScheme = SCHEMES_DATA.find((s) => s.id === schemeId);
  const fallback: LocalizedSchemeContent = {
    id: schemeId,
    name:
      locale === 'hi' && baseScheme?.hindi_name
        ? baseScheme.hindi_name
        : baseScheme?.name || schemeId,
    category: baseScheme?.category || 'Civic Welfare',
    benefit_amount: baseScheme?.benefit_amount || baseScheme?.benefit_summary,
    benefit_summary: baseScheme?.benefit_summary || '',
    who_can_apply_intro: `All eligible citizens who meet the ${baseScheme?.name || ''} guidelines.`,
    required_documents: baseScheme?.required_documents || [
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
  };

  try {
    // Dynamic require for static JSON files written to data/translations/{lang}/{schemeId}.json
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const translated = require(`@/data/translations/${locale}/${schemeId}.json`);
    if (translated && translated.name) {
      translationCache[cacheKey] = {
        ...fallback,
        ...translated,
      };
      return translationCache[cacheKey];
    }
  } catch (e) {
    // If not found in requested locale, try English
    if (locale !== 'en') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const enData = require(`@/data/translations/en/${schemeId}.json`);
        if (enData) {
          translationCache[cacheKey] = { ...fallback, ...enData };
          return translationCache[cacheKey];
        }
      } catch (enErr) {}
    }
  }

  translationCache[cacheKey] = fallback;
  return fallback;
}

/**
 * Returns just the localized name for a scheme.
 */
export function getLocalizedSchemeName(
  schemeId: string,
  locale: SupportedLanguage,
  defaultName: string,
  hindiName?: string
): string {
  if (locale === 'en') return defaultName;
  if (locale === 'hi' && hindiName) return hindiName;

  const trans = getSchemeTranslation(schemeId, locale);
  return trans.name || (locale === 'hi' && hindiName ? hindiName : defaultName);
}

/**
 * Formats an eligibility criterion message using the scheme's localized template.
 */
export function formatLocalizedReason(
  criterionKey: string,
  status: 'met' | 'unknown' | 'unmet',
  rawEnglishReason: string,
  schemeId: string,
  locale: SupportedLanguage,
  params: Record<string, any> = {}
): string {
  const trans = getSchemeTranslation(schemeId, locale);
  const templates = trans.eligibility_templates || {};

  // Infer template key from criterion name and status
  const c = criterionKey.toLowerCase();
  let templateKey = '';

  if (c.includes('age')) {
    templateKey = status === 'met' ? 'age_met' : 'age_unmet';
  } else if (c.includes('occupation')) {
    templateKey = status === 'met' ? 'occupation_met' : 'occupation_unmet';
  } else if (c.includes('income')) {
    templateKey = status === 'met' ? 'income_met' : 'income_unmet';
  } else if (c.includes('land')) {
    templateKey = status === 'met' ? 'land_met' : status === 'unknown' ? 'land_unknown' : 'land_unknown';
  } else if (c.includes('bpl')) {
    templateKey = 'bpl_met';
  } else if (c.includes('state')) {
    templateKey = 'state_met';
  } else if (c.includes('gender')) {
    templateKey = 'gender_met';
  }

  const template = templates[templateKey];
  if (!template) {
    return rawEnglishReason;
  }

  // Interpolate params: {age}, {min}, {max}, {occupation}, {eligible_occupations}, {income}, {max_income}, {acres}, {state}
  let result = template;
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }
  }

  return result;
}
