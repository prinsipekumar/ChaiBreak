import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ReceiptText, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function BottomNavBar() {
  const location = useLocation();
  const totalCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.qty, 0)
  );

  // Exact navigation order requested:
  // 1. Menu, 2. My Orders, 3. Cart, 4. Profile
  const navItems = [
    {
      to: '/',
      label: 'Menu',
      icon: UtensilsCrossed,
      isActive: location.pathname === '/' || location.pathname === '/menu',
    },
    {
      to: '/orders',
      label: 'My Orders',
      icon: ReceiptText,
      isActive: location.pathname.startsWith('/orders'),
    },
    {
      to: '/cart',
      label: 'Cart',
      icon: ShoppingBag,
      badge: totalCount > 0 ? totalCount : null,
      isActive: location.pathname.startsWith('/cart'),
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
      isActive: location.pathname.startsWith('/profile'),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      aria-label="Bottom Navigation Bar"
    >
      <div className="max-w-[420px] mx-auto grid grid-cols-4 items-center px-1.5 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 relative group focus:outline-none focus:ring-2 focus:ring-[#E05315]/20 ${
                active
                  ? 'text-[#E05315] font-bold bg-orange-50/70'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    active ? 'stroke-[2.4] scale-105' : 'stroke-[1.8] group-hover:scale-105'
                  }`}
                />

                {/* Cart Quantity Badge */}
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-[#E05315] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>

              {/* Active Indicator Micro-dot */}
              {active && (
                <span className="w-1 h-1 rounded-full bg-[#E05315] mt-0.5" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
