'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp,
  Layers,
  Sprout,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Home as HomeIcon,
  Store,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { SCHEMES_DATA } from '@/lib/schemes-data';
import { rankSchemesForProfile } from '@/lib/rule-engine';
import { SchemeCard } from '@/components/SchemeCard';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const sourceParam = searchParams.get('source');

  const { profile, fuzzyMatches, hasCompletedWizard } = useAuth();
  const { locale, t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [showIneligible, setShowIneligible] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // If source is 'browse' (e.g. from Home category or All Schemes) or no explicit source without wizard, browse mode.
  // Wizard results pass source=results.
  const isBrowseMode = sourceParam === 'browse' || (!sourceParam && !hasCompletedWizard);

  const categories = [
    { id: 'all', label: t('common.all') || 'All', icon: Layers },
    { id: 'Agriculture & Farming', label: t('home.categories.farmers') || 'Farmers', icon: Sprout },
    { id: 'Education & Youth', label: t('home.categories.students') || 'Students', icon: GraduationCap },
    { id: 'Social Security & Health', label: t('home.categories.health') || 'Health', icon: HeartPulse },
    { id: 'Jobs & Employment', label: t('home.categories.jobs') || 'Jobs', icon: Briefcase },
    { id: 'Business & MSME', label: 'Business', icon: Store },
    { id: 'Housing & Urban Welfare', label: t('home.categories.housing') || 'Housing', icon: HomeIcon },
  ];

  // Natural catalog order filter for browse mode (does NOT read or evaluate wizard answers)
  const filteredCatalogSchemes = useMemo(() => {
    return SCHEMES_DATA.filter((scheme) => {
      if (selectedCategory !== 'all' && scheme.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          scheme.name.toLowerCase().includes(q) ||
          scheme.hindi_name?.toLowerCase().includes(q) ||
          scheme.ministry.toLowerCase().includes(q) ||
          scheme.benefit_summary.toLowerCase().includes(q) ||
          scheme.occupation_tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Ranked schemes ONLY evaluated when not in browse mode
  const rankedSchemes = useMemo(() => {
    if (isBrowseMode) return [];
    return rankSchemesForProfile(SCHEMES_DATA, profile, fuzzyMatches);
  }, [isBrowseMode, profile, fuzzyMatches]);

  // Filtered ranked schemes for results mode
  const filteredRankedSchemes = useMemo(() => {
    if (isBrowseMode) return [];
    return rankedSchemes.filter(({ scheme }) => {
      if (selectedCategory !== 'all' && scheme.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          scheme.name.toLowerCase().includes(q) ||
          scheme.hindi_name?.toLowerCase().includes(q) ||
          scheme.ministry.toLowerCase().includes(q) ||
          scheme.benefit_summary.toLowerCase().includes(q) ||
          scheme.occupation_tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [isBrowseMode, rankedSchemes, selectedCategory, searchQuery]);

  // When in results mode, partition by eligibility status
  const canApplyList = filteredRankedSchemes.filter((item) => item.verdict.status === 'Eligible');
  const checkThingsList = filteredRankedSchemes.filter((item) => item.verdict.status === 'Needs More Info');
  const notForYouList = filteredRankedSchemes.filter((item) => item.verdict.status === 'Not Eligible');

  // Title and subtitle
  const selectedCatObj = categories.find((c) => c.id === selectedCategory);
  const pageTitle = isBrowseMode
    ? selectedCategory === 'all'
      ? t('nav.allSchemes') || 'All Schemes'
      : selectedCatObj?.label || selectedCategory
    : t('wizard.resultsTitle') || 'Schemes that match you';

  const pageSubtitle = isBrowseMode
    ? selectedCategory === 'all'
      ? 'Explore government welfare schemes across India.'
      : `Schemes for ${selectedCatObj?.label || selectedCategory}`
    : t('wizard.resultsSubtitle') || 'Schemes matching your answers.';

  const displayCount = isBrowseMode
    ? filteredCatalogSchemes.length
    : filteredRankedSchemes.length;

  // Voice Search Handler
  const handleVoiceSearch = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        bn: 'bn-IN',
        ta: 'ta-IN',
      };
      recognition.lang = langMap[locale] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.warn('Voice search error:', e);
      setIsListening(false);
    }
  };

  return (
    <div className="w-full px-4 py-5 space-y-4 animate-in fade-in duration-150">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {pageTitle}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
          {pageSubtitle}
        </p>
      </div>

      {/* Prompt banner to find schemes when in browse mode */}
      {isBrowseMode && (
        <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-orange-200 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9531E] text-white flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                Want to check your eligibility?
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Answer 5 simple questions to see which schemes you can apply for.
              </p>
            </div>
          </div>

          <Link
            href="/find-schemes"
            className="touch-target px-3.5 py-2 rounded-xl bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] text-xs font-bold shrink-0 hover:bg-[#162F5C] transition-colors"
          >
            Start
          </Link>
        </div>
      )}

      {/* Large Search Input with Voice Mic */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('schemeCard.searchPlaceholder') || 'Search schemes by name or benefit...'}
          className="touch-target w-full pl-11 pr-14 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0E2040] dark:focus:border-white shadow-2xs transition-colors"
        />

        <button
          type="button"
          onClick={handleVoiceSearch}
          aria-label={isListening ? 'Stop listening' : 'Search by voice'}
          className={`touch-target absolute inset-y-1 right-1 w-10 h-10 my-auto rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            isListening
              ? 'bg-[#D9531E] text-white animate-pulse'
              : 'text-slate-500 hover:text-[#D9531E] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      {/* Horizontally Scrollable Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`touch-target shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] border-[#0E2040] dark:border-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 pt-0.5">
        Showing {displayCount} schemes
      </div>

      {/* Single-Column Scheme Cards */}
      <div className="space-y-3">
        {isBrowseMode ? (
          /* Browse mode: List all filtered schemes cleanly in natural catalog order without badges or collapsible section */
          filteredCatalogSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              showBadge={false}
              source="browse"
            />
          ))
        ) : (
          /* Results mode: Partitioned by eligibility status with badges and collapsible section */
          <>
            {/* 1. You Can Apply Section */}
            {canApplyList.map(({ scheme, verdict }) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                verdict={verdict}
                showBadge={true}
                source="results"
              />
            ))}

            {/* 2. Check a Few Things Section */}
            {checkThingsList.map(({ scheme, verdict }) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                verdict={verdict}
                showBadge={true}
                source="results"
              />
            ))}

            {/* 3. Collapsible "Not for you right now" Section */}
            {notForYouList.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowIneligible(!showIneligible)}
                  className="touch-target w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  <span>
                    {showIneligible
                      ? t('schemeCard.hideOthers') || 'Hide other schemes'
                      : `${t('schemeCard.showOthers') || 'Show other schemes'} (${notForYouList.length})`}
                  </span>
                  {showIneligible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {showIneligible && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    {notForYouList.map(({ scheme, verdict }) => (
                      <SchemeCard
                        key={scheme.id}
                        scheme={scheme}
                        verdict={verdict}
                        showBadge={true}
                        source="results"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty state if nothing matches */}
        {displayCount === 0 && (
          <div className="text-center py-12 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              No matching schemes found
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Try searching with a different word or select 'All'.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 px-5 py-2.5 rounded-2xl bg-[#0E2040] text-white font-bold text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full px-4 py-8 text-center text-slate-400 font-medium">
          Loading schemes...
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
