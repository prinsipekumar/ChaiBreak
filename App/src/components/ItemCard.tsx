import React, { useState } from 'react';
import { Plus, Utensils } from 'lucide-react';
import { Item } from '../types';

interface ItemCardProps {
  item: Item;
  onSelect: (item: Item) => void;
  onAddToCart: (item: Item, e: React.MouseEvent) => void;
  cartQty?: number;
}

export default function ItemCard({
  item,
  onSelect,
  onAddToCart,
  cartQty = 0,
}: ItemCardProps) {
  const [imgError, setImgError] = useState(false);
  const isSoldOut = item.stock_left === 0 || !item.is_available;

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group flex flex-col justify-between bg-white rounded-xl border p-2.5 transition-all text-left cursor-pointer h-full ${
        isSoldOut
          ? 'border-stone-200 bg-stone-50/60 opacity-65 cursor-not-allowed'
          : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
      }`}
    >
      <div>
        {/* Food Image Container with fixed aspect ratio */}
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 mb-2">
          {!imgError && item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.name}
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-transform duration-200 ${
                isSoldOut ? 'grayscale-[35%]' : 'group-hover:scale-102'
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-2 text-center">
              <Utensils className="w-6 h-6 stroke-[1.5] mb-1" />
              <span className="text-[10px] text-stone-400 line-clamp-1">{item.name}</span>
            </div>
          )}

          {/* Green Vegetarian Indicator when is_veg is true */}
          {item.is_veg && (
            <div
              className="absolute top-2 left-2 bg-white/95 p-0.5 rounded-xs shadow-2xs"
              title="Vegetarian"
            >
              <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center rounded-xs bg-white">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            </div>
          )}

          {/* Clear Sold Out Badge overlay when stock_left = 0 OR is_available = false */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-2.5 py-1 bg-stone-900/90 text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow-xs border border-white/20">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-[#1F2421] line-clamp-1 group-hover:text-[#E05315] transition-colors">
            {item.name}
          </h3>
          <p className="text-[11px] text-stone-500 line-clamp-2 leading-snug min-h-[28px]">
            {item.description}
          </p>
        </div>
      </div>

      {/* Price & Add to Cart Action Row */}
      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
        <span className="text-xs sm:text-sm font-bold text-[#1F2421] font-mono">
          ₹{item.price_rupees}
        </span>

        {isSoldOut ? (
          <button
            disabled
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-stone-400 bg-stone-200/70 cursor-not-allowed select-none"
          >
            Sold Out
          </button>
        ) : cartQty > 0 ? (
          <button
            onClick={(e) => onAddToCart(item, e)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors flex items-center gap-1"
          >
            <span>{cartQty} in cart</span>
          </button>
        ) : (
          <button
            onClick={(e) => onAddToCart(item, e)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#E05315] bg-orange-50 border border-orange-200/80 hover:bg-[#E05315] hover:text-white transition-all flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#E05315]/30"
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
}
