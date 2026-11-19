# SEVA.AI (Scheme Eligibility & Verification Assistant)

> [!IMPORTANT]
> **TRANSLATIONS REVIEW NOTICE FOR CIVIC / REAL-WORLD USE:**
> Static welfare scheme translations in this project (`data/translations/{lang}/{schemeId}.json`) were generated using Google Gemini with simple Grade-5 reading-level instructions for Indian citizens. All numbers, currency amounts (₹), scheme acronyms, and official URLs have been preserved unchanged. **Before deploying for real-world civic administration or official use, all translations in Hindi (हिन्दी), Bengali (বাংলা), and Tamil (தமிழ்) must be reviewed and certified by native human speakers.**

---

## 4 Supported Languages & Typography

SEVA.AI officially supports 4 Indian languages:
- **English** (`en-IN`) — Latin script
- **Hindi** (`hi-IN`) — Devanagari script (`Noto_Sans_Devanagari`)
- **Bengali** (`bn-IN`) — Bengali script (`Noto_Sans_Bengali`)
- **Tamil** (`ta-IN`) — Tamil script (`Noto_Sans_Tamil`)

Fonts are loaded with `next/font/google` and configured with CSS variables to ensure zero layout shifting and seamless rendering across all 4 scripts without text clipping at 360px viewport width.

### TTS Fallback Chain (`lib/speech.ts` & `app/api/tts/route.ts`)
1. **Browser SpeechSynthesis**: Automatically listens for `voiceschanged` and maps to installed browser voices (`en-IN`, `hi-IN`, `bn-IN`, `ta-IN`, `te-IN`, `as-IN`). Long utterances are chunked by punctuation to avoid browser speech cutoff.
2. **Server-Side TTS Route (`POST /api/tts`)**: If no local voice is installed on the user's OS/browser, falls back to Google Gemini TTS (`gemini-3.8-flash-lite-tts` and `gemini-3.8-flash-tts`) via the Google Interactions API.
3. **Bhashini TTS Fallback**: If `BHASHINI_API_KEY` and `BHASHINI_USER_ID` are configured in `.env.local`, the server can fall back to Government of India's Bhashini pipeline.
4. **Disk & In-Memory Caching**: Audio output is cached in `.cache/tts/` and in memory by SHA-256 hash of `(lang + text)` so repeated playback uses zero quota.
5. **Graceful Notification**: If every method is unavailable or rate-limited on the device, a native-script alert is shown: `"Audio is not available for this language on your device."` while translated text remains visible on screen.

### STT Voice Input (`components/VoiceSchemeQuestionCard.tsx` & `app/api/transcribe/route.ts`)
1. **Web Speech API**: Uses `SpeechRecognition` with the active language code where supported by the browser.
2. **Server-Side Gemini Transcription Fallback**: If `SpeechRecognition` is unsupported (e.g. for regional languages on desktop Chrome), audio is captured via `MediaRecorder` and sent to `POST /api/transcribe` for verbatim transcription with Gemini.

---

## Environment Variables

Configure the following variables in `.env.local`:

```bash
# Google Gemini API Key (Required for RAG synthesis, TTS fallback, and Voice transcription)
GEMINI_API_KEY=your_gemini_api_key

# Optional: Groq API Key (alternative LLM provider)
GROQ_API_KEY=your_groq_api_key

# Optional: Government of India Bhashini API (for secondary TTS fallback)
BHASHINI_API_KEY=your_bhashini_api_key
BHASHINI_USER_ID=your_bhashini_user_id
```

---

## Development & Verification

```bash
# Run local development server
npm run dev

# Run comprehensive rule engine & RAG tests (6/6 tests)
npm run test:engine

# Regenerate static scheme translations
npx tsx scripts/translate-schemes.ts

# Production build
npm run build
```
