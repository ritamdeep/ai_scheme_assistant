'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="w-full px-4 py-16 text-center space-y-5 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-1.5 max-w-xs mx-auto">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Page not found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/"
          className="touch-target inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] font-bold text-base shadow-sm"
        >
          <Home className="w-5 h-5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
