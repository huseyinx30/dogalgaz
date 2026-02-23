import { Sidebar } from './sidebar';
import { Header } from './header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row h-screen w-full bg-gray-50 overflow-hidden" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
