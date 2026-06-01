'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wallet, BarChart2, Target,
  TrendingUp, RefreshCw, Zap, WalletCards, LogOut, Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const links = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses',  label: 'Expenses',  icon: Wallet },
  { href: '/income',    label: 'Income',    icon: TrendingUp },
  { href: '/wallet',    label: 'Wallet',    icon: WalletCards },
  { href: '/loans',     label: 'Loans',     icon: Users },
  { href: '/recurring', label: 'Recurring', icon: RefreshCw },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/budget',    label: 'Budget',    icon: Target },
];

export default function Sidebar() {
  const path = usePathname();
  const { user } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'FT';
  const email    = user?.email ?? 'Personal Account';

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-lg shadow-violet-200">
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-black tracking-tight bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">
            FinTrack
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</p>
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                active ? 'bg-violet-50 text-violet-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                active
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'
              }`}>
                <Icon size={14} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span>{label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-gray-800 truncate">FinTrack</p>
            <p className="text-[11px] text-gray-400 truncate">{email}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
