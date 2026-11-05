import React, { useState } from 'react';
import { X, Plus, Minus, Check, Utensils } from 'lucide-react';
import { Item } from '../types';
import { useCartStore } from '../store/cartStore';

interface ItemDetailBottomSheetProps {
  item: Item | null;
  onClose: () => void;
}

export default function ItemDetailBottomSheet({
  item,
  onClose,
}: ItemDetailBottomSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const addItemToCart = useCartStore((state) => state.addItem);

  if (!item) return null;

  const isSoldOut = item.stock_left === 0 || !item.is_available;
  const maxAvailable = Math.max(0, item.stock_left);

  const handleAddToCart = () => {
    if (isSoldOut) return;
    const success = addItemToCart(item, quantity);
    if (success) {
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        onClose();
      }, 400);
    }
  };

  const totalPrice = item.price_rupees * quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar for mobile ergonomic swipe */}
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Large Food Image */}
        <div className="relative w-full h-52 sm:h-56 bg-stone-100 shrink-0">
          {!imgError && item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.name}
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover ${isSoldOut ? 'grayscale-[35%]' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400">
              <Utensils className="w-10 h-10 stroke-[1.5] mb-2" />
              <span className="text-xs font-semibold text-stone-600">{item.name}</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-900/60 hover:bg-stone-900/80 text-white flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Vegetarian Indicator */}
          {item.is_veg && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-md shadow-2xs">
              <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center rounded-xs bg-white">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
              <span className="text-[11px] font-bold text-emerald-800">
                Vegetarian
              </span>
            </div>
          )}

          {/* Sold out overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
              <span className="px-3.5 py-1.5 bg-stone-900/90 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-sm border border-white/20">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Details Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-[#1F2421] leading-snug">
              {item.name}
            </h2>
            <span className="text-base sm:text-lg font-bold text-[#1F2421] font-mono shrink-0">
              ₹{item.price_rupees}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {item.description}
          </p>

          {isSoldOut ? (
            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600">
              This item is currently out of stock or marked unavailable by the canteen kitchen.
            </div>
          ) : (
            <div className="text-[11px] text-stone-400">
              {item.stock_left <= 5 && item.stock_left > 0 ? (
                <span className="text-amber-700 font-medium">
                  Limited canteen stock: {item.stock_left} remaining
                </span>
              ) : (
                <span>Available for office canteen pre-order</span>
              )}
            </div>
          )}
        </div>

        {/* Footer with Quantity & Add to Cart button */}
        <div className="p-4 border-t border-stone-200/80 bg-[#FAF9F6] flex items-center gap-3 shrink-0">
          {!isSoldOut && (
            <div className="flex items-center bg-white border border-stone-200 rounded-lg px-2 py-1 shadow-2xs">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center text-xs font-bold text-[#1F2421] font-mono">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                disabled={quantity >= maxAvailable}
                className="w-7 h-7 rounded flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isSoldOut || justAdded}
            className={`flex-1 h-11 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs ${
              isSoldOut
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#E05315] hover:bg-[#C84615] text-white active:scale-[0.98]'
            }`}
          >
            {isSoldOut ? (
              <span>Sold Out</span>
            ) : justAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Added to Cart</span>
              </>
            ) : (
              <span>Add to Cart · ₹{totalPrice}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
