'use client';

import React, { useState } from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  FileCheck2,
} from 'lucide-react';
import { Scheme } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import {
  getSchemeSpecificQuestions,
  evaluateStage2Eligibility,
  AnswerOption,
  SCHEME_QUESTIONS,
} from '@/lib/dynamic-eligibility';
import { EligibilityQuestionCard } from './EligibilityQuestionCard';

interface Stage2VerificationModalProps {
  scheme: Scheme | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Stage2VerificationModal({ scheme, isOpen, onClose }: Stage2VerificationModalProps) {
  const { profile, isSchemeSaved, toggleSaveScheme } = useAuth();
  const { locale, t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});

  if (!isOpen || !scheme) return null;

  const relevantQuestions = SCHEME_QUESTIONS.filter((q) => q.schemeId === scheme.id);
  const remainingQuestions = getSchemeSpecificQuestions(scheme.id, profile, answers);
  const evaluation = evaluateStage2Eligibility(scheme, profile, answers, locale);

  const isSaved = isSchemeSaved(scheme.id);
  const totalQuestions = relevantQuestions.length;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (option: AnswerOption) => {
    if (remainingQuestions.length > 0) {
      const currentQ = remainingQuestions[0];
      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: option,
      }));
    }
  };

  const handleReset = () => {
    setAnswers({});
  };

  // Status badge styling (plain language, no percentages)
  const statusConfig = {
    LIKELY_ELIGIBLE: {
      label: t('schemeCard.canApply') || 'You can apply',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-300 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      badgeBg: 'bg-emerald-600',
      icon: CheckCircle2,
    },
    POTENTIALLY_ELIGIBLE: {
      label: t('schemeCard.checkThings') || 'Check a few things',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-300 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      badgeBg: 'bg-amber-600',
      icon: HelpCircle,
    },
    NOT_ELIGIBLE: {
      label: t('schemeCard.notForYou') || 'Not for you right now',
      bg: 'bg-slate-100 dark:bg-slate-800/80',
      border: 'border-slate-300 dark:border-slate-700',
      text: 'text-slate-800 dark:text-slate-200',
      badgeBg: 'bg-slate-600',
      icon: XCircle,
    },
  }[evaluation.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stage2-modal-title"
    >
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Civic Gradient Accent */}
        <div className="h-2 bg-gradient-to-r from-[#0E2040] via-[#D9531E] to-[#0E2040]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
              <Shield className="w-3.5 h-3.5 text-[#D9531E]" />
              <span>{scheme.ministry}</span>
            </div>
            <h2 id="stage2-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {scheme.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('eligibility.stage2Desc')}
            </p>
          </div>

          {/* Current Question or Results */}
          {remainingQuestions.length > 0 ? (
            <div className="space-y-4">
              <EligibilityQuestionCard
                question={remainingQuestions[0]}
                currentIndex={answeredCount}
                totalQuestions={totalQuestions}
                onAnswer={handleAnswer}
              />
            </div>
          ) : (
            /* All Questions Completed — Detailed Progressive Verdict & Transparency Report */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Verdict Summary Card */}
              <div
                className={`p-6 rounded-3xl border ${statusConfig.border} ${statusConfig.bg} space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl ${statusConfig.badgeBg} text-white flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      <StatusIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                        {t('schemeDetail.verdictSummary')}
                      </span>
                      <h3 className={`text-base sm:text-lg font-black ${statusConfig.text}`}>
                        {statusConfig.label}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  {t('eligibility.disclaimer')}
                </p>
              </div>

              {/* "Why this scheme?" Transparency Section */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <FileCheck2 className="w-4 h-4 text-[#D9531E]" />
                  <h4>{t('eligibility.whyTitle')}</h4>
                </div>

                {/* Satisfied Criteria */}
                {evaluation.whyThisScheme.matchedReasons.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      {t('eligibility.matchedReason')}
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {evaluation.whyThisScheme.matchedReasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Uncertain Criteria */}
                {evaluation.whyThisScheme.uncertainReasons.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      {t('eligibility.uncertainReason')}
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {evaluation.whyThisScheme.uncertainReasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Unmet Criteria */}
                {evaluation.whyThisScheme.unmetReasons.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block">
                      {t('eligibility.unmatchedReason')}
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {evaluation.whyThisScheme.unmetReasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Documents Checklist */}
                {evaluation.whyThisScheme.requiredDocuments.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      {t('schemeDetail.documents')}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {evaluation.whyThisScheme.requiredDocuments.map((doc, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                        >
                          📄 {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('eligibility.reverify')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSaveScheme(scheme.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-3.5 h-3.5 text-[#D9531E] fill-current" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{isSaved ? t('common.saved') : t('common.save')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={scheme.official_apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#0E2040] text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{t('schemeDetail.visitPortal')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
