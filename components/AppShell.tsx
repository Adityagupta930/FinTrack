'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/login') router.replace('/login');
    if (user  && pathname === '/login') router.replace('/');
  }, [user, loading, pathname, router]);

  // Show nothing while checking auth
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Login page — no shell
  if (!user) return <>{children}</>;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar />
        <main className="ml-60 flex-1 min-h-screen p-7">{children}</main>
      </div>
      {/* Mobile */}
      <div className="md:hidden min-h-screen pb-20">
        <main className="p-4">{children}</main>
        <MobileNav />
      </div>
    </>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const links = [
    { href: '/',          icon: '🏠', label: 'Home' },
    { href: '/expenses',  icon: '💸', label: 'Expenses' },
    { href: '/wallet',    icon: '👛', label: 'Wallet' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
    { href: '/budget',    icon: '🎯', label: 'Budget' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 flex items-center justify-around px-2 py-2">
      {links.map(l => (
        <a key={l.href} href={l.href}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
            pathname === l.href ? 'bg-violet-50' : 'hover:bg-gray-50'
          }`}>
          <span className="text-xl">{l.icon}</span>
          <span className={`text-[10px] font-medium ${pathname === l.href ? 'text-violet-600' : 'text-gray-500'}`}>{l.label}</span>
        </a>
      ))}
    </nav>
  );
}
