'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Compass } from 'lucide-react';
import { SCHEMES_DATA } from '@/lib/schemes-data';
import { evaluateEligibility } from '@/lib/rule-engine';
import { SchemeCard } from '@/components/SchemeCard';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function SavedSchemesPage() {
  const { savedSchemeIds, profile } = useAuth();
  const { t } = useTranslation();

  const savedSchemes = SCHEMES_DATA.filter((s) => savedSchemeIds.includes(s.id)).map((scheme) => ({
    scheme,
    verdict: evaluateEligibility(scheme, profile),
  }));

  return (
    <div className="w-full px-4 py-6 space-y-5 animate-in fade-in duration-150">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('saved.title') || 'Saved Schemes'}
        </h1>
        {savedSchemes.length > 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            You have {savedSchemes.length} saved {savedSchemes.length === 1 ? 'scheme' : 'schemes'}.
          </p>
        )}
      </div>

      {/* Content: List or Friendly Single Empty State */}
      {savedSchemes.length > 0 ? (
        <div className="space-y-3">
          {savedSchemes.map(({ scheme }) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              showBadge={false}
              source="browse"
            />
          ))}
        </div>
      ) : (
        <div className="my-auto py-16 px-6 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/40 text-[#D9531E] flex items-center justify-center mx-auto border border-orange-200 dark:border-orange-800 shadow-2xs">
            <Bookmark className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-xs mx-auto">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('saved.emptyTitle') || "You haven't saved anything yet"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('saved.emptyDesc') || 'Tap the bookmark on any scheme to save it here.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/find-schemes"
              className="touch-target inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#0E2040] font-bold text-base shadow-sm transition-all"
            >
              <Compass className="w-5 h-5" />
              <span>{t('saved.findBtn') || 'Find schemes now'}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
