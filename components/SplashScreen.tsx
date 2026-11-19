'use client';

import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [show, setShow] = useState<boolean>(false);
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
    try {
      const alreadyShown = sessionStorage.getItem('seva_splash_shown');
      if (!alreadyShown) {
        setShow(true);

        // Begin smooth fade out at 1.2s
        const fadeTimer = setTimeout(() => {
          setFadingOut(true);
        }, 1200);

        // Complete transition and hide at 1.5s total
        const removeTimer = setTimeout(() => {
          try {
            sessionStorage.setItem('seva_splash_shown', 'true');
          } catch (e) {}
          setShow(false);
          onFinish?.();
        }, 1500);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(removeTimer);
        };
      }
    } catch (e) {
      // If sessionStorage is unavailable or fails, don't block
    }
  }, [onFinish]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="SEVA.AI Loading"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0E2040] text-white transition-opacity duration-300 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4 px-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
        {/* Centered Emblem / Logo Graphic with Orange Accent */}
        <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center relative shadow-2xl backdrop-blur-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-11 h-11 text-white"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            <circle cx="12" cy="11.5" r="1.2" fill="currentColor" />
          </svg>
          {/* Orange Accent Dot */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D9531E] ring-4 ring-[#0E2040]" />
        </div>

        {/* Name and Tagline */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            SEVA<span className="text-[#D9531E]">.AI</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-300 tracking-wide">
            National Scheme Assistant
          </p>
        </div>
      </div>
    </div>
  );
}
