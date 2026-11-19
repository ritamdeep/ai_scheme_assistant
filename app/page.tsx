'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Mic,
  Sprout,
  GraduationCap,
  HeartPulse,
  Heart,
  Users,
  Briefcase,
  Home as HomeIcon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  // If user has not chosen a language yet on first visit, redirect to /language
  useEffect(() => {
    try {
      const chosen = localStorage.getItem('seva_ai_lang_chosen');
      if (!chosen) {
        // Wait briefly for splash screen or navigate directly
        const splashShown = sessionStorage.getItem('seva_splash_shown');
        const delay = splashShown ? 0 : 1550;
        const timer = setTimeout(() => {
          router.replace('/language');
        }, delay);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, [router]);

  const categories = [
    {
      id: 'farmers',
      label: t('home.categories.farmers') || 'Farmers',
      categoryQuery: 'Agriculture & Farming',
      icon: Sprout,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/70',
    },
    {
      id: 'students',
      label: t('home.categories.students') || 'Students',
      categoryQuery: 'Education & Youth',
      icon: GraduationCap,
      color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/70',
    },
    {
      id: 'health',
      label: t('home.categories.health') || 'Health',
      categoryQuery: 'Social Security & Health',
      icon: HeartPulse,
      color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/70',
    },
    {
      id: 'women',
      label: t('home.categories.women') || 'Women',
      categoryQuery: 'Social Security & Health',
      icon: Heart,
      color: 'bg-pink-50 dark:bg-pink-950/40 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-800/70',
    },
    {
      id: 'seniors',
      label: t('home.categories.seniors') || 'Senior Citizens',
      categoryQuery: 'Social Security & Health',
      icon: Users,
      color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800/70',
    },
    {
      id: 'jobs',
      label: t('home.categories.jobs') || 'Jobs & Work',
      categoryQuery: 'Jobs & Employment',
      icon: Briefcase,
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/70',
    },
    {
      id: 'housing',
      label: t('home.categories.housing') || 'Housing',
      categoryQuery: 'Housing & Urban Welfare',
      icon: HomeIcon,
      color: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800/70',
    },
  ];

  return (
    <div className="w-full px-4 py-4 space-y-4 max-w-[480px] mx-auto animate-in fade-in duration-150">
      {/* Friendly Greeting Header */}
      <section className="space-y-1 pt-1">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {t('home.greeting') || 'Namaste!'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
          {t('home.subtitle') || 'Discover government benefits you can get.'}
        </p>
      </section>

      {/* Two Compact Action Buttons (~48-52px height) */}
      <section className="space-y-2.5">
        {/* Primary 1: Find My Schemes */}
        <Link
          href="/find-schemes"
          className="touch-target w-full min-h-[52px] flex items-center justify-between p-3.5 rounded-2xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-[#0E2040] shadow-sm transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-[#0E2040]/10 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-[#D9531E]" />
            </div>
            <div className="text-left">
              <span className="block text-base font-black leading-tight">
                {t('home.findBtn') || 'Find my schemes'}
              </span>
              <span className="block text-xs opacity-80 font-medium">
                Answer 5 simple questions
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </Link>

        {/* Primary 2: Ask by Voice */}
        <Link
          href="/chat?voice=1"
          className="touch-target w-full min-h-[52px] flex items-center justify-between p-3.5 rounded-2xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/70 hover:bg-orange-100/70 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 text-[#0E2040] dark:text-white shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D9531E] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-base font-black leading-tight text-[#D9531E] dark:text-orange-400">
                {t('home.voiceBtn') || 'Ask by voice'}
              </span>
              <span className="block text-xs text-slate-600 dark:text-slate-300 font-medium">
                Speak in your regional language
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#D9531E] shrink-0" />
        </Link>
      </section>

      {/* Grid of Compact Category Tiles (~15-20% reduced) */}
      <section className="space-y-2 pt-1">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {t('home.categoriesTitle') || 'Choose a category'}
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  router.push(`/dashboard?category=${encodeURIComponent(cat.categoryQuery)}&source=browse`)
                }
                className={`touch-target flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all hover:shadow-xs active:scale-95 cursor-pointer min-h-[88px] ${cat.color}`}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 bg-white/70 dark:bg-black/20 shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-black leading-tight">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Small Single Trust Line */}
      <section className="pt-2 pb-2 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t('home.officialSource') || 'Answers from official government sources'}</span>
        </p>
      </section>
    </div>
  );
}
