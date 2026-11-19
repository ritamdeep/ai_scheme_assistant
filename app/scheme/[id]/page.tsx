'use client';

import React, { useState, use, useMemo } from 'react';
import Link from 'next/link';
import { notFound, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Gift,
  Users,
  FileText,
  ListOrdered,
  Globe,
  ExternalLink,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Compass,
  X,
} from 'lucide-react';
import { SCHEMES_DATA } from '@/lib/schemes-data';
import { evaluateEligibility } from '@/lib/rule-engine';
import { Stage2VerificationModal } from '@/components/Stage2VerificationModal';
import { VoiceSchemeQuestionCard } from '@/components/VoiceSchemeQuestionCard';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { useSpeech, LANG_CODES, AUDIO_UNAVAILABLE_MESSAGES, SpeechSection } from '@/lib/speech';
import {
  getSchemeTranslation,
  formatLocalizedReason,
} from '@/lib/scheme-translations';

interface SchemeDetailPageProps {
  params: Promise<{ id: string }>;
}

function SchemeDetailContent({ schemeId }: { schemeId: string }) {
  const scheme = SCHEMES_DATA.find((s) => s.id === schemeId);
  if (!scheme) {
    notFound();
  }

  const searchParams = useSearchParams();
  const source = searchParams?.get('source');

  const { profile, isSchemeSaved, toggleSaveScheme, hasCompletedWizard } = useAuth();
  const { locale, t } = useTranslation();
  const [isStage2Open, setIsStage2Open] = useState(false);

  // If source is 'browse' (or no source and user has not completed wizard), browse mode.
  const isBrowseMode = source === 'browse' || (!source && !hasCompletedWizard);

  const saved = isSchemeSaved(scheme.id);
  const verdict = evaluateEligibility(scheme, profile);

  // Plain requirements for browse mode (non-personalized, clean informational)
  const plainRequirements = useMemo(() => {
    const list: Array<{ label: string; value: string }> = [];
    const e = scheme.eligibility;

    // Age
    if (e.age_min && e.age_max) {
      list.push({ label: 'Age', value: `${e.age_min} to ${e.age_max} years` });
    } else if (e.age_min) {
      list.push({ label: 'Age', value: `At least ${e.age_min} years` });
    } else if (e.age_max) {
      list.push({ label: 'Age', value: `Up to ${e.age_max} years` });
    } else {
      list.push({ label: 'Age', value: 'Any age' });
    }

    // Income
    if (e.income_max) {
      const lakh = (e.income_max / 100000).toLocaleString('en-IN');
      list.push({ label: 'Annual Family Income', value: `Up to ₹${lakh} Lakh / year` });
    } else {
      list.push({ label: 'Annual Family Income', value: 'No income limit' });
    }

    // Occupation
    if (e.occupation && e.occupation.length > 0 && !e.occupation.includes('any')) {
      list.push({ label: 'Eligible Occupations', value: e.occupation.join(', ') });
    } else {
      list.push({ label: 'Eligible Occupations', value: 'Open to all occupations' });
    }

    // State
    if (e.state && e.state !== 'any' && e.state !== 'All India') {
      list.push({ label: 'State / Region', value: e.state });
    } else {
      list.push({ label: 'State / Region', value: 'All India (All States & UTs)' });
    }

    // Additional criteria if applicable
    if (e.gender && e.gender !== 'any') {
      list.push({ label: 'Gender', value: e.gender === 'female' ? 'Women only' : e.gender });
    }
    if (e.land_holding_max_acres) {
      list.push({ label: 'Land Holding', value: `Up to ${e.land_holding_max_acres} acres` });
    }
    if (e.bpl_required) {
      list.push({ label: 'Special Category', value: 'BPL / Ration card holders' });
    }
    if (e.unorganized_worker_only) {
      list.push({ label: 'Sector', value: 'Unorganized sector workers' });
    }
    if (e.min_education) {
      list.push({ label: 'Education', value: e.min_education });
    }

    return list;
  }, [scheme]);

  // Load localized scheme content for selected language
  const localized = getSchemeTranslation(scheme.id, locale);
  const langCode = LANG_CODES[locale] || 'en-IN';

  // Unified speech hook for this scheme detail page
  const {
    state,
    isSpeaking,
    isLoading,
    isPlaying,
    isPaused,
    activeSectionId,
    playStaticAudio,
    playStaticSections,
    stop,
    pause,
    resume,
  } = useSpeech(`scheme-detail-${scheme.id}`);

  // Format who can apply text for narration
  const whoCanApplyNarration = useMemo(() => {
    if (isBrowseMode) {
      return plainRequirements.map((r) => `${r.label}: ${r.value}`).join('. ');
    }
    return [
      ...verdict.matchedCriteria.map((c) =>
        formatLocalizedReason(c.criterion, 'met', c.reason, scheme.id, locale, {
          age: profile.age,
          occupation: profile.occupation,
          income: profile.annual_income,
          acres: profile.land_holding_acres,
          state: profile.state,
        })
      ),
      ...verdict.unknownCriteria.map((u) =>
        formatLocalizedReason(u.criterion, 'unknown', u.reason, scheme.id, locale, {
          age: profile.age,
          occupation: profile.occupation,
          income: profile.annual_income,
          acres: profile.land_holding_acres,
          state: profile.state,
        })
      ),
      ...verdict.unmatchedCriteria.map((un) =>
        formatLocalizedReason(un.criterion, 'unmet', un.reason, scheme.id, locale, {
          age: profile.age,
          occupation: profile.occupation,
          income: profile.annual_income,
          acres: profile.land_holding_acres,
          state: profile.state,
        })
      ),
    ].join('. ');
  }, [isBrowseMode, plainRequirements, verdict, scheme.id, locale, profile]);

  // Full page speech sections in requested order:
  // 1. scheme name, 2. what you get, 3. who can apply, 4. documents needed, 5. how to apply steps
  const fullSections: SpeechSection[] = [
    {
      id: 'name',
      text: localized.name,
    },
    {
      id: 'whatYouGet',
      text: `${t('schemeDetail.whatYouGet')}. ${
        localized.benefit_amount ? `${localized.benefit_amount}. ` : ''
      }${localized.benefit_summary}`,
    },
    {
      id: 'whoCanApply',
      text: `${t('schemeDetail.whoCanApply')}. ${whoCanApplyNarration}`,
    },
    {
      id: 'documents',
      text: `${t('schemeDetail.documentsNeeded')}. ${localized.required_documents.join('. ')}`,
    },
    {
      id: 'howToApply',
      text: `${t('schemeDetail.howToApply')}. ${localized.application_steps.join('. ')}`,
    },
  ];

  // Static audio sections mapping for sequential whole-page playback
  const staticSections = [
    {
      id: 'name',
      audioUrl: `/audio/${locale}/${scheme.id}/name.mp3`,
      fallbackText: localized.name,
    },
    {
      id: 'whatYouGet',
      audioUrl: `/audio/${locale}/${scheme.id}/whatYouGet.mp3`,
      fallbackText: fullSections[1].text,
    },
    {
      id: 'whoCanApply',
      audioUrl: `/audio/${locale}/${scheme.id}/whoCanApply.mp3`,
      fallbackText: fullSections[2].text,
    },
    {
      id: 'documents',
      audioUrl: `/audio/${locale}/${scheme.id}/documents.mp3`,
      fallbackText: fullSections[3].text,
    },
    {
      id: 'howToApply',
      audioUrl: `/audio/${locale}/${scheme.id}/howToApply.mp3`,
      fallbackText: fullSections[4].text,
    },
  ];

  // Whole-page narration handler (sticky bottom bar Listen button: plays static files with <audio>)
  const handleListenWholePage = () => {
    if (isSpeaking) {
      if (isPlaying) {
        pause();
      } else if (isPaused) {
        resume();
      } else {
        stop();
      }
    } else {
      playStaticSections(staticSections, {
        langCode,
        onSectionStart: (sectionId) => {
          // Smooth scroll to active section on mobile
          const el = document.getElementById(`section-${sectionId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
      });
    }
  };

  // Section-specific narration handler: plays static section file with <audio>
  const handleListenSection = (sectionId: string, text: string) => {
    if (isSpeaking && activeSectionId === sectionId) {
      if (isPlaying) {
        pause();
      } else if (isPaused) {
        resume();
      } else {
        stop();
      }
    } else {
      const staticAudioUrl = `/audio/${locale}/${scheme.id}/${sectionId}.mp3`;
      playStaticAudio(staticAudioUrl, text, {
        langCode,
        onSectionStart: () => {},
      });
    }
  };

  return (
    <>
      {state === 'error' && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {AUDIO_UNAVAILABLE_MESSAGES[locale] || AUDIO_UNAVAILABLE_MESSAGES.en}
            </span>
          </div>
          <button
            type="button"
            onClick={() => stop()}
            className="p-1 text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="w-full max-w-[480px] mx-auto px-4 py-5 space-y-5 pb-36 animate-in fade-in duration-150">
        {/* Top Back Navigation */}
        <div>
          <Link
            href={isBrowseMode ? "/dashboard?source=browse" : "/find-schemes"}
            className="touch-target inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{isBrowseMode ? (t('schemeDetail.back') || 'Back to schemes') : 'Back to results'}</span>
          </Link>
        </div>

        {/* Scheme Header Title */}
        <header id="section-name" className="space-y-1.5 transition-all">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D9531E] block">
            {localized.category || scheme.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
            {localized.name}
          </h1>
          {localized.name !== scheme.name && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {scheme.name}
            </p>
          )}
          <p className="text-xs text-slate-400 font-medium">{scheme.ministry}</p>
        </header>

        {/* ======================================================== */}
        {/* 1. What You Get (one big line + section speaker)        */}
        {/* ======================================================== */}
        <section
          id="section-whatYouGet"
          className={`p-5 rounded-3xl border-2 transition-all space-y-2 ${
            activeSectionId === 'whatYouGet'
              ? 'ring-4 ring-emerald-500/50 border-emerald-500 shadow-md bg-emerald-50/90 dark:bg-emerald-950/50'
              : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <Gift className="w-5 h-5 shrink-0" />
              <h2>{t('schemeDetail.whatYouGet') || 'What you get'}</h2>
            </div>
            {/* Section Speaker */}
            <button
              type="button"
              onClick={() => handleListenSection('whatYouGet', fullSections[1].text)}
              aria-label="Listen to what you get"
              className="touch-target w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              {isSpeaking && activeSectionId === 'whatYouGet' ? (
                <VolumeX className="w-4 h-4 text-[#D9531E] animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-100 leading-tight">
            {localized.benefit_amount || localized.benefit_summary}
          </p>

          <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
            {localized.benefit_summary}
          </p>
        </section>

        {/* ======================================================== */}
        {/* 2. Who Can Apply                                         */}
        {/* ======================================================== */}
        <section
          id="section-whoCanApply"
          className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3 ${
            activeSectionId === 'whoCanApply'
              ? 'ring-4 ring-orange-500/50 border-[#D9531E] shadow-md bg-white dark:bg-[#0B1120]'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <Users className="w-5 h-5 text-[#D9531E]" />
              <h2>{t('schemeDetail.whoCanApply') || 'Who can apply'}</h2>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Section Speaker */}
              <button
                type="button"
                onClick={() => handleListenSection('whoCanApply', fullSections[2].text)}
                aria-label="Listen to who can apply"
                className="touch-target w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {isSpeaking && activeSectionId === 'whoCanApply' ? (
                  <VolumeX className="w-4 h-4 text-[#D9531E] animate-pulse" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {isBrowseMode ? (
            /* Browse mode: Plain requirements without green ticks or red crosses, plus clear "Check if I qualify" button */
            <div className="space-y-3 pt-1">
              <div className="space-y-2">
                {plainRequirements.map((req, i) => (
                  <div
                    key={`req-${i}`}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#0E2040] dark:bg-slate-300 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block">
                        {req.label}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 block mt-0.5">
                        {req.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear "Check if I qualify" button that opens wizard */}
              <div className="pt-1">
                <Link
                  href="/find-schemes"
                  className="touch-target w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D9531E] hover:bg-[#B84417] text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>{t('schemeDetail.checkIfQualify') || 'Check if I qualify'}</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Results mode: Personalized criteria checks (with green checks, orange questions, red crosses) */
            <div className="space-y-2 pt-1">
              {/* Matched Criteria (Green Check) */}
              {verdict.matchedCriteria.map((c, i) => {
                const localizedMsg = formatLocalizedReason(
                  c.criterion,
                  'met',
                  c.reason,
                  scheme.id,
                  locale,
                  {
                    age: profile.age,
                    occupation: profile.occupation,
                    income: profile.annual_income,
                    acres: profile.land_holding_acres,
                    state: profile.state,
                  }
                );
                return (
                  <div
                    key={`mat-${i}`}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm block">
                        {c.criterion}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 block">
                        {localizedMsg}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Unknown Criteria (Orange Question) */}
              {verdict.unknownCriteria.map((u, i) => {
                const localizedMsg = formatLocalizedReason(
                  u.criterion,
                  'unknown',
                  u.reason,
                  scheme.id,
                  locale,
                  {
                    age: profile.age,
                    occupation: profile.occupation,
                    income: profile.annual_income,
                    acres: profile.land_holding_acres,
                    state: profile.state,
                  }
                );
                return (
                  <div
                    key={`unk-${i}`}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60"
                  >
                    <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block">
                        {u.criterion}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 block">
                        {localizedMsg}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Unmatched Criteria (Grey / Red Cross) */}
              {verdict.unmatchedCriteria.map((un, i) => {
                const localizedMsg = formatLocalizedReason(
                  un.criterion,
                  'unmet',
                  un.reason,
                  scheme.id,
                  locale,
                  {
                    age: profile.age,
                    occupation: profile.occupation,
                    income: profile.annual_income,
                    acres: profile.land_holding_acres,
                    state: profile.state,
                  }
                );
                return (
                  <div
                    key={`unm-${i}`}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                        {un.criterion}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        {localizedMsg}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsStage2Open(true)}
                  className="touch-target w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#D9531E] border border-orange-200 dark:border-orange-800 font-bold text-xs hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  <span>{t('schemeCard.checkIfQualify') || 'Check if I qualify'}</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* 3. Documents You Need (checklist with section speaker)   */}
        {/* ======================================================== */}
        <section
          id="section-documents"
          className={`p-5 rounded-3xl border transition-all space-y-3 ${
            activeSectionId === 'documents'
              ? 'ring-4 ring-blue-500/50 border-blue-500 shadow-md bg-white dark:bg-[#0B1120]'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2>{t('schemeDetail.documentsNeeded') || 'Documents you need'}</h2>
            </div>
            {/* Section Speaker */}
            <button
              type="button"
              onClick={() => handleListenSection('documents', fullSections[3].text)}
              aria-label="Listen to documents needed"
              className="touch-target w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isSpeaking && activeSectionId === 'documents' ? (
                <VolumeX className="w-4 h-4 text-[#D9531E] animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {localized.required_documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {idx + 1}
                </div>
                <span>{doc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. How To Apply (numbered steps + section speaker)       */}
        {/* ======================================================== */}
        <section
          id="section-howToApply"
          className={`p-5 rounded-3xl border transition-all space-y-3 ${
            activeSectionId === 'howToApply'
              ? 'ring-4 ring-indigo-500/50 border-[#0E2040] dark:border-white shadow-md bg-white dark:bg-[#0B1120]'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <ListOrdered className="w-5 h-5 text-[#0E2040] dark:text-white" />
              <h2>{t('schemeDetail.howToApply') || 'How to apply'}</h2>
            </div>
            {/* Section Speaker */}
            <button
              type="button"
              onClick={() => handleListenSection('howToApply', fullSections[4].text)}
              aria-label="Listen to how to apply steps"
              className="touch-target w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isSpeaking && activeSectionId === 'howToApply' ? (
                <VolumeX className="w-4 h-4 text-[#D9531E] animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {localized.application_steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200"
              >
                <span className="w-6 h-6 rounded-full bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="font-medium leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. Official Website Portal Link                         */}
        {/* ======================================================== */}
        <section className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2>{t('schemeDetail.visitPortal') || 'Open official website'}</h2>
          </div>

          <a
            href={scheme.official_apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#0E2040] font-bold text-sm transition-colors cursor-pointer shadow-xs"
          >
            <span>{t('schemeDetail.visitPortal') || 'Open official website'}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </section>

        {/* ======================================================== */}
        {/* 6. Voice-First "Ask questions about [scheme]" Card       */}
        {/* ======================================================== */}
        <VoiceSchemeQuestionCard scheme={scheme} />
      </div>

      {/* ======================================================== */}
      {/* Sticky Bottom Bar: Listen (Wide Primary) + Bookmark Only */}
      {/* ======================================================== */}
      <aside
        aria-label="Scheme actions"
        className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 dark:bg-[#0B1120]/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md py-3 px-4 shadow-xl"
      >
        <div className="max-w-[480px] mx-auto flex items-center gap-3">
          {/* Wide Primary Listen Button */}
          <button
            type="button"
            onClick={handleListenWholePage}
            aria-label={
              isLoading
                ? 'Loading audio...'
                : isPlaying
                ? 'Pause listening'
                : isPaused
                ? 'Resume listening'
                : 'Listen to entire scheme page'
            }
            className="touch-target flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border-2 border-[#0E2040] dark:border-white bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white dark:border-[#0E2040] border-t-transparent rounded-full animate-spin" />
                <span>{t('common.loading') || 'Loading...'}</span>
              </>
            ) : isPlaying ? (
              <>
                <VolumeX className="w-5 h-5 text-[#D9531E] animate-pulse" />
                <span>{t('schemeDetail.stop') || 'Stop'}</span>
              </>
            ) : isPaused ? (
              <>
                <Volume2 className="w-5 h-5 text-amber-500" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>{t('schemeDetail.listen') || 'Listen'}</span>
              </>
            )}
          </button>

          {/* Save Bookmark Button */}
          <button
            type="button"
            onClick={() => toggleSaveScheme(scheme.id)}
            aria-label={saved ? 'Remove saved bookmark' : 'Save scheme'}
            className={`touch-target w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors cursor-pointer shrink-0 ${
              saved
                ? 'bg-orange-50 dark:bg-orange-950/40 text-[#D9531E] border-orange-200 dark:border-orange-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            {saved ? (
              <BookmarkCheck className="w-6 h-6 fill-current" />
            ) : (
              <Bookmark className="w-6 h-6" />
            )}
          </button>
        </div>
      </aside>

      {/* Stage 2 Scheme-Specific Verification Modal */}
      <Stage2VerificationModal
        scheme={scheme}
        isOpen={isStage2Open}
        onClose={() => setIsStage2Open(false)}
      />
    </>
  );
}

export default function SchemeDetailPage({ params }: SchemeDetailPageProps) {
  const resolvedParams = use(params);
  return (
    <React.Suspense
      fallback={
        <div className="w-full px-4 py-8 text-center text-slate-400 font-medium">
          Loading scheme details...
        </div>
      }
    >
      <SchemeDetailContent schemeId={resolvedParams.id} />
    </React.Suspense>
  );
}
