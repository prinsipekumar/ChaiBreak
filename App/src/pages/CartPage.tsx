import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const [orderPlacedToken, setOrderPlacedToken] = useState<string | null>(null);

  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);
  const totalRupees = items.reduce((sum, item) => sum + item.item.price_rupees * item.qty, 0);

  const handlePreOrder = () => {
    if (items.length === 0) return;
    const token = `CB-${Math.floor(100 + Math.random() * 900)}`;
    clearCart();
    setOrderPlacedToken(token);
  };

  if (orderPlacedToken) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1F2421]">Pre-order Sent to Kitchen!</h2>
          <p className="text-xs text-stone-500 mt-1">
            Pick up your meal at Counter 2 using this token:
          </p>
        </div>

        <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-4 my-2">
          <span className="text-[10px] font-bold text-[#E05315] uppercase tracking-wider block">
            Pickup Token
          </span>
          <span className="text-2xl font-extrabold text-[#E05315] font-mono tracking-wider block mt-1">
            {orderPlacedToken}
          </span>
        </div>

        <div className="flex flex-col gap-2 w-full pt-2">
          <Link
            to="/orders"
            className="w-full py-2.5 rounded-xl bg-[#E05315] text-white text-xs font-bold shadow-2xs hover:bg-[#C84615] transition-colors"
          >
            Track in My Orders
          </Link>
          <Link
            to="/"
            onClick={() => setOrderPlacedToken(null)}
            className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition-colors"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 pb-8 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1F2421]">Canteen Cart</h2>
          <p className="text-xs text-stone-500">{totalCount} item{totalCount === 1 ? '' : 's'} selected for pre-order</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-16 px-6 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200/70">
          <ShoppingBag className="w-10 h-10 text-stone-300 mb-2.5 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-[#1F2421]">Your cart is empty</h3>
          <p className="text-xs text-stone-400 mt-0.5 max-w-xs mb-4">
            Select items from the canteen menu to add them to your pre-order cart.
          </p>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-[#E05315] text-white text-xs font-bold shadow-2xs hover:bg-[#C84615] transition-colors"
          >
            Explore Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs divide-y divide-stone-100">
            {items.map(({ item, qty }) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-center gap-2.5">
                <img
                  src={item.photo_url}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {item.is_veg && (
                      <div className="w-3 h-3 border border-emerald-600 flex items-center justify-center rounded-xs bg-white shrink-0">
                        <div className="w-1 h-1 rounded-full bg-emerald-600" />
                      </div>
                    )}
                    <h4 className="text-xs font-bold text-[#1F2421] truncate">{item.name}</h4>
                  </div>
                  <span className="text-xs font-bold font-mono text-stone-700 mt-0.5 block">
                    ₹{item.price_rupees * qty}
                  </span>
                </div>

                {/* Stepper */}
                <div className="flex items-center bg-stone-100 rounded-lg px-1.5 py-0.5 shrink-0">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-stone-700 hover:bg-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-[#1F2421] font-mono">
                    {qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-stone-700 hover:bg-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-stone-400 hover:text-rose-500 p-1 transition-colors shrink-0"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Pricing & Checkout Summary */}
          <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-xs text-stone-600">
              <span>Items Total ({totalCount})</span>
              <span className="font-mono text-stone-800">₹{totalRupees}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-stone-600">
              <span>Office Cafeteria Subsidy</span>
              <span className="text-emerald-700 font-medium">Free</span>
            </div>
            <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-sm font-bold text-[#1F2421]">
              <span>To Pay</span>
              <span className="font-mono text-base text-[#E05315]">₹{totalRupees}</span>
            </div>
          </div>

          <button
            onClick={handlePreOrder}
            className="w-full py-3 rounded-xl bg-[#E05315] hover:bg-[#C84615] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99] transition-all"
          >
            <span>Confirm Canteen Pre-order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
