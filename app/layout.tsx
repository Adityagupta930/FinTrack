import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { StoreProvider } from '@/lib/store';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FinTrack — Smart Expense Tracker',
  description: 'Track your expenses, income and budgets',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FinTrack',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#6c63ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[#f5f6fa] text-gray-900 antialiased`}>
        <StoreProvider>
          {/* Desktop layout */}
          <div className="hidden md:flex min-h-screen">
            <Sidebar />
            <main className="ml-60 flex-1 min-h-screen p-7">
              {children}
            </main>
          </div>
          {/* Mobile layout */}
          <div className="md:hidden min-h-screen pb-20">
            <main className="p-4">
              {children}
            </main>
            <MobileNav />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}

function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 flex items-center justify-around px-2 py-2">
      <MobileNavItem href="/" icon="🏠" label="Home" />
      <MobileNavItem href="/expenses" icon="💸" label="Expenses" />
      <MobileNavItem href="/wallet" icon="👛" label="Wallet" />
      <MobileNavItem href="/analytics" icon="📊" label="Analytics" />
      <MobileNavItem href="/budget" icon="🎯" label="Budget" />
    </nav>
  );
}

function MobileNavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-medium text-gray-500">{label}</span>
    </a>
  );
}
