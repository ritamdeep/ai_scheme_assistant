'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Globe } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth-context';

const LANG_SHORT_LABELS: Record<string, string> = {
  en: 'EN',
  hi: 'हि',
  bn: 'বা',
  ta: 'த',
};

export function TopHeader() {
  const pathname = usePathname();
  const { activeLanguageCode } = useAuth();
  const isNotHome = pathname !== '/';
  const isLanguagePage = pathname === '/language';

  const shortLabel = LANG_SHORT_LABELS[activeLanguageCode] || 'EN';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0B1120]/95 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
      <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Back Arrow if not on Home, plus Logo */}
        <div className="flex items-center gap-2">
          {isNotHome && (
            <Link
              href="/"
              aria-label="Back to Home"
              className="touch-target w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/"
            aria-label="SEVA.AI Home"
            className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[#0E2040] rounded-xl"
          >
            <Logo size="sm" />
          </Link>
        </div>

        {/* Right: Small Language Switch Button (Globe + Short Name) */}
        {!isLanguagePage && (
          <div className="flex items-center gap-2">
            <Link
              href="/language?from=header"
              aria-label={`Change language, current is ${shortLabel}`}
              className="touch-target min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#D9531E]" />
              <span className="text-xs font-black tracking-tight">{shortLabel}</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
