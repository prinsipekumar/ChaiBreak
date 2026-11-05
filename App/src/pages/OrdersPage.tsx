import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ReceiptText, Clock, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { initialOrders, initialOrderItems } from '../data/seedData';
import { Order, OrderItem } from '../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="flex-1 p-4 pb-8 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1F2421]">My Orders</h2>
          <p className="text-xs text-stone-500">Live canteen tokens & pickup tracking</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E05315]' : ''}`} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 px-6 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200/70">
          <ReceiptText className="w-10 h-10 text-stone-300 mb-2.5 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-[#1F2421]">No orders yet</h3>
          <p className="text-xs text-stone-400 mt-0.5 max-w-xs mb-4">
            Items you pre-order will appear here with live pickup tokens.
          </p>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-[#E05315] text-white text-xs font-bold shadow-2xs hover:bg-[#C84615] transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isReady = order.status === 'READY';
            const isPreparing = order.status === 'PREPARING';
            const isCollected = order.status === 'COLLECTED';
            const itemsForOrder = orderItems.filter((oi) => oi.order_id === order.id);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs space-y-2.5"
              >
                {/* Header with Pickup Code & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Pickup Token
                    </span>
                    <span className="text-lg font-extrabold text-[#E05315] font-mono tracking-wide">
                      {order.pickup_code}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      isReady
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isPreparing
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : isCollected
                        ? 'bg-stone-100 text-stone-500'
                        : 'bg-orange-50 text-[#E05315] border border-orange-200'
                    }`}
                  >
                    {isReady ? 'Ready at Counter!' : order.status}
                  </span>
                </div>

                {/* Items in this order */}
                <div className="bg-stone-50/80 rounded-lg p-2.5 space-y-1 text-xs">
                  {itemsForOrder.map((oi) => (
                    <div key={oi.id} className="flex justify-between text-stone-700">
                      <span>
                        <strong className="text-stone-900 font-mono font-semibold">{oi.qty}×</strong>{' '}
                        {oi.item_name}
                      </span>
                      <span className="font-mono text-stone-700">
                        ₹{oi.price_rupees * oi.qty}
                      </span>
                    </div>
                  ))}

                  {order.note && (
                    <div className="text-[11px] text-stone-500 italic pt-1 border-t border-stone-200/60">
                      Note: "{order.note}"
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-200/60 flex justify-between font-bold text-[#1F2421]">
                    <span>Total</span>
                    <span className="font-mono text-[#E05315]">₹{order.total_rupees}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
