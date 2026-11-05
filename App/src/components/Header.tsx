import React, { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const { isAuthenticated, toggleAuth } = useAuthStore();
  const [greeting, setGreeting] = useState('Good morning!');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning!');
    } else if (hour < 17) {
      setGreeting('Good afternoon!');
    } else {
      setGreeting('Good evening!');
    }
  }, []);

  const handleToggleAuth = () => {
    toggleAuth();
    const nextState = !isAuthenticated;
    setToastMessage(nextState ? 'Signed in as Aarav Patel' : 'Signed out of ChaiBreak');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <header className="relative px-4 pt-3 pb-2.5 flex items-center justify-between border-b border-stone-200/60 bg-[#FAF9F6]">
      {/* Brand & Greeting */}
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-bold tracking-tight text-[#1F2421]">
            ChaiBreak
          </h1>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E05315]"></span>
        </div>
        <p className="text-xs font-medium text-stone-500 mt-0.5">
          {greeting}
        </p>
      </div>

      {/* Top Right: Simple Login / Logout Icon Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleAuth}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#E05315]/30 ${
            isAuthenticated
              ? 'bg-stone-100 hover:bg-stone-200/80 text-stone-700 border-stone-200/80'
              : 'bg-[#E05315] hover:bg-[#C84615] text-white border-transparent shadow-2xs'
          }`}
          title={isAuthenticated ? 'Click to Log out' : 'Click to Log in'}
          aria-label={isAuthenticated ? 'Log out' : 'Log in'}
        >
          {isAuthenticated ? (
            <>
              <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="text-[11px]">Logout</span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="text-[11px]">Login</span>
            </>
          )}
        </button>
      </div>

      {/* Ephemeral Feedback Toast */}
      {toastMessage && (
        <div className="absolute left-1/2 -translate-x-1/2 top-14 bg-stone-900/90 text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </header>
  );
}
