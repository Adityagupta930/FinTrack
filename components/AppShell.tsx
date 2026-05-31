'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

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
    { href: '/income',    icon: '💰', label: 'Income' },
    { href: '/wallet',    icon: '👛', label: 'Wallet' },
    { href: '/budget',    icon: '🎯', label: 'Budget' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 flex items-center justify-around px-1 py-2">
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${
            pathname === l.href ? 'bg-violet-50' : 'hover:bg-gray-50'
          }`}>
          <span className="text-lg">{l.icon}</span>
          <span className={`text-[9px] font-medium ${pathname === l.href ? 'text-violet-600' : 'text-gray-500'}`}>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
