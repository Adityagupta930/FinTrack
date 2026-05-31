import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FinTrack — Smart Expense Tracker',
  description: 'Track your expenses, income and budgets',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'FinTrack' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
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
        <AuthProvider>
          <StoreProvider>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
