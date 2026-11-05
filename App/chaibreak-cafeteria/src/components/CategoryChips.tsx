import React from 'react';
import { Category } from '../types';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  isLoading?: boolean;
}

export default function CategoryChips({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading = false,
}: CategoryChipsProps) {
  if (isLoading) {
    return (
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="h-8 w-20 rounded-lg bg-stone-200/70 animate-pulse shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <nav
      className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
      aria-label="Menu categories"
    >
      {/* "All" Category default option */}
      <button
        onClick={() => onSelectCategory('all')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-[#E05315]/30 ${
          selectedCategoryId === 'all'
            ? 'bg-[#E05315] text-white shadow-2xs'
            : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-200/40'
        }`}
      >
        All
      </button>

      {/* Dynamic categories fetched from API */}
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-[#E05315]/30 ${
              isSelected
                ? 'bg-[#E05315] text-white shadow-2xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-200/40'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </nav>
  );
}
