'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="w-full px-4 py-16 text-center space-y-5 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900 shadow-2xs">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-1.5 max-w-xs mx-auto">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          We could not load this information. Check your internet connection and try again.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="touch-target w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] font-bold text-base shadow-sm"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Try again</span>
        </button>

        <Link
          href="/"
          className="touch-target w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-base"
        >
          <Home className="w-5 h-5" />
          <span>Go to Home</span>
        </Link>
      </div>
    </div>
  );
}
