import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorState({
  message = 'Failed to load canteen menu items. Please check connection.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-500 mb-3">
        <AlertCircle className="w-6 h-6 stroke-[1.8]" />
      </div>

      <h3 className="text-sm font-bold text-[#1F2421] mb-1">
        Unable to load menu
      </h3>

      <p className="text-xs text-stone-500 max-w-xs mb-5 leading-relaxed">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 shadow-2xs active:scale-95 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5 stroke-[2.2]" />
        <span>Try again</span>
      </button>
    </div>
  );
}
