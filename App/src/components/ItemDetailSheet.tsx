import { useState } from 'react';
import { X, Plus, Minus, Check, Clock, Flame, Utensils, AlertCircle } from 'lucide-react';
import { Item } from '../types';

interface ItemDetailSheetProps {
  item: Item | null;
  onClose: () => void;
  onAddToCart: (item: Item, qty: number, note: string) => void;
  currentCartQty?: number;
}

export default function ItemDetailSheet({
  item,
  onClose,
  onAddToCart,
  currentCartQty = 0,
}: ItemDetailSheetProps) {
  if (!item) return null;

  const [quantity, setQuantity] = useState(1);
  const [specialNote, setSpecialNote] = useState('');
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isSoldOut = item.stock_left <= 0 || !item.is_available;
  const maxAvailable = Math.max(0, item.stock_left);

  const handleAdd = () => {
    if (isSoldOut) return;
    onAddToCart(item, quantity, specialNote);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 450);
  };

  const totalPrice = item.price_rupees * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar affordance for mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Hero Photo & Close Button */}
        <div className="relative w-full h-52 sm:h-60 bg-slate-100 shrink-0">
          {!imageError && item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.name}
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 text-orange-400">
              <Utensils className="w-12 h-12 stroke-[1.5] mb-2" />
              <span className="text-sm font-semibold text-slate-600">{item.name}</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center transition-all focus:outline-none"
            aria-label="Close details"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Veg Indicator */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
            <div
              className={`w-4 h-4 border flex items-center justify-center rounded-xs ${
                item.is_veg ? 'border-emerald-600' : 'border-rose-600'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
            </span>
          </div>

          {/* Sold out overlay if out of stock */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center">
              <span className="px-4 py-1.5 bg-rose-600 text-white text-sm font-bold uppercase tracking-wider rounded-full shadow-lg">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Scrollable details body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{item.name}</h2>
              <span className="text-xl font-extrabold text-orange-600 font-mono shrink-0">
                ₹{item.price_rupees}
              </span>
            </div>

            {/* Micro specs */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              {item.prep_time_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.prep_time_minutes} mins prep</span>
                </div>
              )}
              {item.calories && (
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>{item.calories} kcal</span>
                </div>
              )}
              <span className="text-slate-300">·</span>
              <span className={item.stock_left > 0 ? 'text-emerald-600 font-medium' : 'text-rose-500 font-medium'}>
                {item.stock_left > 5
                  ? 'In Stock'
                  : item.stock_left > 0
                  ? `Only ${item.stock_left} left`
                  : 'Out of Stock'}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>

          {/* Special notes input */}
          {!isSoldOut && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Special Instructions (Optional)
              </label>
              <input
                type="text"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="e.g., Less spicy, no onions, extra green chutney..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          )}

          {/* Sold out notice */}
          {isSoldOut && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                This item is currently sold out or marked unavailable by the kitchen staff. Please check back later.
              </span>
            </div>
          )}
        </div>

        {/* Footer with Qty and Add to Cart button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3 shrink-0">
          {!isSoldOut && (
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-2 py-1 shadow-xs">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-slate-900 font-mono">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                disabled={quantity >= maxAvailable}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Add to Cart button that calls F3 Store */}
          <button
            onClick={handleAdd}
            disabled={isSoldOut || addedAnimation}
            className={`flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              isSoldOut
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : addedAnimation
                ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-[0.98]'
            }`}
          >
            {isSoldOut ? (
              <span>Item Sold Out</span>
            ) : addedAnimation ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <span>Add to Cart • ₹{totalPrice}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
