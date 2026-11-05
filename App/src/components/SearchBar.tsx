import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search chai, snacks and food...',
}: SearchBarProps) {
  return (
    <div className="px-4 py-2">
      <div className="relative flex items-center bg-white border border-stone-200/90 rounded-xl px-3 py-2.5 transition-all focus-within:border-[#E05315] focus-within:ring-2 focus-within:ring-[#E05315]/15 shadow-2xs">
        <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2.5 stroke-[2]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#1F2421] placeholder-stone-400 focus:outline-none"
        />
        {value.length > 0 && (
          <button
            onClick={() => onChange('')}
            className="w-4 h-4 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors ml-1 shrink-0"
            aria-label="Clear search"
          >
            <X className="w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
}
