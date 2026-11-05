import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import BottomNavBar from './components/BottomNavBar';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

function AppShell() {
  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col items-center justify-start text-[#1F2421] font-sans antialiased selection:bg-[#E05315] selection:text-white">
      {/* Mobile-first Android Container (420px maximum width for native mobile proportions) */}
      <div className="w-full max-w-[420px] bg-[#FAF9F6] min-h-screen shadow-md flex flex-col border-x border-stone-200/60 pb-20 relative">
        {/* Android Status Bar */}
        <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-stone-600 select-none border-b border-stone-200/40">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-stone-700">
            <span className="text-[10px] font-mono">LTE</span>
            <div className="w-3.5 h-2.5 border border-stone-600 rounded-xs flex items-center p-0.5">
              <div className="w-full h-full bg-stone-700 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Top Header: Simple with Login/Logout toggle icon on top right */}
        <Header />

        {/* Dynamic Route View */}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Fixed Mobile Bottom Navigation Bar: Menu, My Orders, Cart, Profile */}
        <BottomNavBar />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
