'use client';

import React, { useState } from 'react';
import { FileText, ExternalLink, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { SourceCitation } from '@/lib/types';

interface SourceCardProps {
  source: SourceCitation;
  defaultExpanded?: boolean;
}

export function SourceCard({ source, defaultExpanded = false }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden text-xs">
      <div className="p-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {source.documentTitle}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                {source.sourceType}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {source.schemeName} • {source.ministry}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse source' : 'Expand source excerpt'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <a
            href={source.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md text-slate-500 hover:text-[#D9531E] dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Open official portal"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-[11px] text-slate-700 dark:text-slate-300">
          {source.sectionTitle && (
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Section: {source.sectionTitle}
            </p>
          )}
          <blockquote className="border-l-2 border-slate-300 dark:border-slate-700 pl-2.5 py-0.5 italic text-slate-600 dark:text-slate-400 leading-relaxed">
            &ldquo;{source.excerpt}&rdquo;
          </blockquote>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>Verified Official Documentation</span>
            <a
              href={source.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#D9531E] dark:text-orange-400 hover:underline inline-flex items-center gap-1"
            >
              Visit {source.sourceType} &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
