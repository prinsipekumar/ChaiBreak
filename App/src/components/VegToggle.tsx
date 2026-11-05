import React from 'react';

interface VegToggleProps {
  isVegOnly: boolean;
  onToggle: () => void;
  count?: number;
}

export default function VegToggle({ isVegOnly, onToggle, count }: VegToggleProps) {
  return (
    <div className="px-4 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-stone-700">
          Office Menu
        </span>
        {typeof count === 'number' && (
          <span className="text-[11px] text-stone-400">
            ({count} item{count === 1 ? '' : 's'})
          </span>
        )}
      </div>

      {/* Compact Vegetarian-Only Toggle */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
          isVegOnly
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
        }`}
        aria-pressed={isVegOnly}
      >
        {/* Standard Indian FSSAI Vegetarian Indicator */}
        <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center rounded-xs bg-white shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        </div>
        <span>Veg only</span>

        {/* Subtle switch track */}
        <div
          className={`w-6 h-3.5 rounded-full transition-colors flex items-center p-0.5 ml-1 ${
            isVegOnly ? 'bg-emerald-600' : 'bg-stone-300'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
              isVegOnly ? 'translate-x-2.5' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    </div>
  );
}
