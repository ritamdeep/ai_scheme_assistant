'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  Info,
  Sparkles,
} from 'lucide-react';
import { SchemeQuestion, AnswerOption } from '@/lib/dynamic-eligibility';
import { useTranslation } from '@/lib/i18n';

interface EligibilityQuestionCardProps {
  question: SchemeQuestion;
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (answer: AnswerOption) => void;
  onSkip?: () => void;
}

export function EligibilityQuestionCard({
  question,
  currentIndex,
  totalQuestions,
  onAnswer,
  onSkip,
}: EligibilityQuestionCardProps) {
  const { locale, t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState<string | null>(null);

  const questionText = question.question[locale] || question.question.en;
  const whyAskedText = question.whyAsked[locale] || question.whyAsked.en;
  const docText = question.requiredDocument[locale] || question.requiredDocument.en;
  const notSureHelp = question.howToAnswerNotSure[locale] || question.howToAnswerNotSure.en;

  // Speech-to-Text handler
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('eligibility.speechNotSupported'));
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        bn: 'bn-IN',
        ta: 'ta-IN',
      };
      recognition.lang = langMap[locale] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechTranscript(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        setSpeechTranscript(transcript);
        setIsListening(false);

        // Smart multilingual matching
        const yesKeywords = ['yes', 'yeah', 'correct', 'हाँ', 'हां', 'হ্যাঁ', 'হয়', 'ஆம்', 'ஆமாம்', 'అవును', 'ha', 'haa'];
        const noKeywords = ['no', 'nope', 'नहीं', 'না', 'নহয়', 'இல்லை', 'లేదు', 'nahi', 'na'];
        const notSureKeywords = ['not sure', 'dont know', "don't know", 'पता नहीं', 'নিশ্চিত নই', 'জানিনা', 'தெரியாது', 'తెలియదు', 'unknown'];

        if (yesKeywords.some((w) => transcript.includes(w))) {
          onAnswer('yes');
        } else if (noKeywords.some((w) => transcript.includes(w))) {
          onAnswer('no');
        } else if (notSureKeywords.some((w) => transcript.includes(w))) {
          onAnswer('not_sure');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Text-to-Speech handler
  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(questionText);
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
    };
    utterance.lang = langMap[locale] || 'en-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel(); // cancel previous
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header: Step & Voice Controls */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040]">
            {t('eligibility.stage2Title')}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('eligibility.questionOf', { current: currentIndex + 1, total: totalQuestions })}
          </span>
        </div>

        {/* Accessibility Voice Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReadAloud}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title={t('eligibility.readAloud')}
            aria-label={t('eligibility.readAloud')}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isListening
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title={t('eligibility.speakAnswer')}
            aria-label={t('eligibility.speakAnswer')}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isListening && <span className="text-[10px] font-bold">{t('eligibility.listening')}</span>}
          </button>
        </div>
      </div>

      {speechTranscript && (
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-[#D9531E]">Heard:</span> &ldquo;{speechTranscript}&rdquo;
        </div>
      )}

      {/* Main Question Text */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
          {questionText}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>{whyAskedText}</span>
        </p>
      </div>

      {/* Required Document Reference Banner */}
      <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">{t('eligibility.docNeeded')}</span>
          <span className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            {docText}
          </span>
        </div>
      </div>

      {/* 3 Main Action Option Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Yes Button */}
        <button
          type="button"
          onClick={() => onAnswer('yes')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t('eligibility.yesIDo')}</span>
        </button>

        {/* No Button */}
        <button
          type="button"
          onClick={() => onAnswer('no')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer hover:scale-[1.01]"
        >
          <XCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{t('eligibility.no')}</span>
        </button>

        {/* I'm Not Sure Button */}
        <button
          type="button"
          onClick={() => onAnswer('not_sure')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-[#D9531E] dark:text-orange-300 font-bold text-xs sm:text-sm border border-orange-200 dark:border-orange-800 transition-all cursor-pointer hover:scale-[1.01]"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>{t('eligibility.notSure')}</span>
        </button>
      </div>

      {/* Reassuring note for Not Sure */}
      <div className="text-center pt-1">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
          {t('eligibility.notSureHelp')}
        </p>
      </div>
    </div>
  );
}
