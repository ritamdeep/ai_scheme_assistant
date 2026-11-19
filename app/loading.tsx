import React from 'react';

export default function Loading() {
  return (
    <div className="w-full px-4 py-6 space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2" />
      <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full mt-4" />
      <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    </div>
  );
}
