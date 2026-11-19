'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Gift,
  FileText,
  Compass,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { ChatMessage, StructuredChatAnswer } from '@/lib/types';

interface ChatMessageRendererProps {
  message: ChatMessage;
  locale?: string;
}

const SECTION_LABELS: Record<string, { whatYouGet: string; documents: string; nextStep: string; visitPortal: string }> = {
  en: {
    whatYouGet: 'What you get',
    documents: 'Documents you need',
    nextStep: 'Next step',
    visitPortal: 'Open official website',
  },
  hi: {
    whatYouGet: 'आपको क्या लाभ मिलेगा',
    documents: 'जरूरी दस्तावेज',
    nextStep: 'अगला कदम',
    visitPortal: 'आधिकारिक वेबसाइट खोलें',
  },
  bn: {
    whatYouGet: 'আপনি কী সুবিধা পাবেন',
    documents: 'প্রয়োজনীয় কাগজপত্র',
    nextStep: 'পরবর্তী পদক্ষেপ',
    visitPortal: 'সরকারি ওয়েবসাইট দেখুন',
  },
  ta: {
    whatYouGet: 'உங்களுக்கு என்ன கிடைக்கும்',
    documents: 'தேவையான ஆவணங்கள்',
    nextStep: 'அடுத்த படி',
    visitPortal: 'அதிகாரப்பூர்வ இணையதளத்தை திறக்கவும்',
  },
};

export function ChatMessageRenderer({ message, locale = 'en' }: ChatMessageRendererProps) {
  const langKey = locale.slice(0, 2);
  const labels = SECTION_LABELS[langKey] || SECTION_LABELS.en;
  const structured = message.structuredAnswer;

  // Case 1: Structured JSON Answer
  if (structured && (structured.summary || structured.benefit)) {
    return (
      <div className="w-full space-y-3.5 text-slate-900 dark:text-slate-100 break-words">
        {/* 1. Summary (Lead Text) */}
        {structured.summary && (
          <p className="text-base sm:text-[17px] font-semibold leading-relaxed text-slate-900 dark:text-white">
            {structured.summary}
          </p>
        )}

        {/* 2. What you get Card */}
        {structured.benefit && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{labels.whatYouGet}</span>
            </div>
            <div className="text-sm sm:text-base font-medium text-emerald-950 dark:text-emerald-100 leading-relaxed">
              <MarkdownInline content={structured.benefit} />
            </div>
          </div>
        )}

        {/* 3. Documents you need Checklist */}
        {structured.documents && structured.documents.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{labels.documents}</span>
            </div>
            <ul className="space-y-2 pt-0.5" role="list">
              {structured.documents.map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Next Step Card */}
        {structured.next_step && (
          <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D9531E] dark:text-orange-300">
              <Compass className="w-4 h-4 text-[#D9531E] shrink-0" />
              <span>{labels.nextStep}</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              <MarkdownInline content={structured.next_step} />
            </div>
          </div>
        )}

        {/* 5. Tappable "Open official website" Button */}
        {structured.source_url && (
          <div className="pt-1">
            <a
              href={structured.source_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={labels.visitPortal}
              className="touch-target w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#0E2040] font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <span>{labels.visitPortal}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
          </div>
        )}

        {/* 6. Single Follow-up Question */}
        {structured.follow_up_question && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200">
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>{structured.follow_up_question}</span>
          </div>
        )}
      </div>
    );
  }

  // Case 2: Clean Markdown Fallback Renderer
  return (
    <div className="w-full text-slate-900 dark:text-slate-100 text-base sm:text-[17px] leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-1">
              <Info className="w-4 h-4 text-[#D9531E] shrink-0" />
              <span>{children}</span>
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-3.5 mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#D9531E] shrink-0" />
              <span>{children}</span>
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D9531E] inline-block shrink-0" />
              <span>{children}</span>
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 leading-relaxed text-slate-900 dark:text-slate-100 text-base sm:text-[17px]">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#D9531E] dark:text-orange-400">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="space-y-2 my-2.5 list-none pl-0" role="list">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 my-2.5 list-decimal pl-5" role="list">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E2040] dark:bg-white shrink-0 mt-2" />
              <div className="flex-1">{children}</div>
            </li>
          ),
          hr: () => (
            <hr className="my-3 border-t border-slate-200 dark:border-slate-700" />
          ),
          a: ({ href, children }) => {
            const isGovUrl = href?.includes('.gov.in') || href?.includes('myscheme');
            const displayText = isGovUrl ? labels.visitPortal : children;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex items-center gap-1.5 min-h-[48px] py-2.5 px-4 my-1.5 rounded-xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#0E2040] font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <span>{displayText}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            );
          },
        }}
      >
        {message.text}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Lightweight helper for inline bold/link parsing inside structured cards
 */
function MarkdownInline({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <span>{children}</span>,
        strong: ({ children }) => (
          <strong className="font-bold text-slate-900 dark:text-white">
            {children}
          </strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 dark:text-blue-300 font-bold underline inline-flex items-center gap-0.5"
          >
            <span>{children}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
