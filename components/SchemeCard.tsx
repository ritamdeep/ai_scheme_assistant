'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Volume2,
  VolumeX,
  Sprout,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Home as HomeIcon,
  Store,
  Layers,
} from 'lucide-react';
import { Scheme, EligibilityVerdict } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { useSpeech, LANG_CODES, AUDIO_UNAVAILABLE_MESSAGES } from '@/lib/speech';
import { getLocalizedSchemeName } from '@/lib/scheme-translations';

interface SchemeCardProps {
  scheme: Scheme;
  verdict?: EligibilityVerdict | null;
  showBadge?: boolean;
  source?: 'browse' | 'results';
}

export function SchemeCard({ scheme, verdict, showBadge, source }: SchemeCardProps) {
  const { isSchemeSaved, toggleSaveScheme, hasCompletedWizard } = useAuth();
  const { locale, t } = useTranslation();
  const {
    state,
    isSpeaking,
    isLoading,
    isPlaying,
    isPaused,
    playStaticAudio,
    stop,
    pause,
    resume,
  } = useSpeech(`scheme-card-${scheme.id}`);

  const saved = isSchemeSaved(scheme.id);
  const shouldRenderBadge =
    source === 'browse'
      ? false
      : showBadge !== undefined
      ? showBadge
      : hasCompletedWizard && !!verdict;

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Agriculture & Farming':
        return <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Education & Youth':
        return <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Social Security & Health':
        return <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'Jobs & Employment':
        return <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Business & MSME':
        return <Store className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Housing & Urban Welfare':
        return <HomeIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  // Plain-Language Status Badge (Icon + Words)
  let statusBadge = {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    label: t('schemeCard.canApply') || 'You can apply',
  };

  if (verdict?.status === 'Needs More Info') {
    statusBadge = {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
      icon: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
      label: t('schemeCard.checkThings') || 'Check a few things',
    };
  } else if (verdict?.status === 'Not Eligible') {
    statusBadge = {
      bg: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: <XCircle className="w-4 h-4 text-slate-500 shrink-0" />,
      label: t('schemeCard.notForYou') || 'Not for you right now',
    };
  }

  // Localized Scheme Name (all 6 languages supported)
  const localizedSchemeName = getLocalizedSchemeName(
    scheme.id,
    locale,
    scheme.name,
    scheme.hindi_name
  );

  // Listen functionality: plays static audio with <audio> element (play/pause/stop/loading)
  const handleListen = () => {
    if (isPlaying) {
      pause();
      return;
    }
    if (isPaused) {
      resume();
      return;
    }
    if (isSpeaking) {
      stop();
      return;
    }

    const statusPart = shouldRenderBadge ? statusBadge.label : '';
    const narrationText = statusPart
      ? `${localizedSchemeName}. ${statusPart}.`
      : `${localizedSchemeName}.`;

    const langCode = LANG_CODES[locale] || 'en-IN';
    const staticAudioUrl = `/audio/${locale}/${scheme.id}/card.mp3`;

    // Plays static file with <audio> element (zero runtime API calls)
    playStaticAudio(staticAudioUrl, narrationText, { langCode });
  };

  return (
    <article className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-4 shadow-xs hover:shadow-sm transition-all space-y-2.5">
      {/* 1. Top Row: Category Label + Small Icon on Left, Listen & Save on Right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shrink-0">
            {getCategoryIcon(scheme.category)}
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
            {scheme.category}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Listen (Speaker) Button */}
          <button
            type="button"
            onClick={handleListen}
            aria-label={
              isLoading
                ? 'Loading audio...'
                : isPlaying
                ? 'Pause listening'
                : isPaused
                ? 'Resume listening'
                : 'Listen to scheme title and status'
            }
            className="touch-target w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-[#D9531E] border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="w-4 h-4 text-[#D9531E] animate-pulse" />
            ) : isPaused ? (
              <Volume2 className="w-4 h-4 text-[#D9531E]" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Save (Bookmark) Button */}
          <button
            type="button"
            onClick={() => toggleSaveScheme(scheme.id)}
            aria-label={saved ? 'Remove from saved' : 'Save scheme'}
            className={`touch-target w-10 h-10 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
              saved
                ? 'bg-orange-50 dark:bg-orange-950/40 text-[#D9531E] border-orange-200 dark:border-orange-800'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            {saved ? (
              <BookmarkCheck className="w-4 h-4 fill-current" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Scheme Name in bold as Main Title */}
      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
        {localizedSchemeName}
      </h2>

      {/* Audio Unavailable Notification (if speech failed for this card) */}
      {state === 'error' && (
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          {AUDIO_UNAVAILABLE_MESSAGES[locale] || AUDIO_UNAVAILABLE_MESSAGES.en}
        </p>
      )}

      {/* 3. Eligibility Status Badge (Icon + Words) if evaluated */}
      {shouldRenderBadge && (
        <div className="pt-0.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${statusBadge.bg}`}
          >
            {statusBadge.icon}
            <span>{statusBadge.label}</span>
          </span>
        </div>
      )}

      {/* 4. Full-width "See details" Button */}
      <div className="pt-1">
        <Link
          href={`/scheme/${scheme.id}${source ? `?source=${source}` : ''}`}
          className="touch-target w-full flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-[#0E2040] font-bold text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer"
        >
          <span>{t('schemeCard.seeDetails') || 'See details'}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}
