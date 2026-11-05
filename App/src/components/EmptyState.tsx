import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  searchQuery: string;
  isVegOnly: boolean;
  onReset: () => void;
}

export default function EmptyState({
  searchQuery,
  isVegOnly,
  onReset,
}: EmptyStateProps) {
  return (
    <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-400 mb-3">
        <SearchX className="w-6 h-6 stroke-[1.8]" />
      </div>

      <h3 className="text-sm font-bold text-[#1F2421] mb-1">
        No canteen items found
      </h3>

      <p className="text-xs text-stone-500 max-w-xs mb-5 leading-relaxed">
        {searchQuery ? (
          <>
            No dishes matching <span className="font-semibold text-stone-700">"{searchQuery}"</span>
            {isVegOnly && <span> with vegetarian filter</span>}.
          </>
        ) : isVegOnly ? (
          <>No vegetarian options available in this category.</>
        ) : (
          <>No items available in this category at this time.</>
        )}
      </p>

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#E05315] hover:bg-[#C84615] shadow-2xs active:scale-95 transition-all"
      >
        <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
        <span>Reset search & filters</span>
      </button>
    </div>
  );
}
