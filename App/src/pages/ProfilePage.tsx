import React from 'react';
import { User, MapPin, Mail, Building2, CreditCard, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const { isAuthenticated, user, toggleAuth } = useAuthStore();

  return (
    <div className="flex-1 p-4 pb-8 space-y-4 text-left">
      <div>
        <h2 className="text-base font-bold text-[#1F2421]">Employee Profile</h2>
        <p className="text-xs text-stone-500">Office credentials & canteen allowance</p>
      </div>

      {isAuthenticated && user ? (
        <>
          {/* User Card */}
          <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-[#E05315] font-bold text-base flex items-center justify-center shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#1F2421] truncate">{user.name}</h3>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-xs text-stone-500 truncate">{user.email}</p>
              <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600 mt-1">
                ID: {user.empId}
              </span>
            </div>
          </div>

          {/* Details & Allowance Card */}
          <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-600">
                <Building2 className="w-4 h-4 text-stone-400" />
                <span>Department</span>
              </div>
              <span className="font-semibold text-stone-800">{user.department}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span>Desk Location</span>
              </div>
              <span className="font-semibold text-stone-800 text-right truncate max-w-[190px]">{user.desk}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-600">
                <CreditCard className="w-4 h-4 text-[#E05315]" />
                <span>Meal Allowance</span>
              </div>
              <span className="font-mono font-bold text-[#E05315] text-sm">₹1,250</span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={toggleAuth}
            className="w-full py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </>
      ) : (
        /* Signed out view */
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <User className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1F2421]">You are currently signed out</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Sign in with your corporate profile to view desk pickup tokens and canteen allowance.
            </p>
          </div>
          <button
            onClick={toggleAuth}
            className="w-full py-2.5 rounded-xl bg-[#E05315] text-white font-bold text-xs shadow-2xs hover:bg-[#C84615] flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to ChaiBreak</span>
          </button>
        </div>
      )}
    </div>
  );
}
