'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { EligibilityVerdict } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface EligibilityBadgeProps {
  verdict: EligibilityVerdict;
  compact?: boolean;
}

export function EligibilityBadge({ verdict, compact = false }: EligibilityBadgeProps) {
  const { t } = useTranslation();

  let badgeStyle = {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle2,
    label: t('schemeCard.canApply') || 'You can apply',
    subLabel: 'Your details meet all the main requirements.',
  };

  if (verdict.status === 'Needs More Info') {
    badgeStyle = {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      icon: AlertCircle,
      label: t('schemeCard.checkThings') || 'Check a few things',
      subLabel: 'A few details still need verification.',
    };
  } else if (verdict.status === 'Not Eligible') {
    badgeStyle = {
      bg: 'bg-slate-100 dark:bg-slate-800/80',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      icon: XCircle,
      label: t('schemeCard.notForYou') || 'Not for you right now',
      subLabel: 'Some requirements do not match your profile.',
    };
  }

  const IconComponent = badgeStyle.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}
      >
        <IconComponent className="w-4 h-4 shrink-0" />
        <span>{badgeStyle.label}</span>
      </span>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text} space-y-2`}>
      <div className="flex items-center gap-2">
        <IconComponent className="w-5 h-5 shrink-0" />
        <span className="font-extrabold text-base leading-tight">
          {badgeStyle.label}
        </span>
      </div>
      <p className="text-xs font-medium opacity-90">
        {badgeStyle.subLabel}
      </p>

      {/* Matched Summary */}
      {verdict.matchedCriteria.length > 0 && (
        <div className="mt-2 pt-2 border-t border-current/15 space-y-1">
          {verdict.matchedCriteria.slice(0, 2).map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs opacity-90">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{c.criterion}: {c.userValue || 'Verified'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
