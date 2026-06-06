'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Sidebar from './Sidebar';
import { Home, Receipt, Wallet, Target, TrendingUp, BarChart2, RefreshCw, HandCoins, Plus, X } from 'lucide-react';

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
      <div className="md:hidden min-h-screen bg-[#f5f6fa] flex flex-col">
        <MobileHeader pathname={pathname} />
        <main className="flex-1 px-3 pt-3 pb-24">{children}</main>
        <MobileNav pathname={pathname} />
      </div>
    </>
  );
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard', '/expenses': 'Expenses', '/income': 'Income',
  '/wallet': 'Wallet', '/budget': 'Budget', '/analytics': 'Analytics',
  '/recurring': 'Recurring', '/loans': 'Loans',
};

function MobileHeader({ pathname }: { pathname: string }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm px-4 h-12 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center">
          <span className="text-white text-[10px] font-black">F</span>
        </div>
        <span className="text-[15px] font-black text-gray-900">{PAGE_TITLES[pathname] ?? 'FinTrack'}</span>
      </div>
    </header>
  );
}

const PRIMARY_NAV = [
  { href: '/',          icon: Home,       label: 'Home' },
  { href: '/expenses',  icon: Receipt,    label: 'Expenses' },
  { href: '/wallet',    icon: Wallet,     label: 'Wallet' },
  { href: '/income',    icon: TrendingUp, label: 'Income' },
  { href: '/budget',    icon: Target,     label: 'Budget' },
];

const MORE_NAV = [
  { href: '/analytics', icon: BarChart2,  label: 'Analytics' },
  { href: '/recurring', icon: RefreshCw,  label: 'Recurring' },
  { href: '/loans',     icon: HandCoins,  label: 'Loans' },
];

function MobileNav({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = MORE_NAV.some(m => m.href === pathname);

  return (
    <>
      {/* More drawer backdrop */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMoreOpen(false)} />
      )}

      {/* More drawer */}
      {moreOpen && (
        <div className="fixed bottom-16 left-3 right-3 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-[13px] font-bold text-gray-900">More</p>
            <button onClick={() => setMoreOpen(false)} className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
              <X size={13} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-gray-50">
            {MORE_NAV.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center gap-1.5 py-4 transition-colors ${pathname === href ? 'bg-violet-50 text-violet-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={20} strokeWidth={1.8} />
                <span className="text-[11px] font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-50 flex items-center justify-around px-1 safe-area-bottom">
        {PRIMARY_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all ${active ? 'text-violet-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-violet-100' : ''}`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={`text-[9px] font-semibold ${active ? 'text-violet-600' : 'text-gray-400'}`}>{label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all ${isMoreActive ? 'text-violet-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isMoreActive || moreOpen ? 'bg-violet-100' : ''}`}>
            <Plus size={18} strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.8}
              className={`transition-transform ${moreOpen ? 'rotate-45' : ''}`} />
          </div>
          <span className={`text-[9px] font-semibold ${isMoreActive || moreOpen ? 'text-violet-600' : 'text-gray-400'}`}>More</span>
        </button>
      </nav>
    </>
  );
}
