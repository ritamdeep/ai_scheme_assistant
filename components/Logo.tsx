import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTagline?: boolean;
}

export function Logo({ size = 'md', className = '', showTagline = true }: LogoProps) {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Minimal Civic Speech Mark Icon */}
      <div
        className={`${iconDimensions} rounded-lg bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] flex items-center justify-center relative shadow-xs shrink-0`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/6 h-4/6"
        >
          {/* Subtle civic structure / speech mark geometry */}
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          {/* Minimal pillar accent dot */}
          <circle cx="12" cy="11.5" r="1" fill="currentColor" />
        </svg>

        {/* Subtle Saffron Accent Dot */}
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D9531E] ring-2 ring-white dark:ring-[#0B1120]"
          title="Citizen Scheme Assistant"
        />
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight ${textSizes} text-slate-900 dark:text-white`}>
            SEVA<span className="text-[#D9531E]">.AI</span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Civic AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-normal">
            National Scheme Assistant
          </span>
        )}
      </div>
    </div>
  );
}
