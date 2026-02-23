'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex flex-row h-screen w-full max-w-full bg-gray-50 overflow-hidden" style={{ minHeight: '100dvh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={openSidebar} />
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 sm:py-4 bg-gray-50 relative">
          {children}
        </main>
      </div>
      {/* Mobil sidebar overlay - menü açıkken arka plan karartma */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[55] md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
