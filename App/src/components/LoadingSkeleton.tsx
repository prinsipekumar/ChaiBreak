import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-stone-200/80 p-2.5 space-y-2 animate-pulse text-left"
        >
          {/* Image placeholder */}
          <div className="w-full aspect-[4/3] rounded-lg bg-stone-200/70" />

          {/* Title placeholder */}
          <div className="h-4 w-3/4 rounded bg-stone-200/70" />

          {/* Description placeholder */}
          <div className="space-y-1">
            <div className="h-2.5 w-full rounded bg-stone-200/50" />
            <div className="h-2.5 w-2/3 rounded bg-stone-200/50" />
          </div>

          {/* Footer action */}
          <div className="pt-2 flex justify-between items-center">
            <div className="h-4 w-10 rounded bg-stone-200/70" />
            <div className="h-7 w-14 rounded-lg bg-stone-200/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
