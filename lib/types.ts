export type OccupationCategory =
  | 'Farmer / Agriculturist'
  | 'Fisherman'
  | 'Student'
  | 'Teacher'
  | 'Government Employee (state/central)'
  | 'Army / Defence Personnel & Veterans'
  | 'Unorganized Sector Worker / Daily Wage Labourer'
  | 'Self-Employed / Street Vendor'
  | 'Entrepreneur / Small Business Owner'
  | 'Senior Citizen'
  | 'Person with Disability'
  | 'Unemployed / Job-Seeker'
  | 'Other';

export interface EligibilityCriteria {
  occupation?: string[]; // Allowed occupation categories or 'any'
  age_min?: number | null;
  age_max?: number | null;
  income_max?: number | null; // Annual income in INR (or monthly equivalent)
  state?: string; // Specific state or 'any' / 'All India'
  gender?: 'any' | 'male' | 'female' | 'transgender';
  land_holding_max_acres?: number | null;
  min_education?: string | null;
  disability_min_percent?: number | null;
  bpl_required?: boolean;
  unorganized_worker_only?: boolean;
}

export interface Scheme {
  id: string;
  name: string;
  hindi_name?: string;
  ministry: string;
  category:
    | 'Agriculture & Farming'
    | 'Jobs & Employment'
    | 'Business & MSME'
    | 'Education & Youth'
    | 'Social Security & Health'
    | 'Housing & Urban Welfare';
  benefit_summary: string;
  benefit_amount?: string;
  eligibility: EligibilityCriteria;
  occupation_tags: string[]; // Synonyms for fuzzy matching
  source_text: string; // Full official text from myscheme.gov.in
  official_apply_url: string;
  required_documents: string[];
  last_verified: string; // YYYY-MM-DD
}

export interface UserProfile {
  id?: string;
  name: string;
  age: number | null;
  annual_income: number | null;
  occupation: OccupationCategory;
  occupation_raw?: string | null; // When "Other" is selected
  state: string;
  gender: 'any' | 'male' | 'female' | 'transgender';
  caste_category?: 'General' | 'OBC' | 'SC' | 'ST';
  special_conditions: string[]; // e.g. ["BPL", "Disabled (40%+)", "Single Girl Child", "Ex-Serviceman"]
  land_holding_acres?: number | null;
  education_level?: string | null;
}

export type CriterionMatchStatus = 'match' | 'no_match' | 'unknown';

export interface CriterionResult {
  criterion: string;
  status: CriterionMatchStatus;
  userValue: any;
  requiredValue: any;
  reason: string;
}

export interface EligibilityVerdict {
  status: 'Eligible' | 'Not Eligible' | 'Needs More Info';
  confidenceScore: number; // 0 to 100
  matchedCriteria: CriterionResult[];
  unmatchedCriteria: CriterionResult[];
  unknownCriteria: CriterionResult[];
  missingFieldPrompt?: {
    fieldKey: keyof UserProfile;
    questionText: string;
  } | null;
  summaryReason: string;
  isFuzzySuggestion?: boolean;
}

export interface SourceCitation {
  id: string;
  documentTitle: string;
  schemeId: string;
  schemeName: string;
  ministry: string;
  sectionTitle: string;
  excerpt: string;
  officialUrl: string;
  sourceType: 'myscheme.gov.in' | 'Ministry Portal' | 'india.gov.in' | 'Official Gazette';
}

export interface StructuredChatAnswer {
  summary: string;
  benefit: string;
  documents: string[];
  next_step: string;
  source_url?: string;
  follow_up_question?: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  structuredAnswer?: StructuredChatAnswer | null;
  citations?: string[];
  sources?: SourceCitation[];
  relevantSchemes?: Array<{
    scheme: Scheme;
    verdict: EligibilityVerdict;
  }>;
  followUpPrompt?: {
    fieldKey: keyof UserProfile;
    questionText: string;
  } | null;
  detectedLanguage?: string;
  suggestedAction?: {
    label: string;
    value: string;
  };
  timestamp: string;
}

export interface SchemeChunk {
  schemeId: string;
  schemeName: string;
  title: string;
  content: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'ta';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
}
