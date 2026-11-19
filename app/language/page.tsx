'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Globe, Check } from 'lucide-react';
import { useAuth, SUPPORTED_LANGUAGES } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { SupportedLanguage } from '@/lib/types';

function LanguageSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromHeader = searchParams.get('from') === 'header';

  const { activeLanguageCode, setActiveLanguageByCode } = useAuth();
  const { setLocale } = useTranslation();

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setActiveLanguageByCode(code);
    setLocale(code);
    try {
      localStorage.setItem('seva_ai_lang_chosen', 'true');
      localStorage.setItem('seva_ai_lang_code', code);
    } catch (e) {}

    if (fromHeader) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="w-full min-h-[calc(100dvh-4rem)] flex flex-col justify-between px-4 py-6 max-w-[480px] mx-auto animate-in fade-in duration-200">
      <div className="space-y-6 pt-2">
        {/* Back Button if opened from header */}
        {fromHeader && (
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="touch-target inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        )}

        {/* Header Icon + Multilingual Headings */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#D9531E] flex items-center justify-center mx-auto border border-orange-200 dark:border-orange-800/60 shadow-sm">
            <Globe className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Choose your language
            </h1>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
              भाषा चुनें • ভাষা বেছে নিন • மொழியைத் தேர்ந்தெடுக்கவும்
            </p>
          </div>
        </div>

        {/* 4 Large Native Script Buttons */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = activeLanguageCode === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`touch-target w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? 'border-[#0E2040] dark:border-white bg-slate-100 dark:bg-slate-800 text-[#0E2040] dark:text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="text-left flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                      isSelected
                        ? 'bg-[#0E2040] text-white dark:bg-white dark:text-[#0E2040]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </div>
                  <div>
                    <span className="block text-xl font-black leading-snug">
                      {lang.nativeName}
                    </span>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {lang.name}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#D9531E] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Subtitle */}
      <div className="pt-8 pb-4 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          You can change your language anytime using the language button at the top.
        </p>
      </div>
    </div>
  );
}

export default function LanguageSelectionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold">Loading language options...</div>}>
      <LanguageSelectContent />
    </Suspense>
  );
}
