import React, { useState } from 'react';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Item } from '../types';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  items: Item[];
  onToggleKitchenStock?: (item: Item) => Promise<void>;
}

export default function PullToRefreshIndicator({
  isRefreshing,
  onRefresh,
  items,
  onToggleKitchenStock,
}: PullToRefreshIndicatorProps) {
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const handleSimulateSoldOut = async (item: Item) => {
    if (!onToggleKitchenStock) return;
    await onToggleKitchenStock(item);
    setShowSimMenu(false);
    setSimMessage(`Kitchen marked "${item.name}" as ${item.is_available && item.stock_left > 0 ? 'SOLD OUT' : 'AVAILABLE'}. Pull to refresh to verify!`);
    setTimeout(() => setSimMessage(null), 4000);
  };

  return (
    <div className="px-4 py-1.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] text-stone-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Live Canteen Menu</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtle Kitchen Sold Out Test Simulation Trigger */}
          {onToggleKitchenStock && items.length > 0 && (
            <button
              onClick={() => setShowSimMenu(!showSimMenu)}
              className="text-[10px] font-semibold text-stone-500 hover:text-stone-800 underline decoration-stone-300"
              title="Test kitchen sold-out behavior"
            >
              Simulate kitchen
            </button>
          )}

          {/* Pull to Refresh button */}
          <button
            onClick={() => onRefresh()}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-colors disabled:opacity-50"
            aria-label="Refresh menu items"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#E05315]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Pull to refresh'}</span>
          </button>
        </div>
      </div>

      {/* Verification notification */}
      {simMessage && (
        <div className="p-2 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 animate-in fade-in duration-150">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{simMessage}</span>
        </div>
      )}

      {/* Simulation dropdown */}
      {showSimMenu && (
        <div className="bg-white border border-stone-200 rounded-xl p-2.5 shadow-md space-y-1.5 z-20 text-left animate-in fade-in duration-150">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
            Simulate Kitchen Action (Mark item Sold Out):
          </p>
          <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
            {items.slice(0, 4).map((i) => {
              const isCurrentlySoldOut = i.stock_left === 0 || !i.is_available;
              return (
                <button
                  key={i.id}
                  onClick={() => handleSimulateSoldOut(i)}
                  className="w-full px-2 py-1.5 rounded-md hover:bg-stone-50 text-[11px] flex items-center justify-between text-stone-700 border border-stone-100"
                >
                  <span className="truncate max-w-[170px]">{i.name}</span>
                  <span className={`text-[10px] font-bold ${isCurrentlySoldOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isCurrentlySoldOut ? 'Mark In Stock' : 'Mark Sold Out'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
