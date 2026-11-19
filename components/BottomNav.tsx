'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export function BottomNav() {
  const pathname = usePathname();
  const { savedSchemeIds } = useAuth();
  const { t } = useTranslation();

  // Hide bottom nav on full-screen language selection page
  if (pathname === '/language') return null;

  const tabs = [
    {
      id: 'home',
      name: t('nav.home') || 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/scheme'),
    },
    {
      id: 'saved',
      name: t('nav.saved') || 'Saved',
      href: '/saved',
      icon: Bookmark,
      badge: savedSchemeIds.length,
      isActive: pathname === '/saved',
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1120]/95 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-[480px] mx-auto grid grid-cols-2 items-center h-16 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors duration-150 cursor-pointer ${
                active
                  ? 'text-[#D9531E] dark:text-orange-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {/* Soft rounded background pill behind the icon */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 ease-out flex items-center justify-center ${
                  active
                    ? 'bg-orange-50 dark:bg-orange-950/60 ring-1 ring-orange-200/70 dark:ring-orange-800/50'
                    : 'bg-transparent'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? 'stroke-[2.4] scale-105' : 'stroke-2'
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#D9531E] text-white ring-2 ring-white dark:ring-[#0B1120]">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-xs mt-1 leading-tight tracking-tight transition-all duration-150 ${
                  active ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
