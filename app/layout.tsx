import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { StoreProvider } from '@/lib/store';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FinTrack — Smart Expense Tracker',
  description: 'Track your expenses, income and budgets',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[#f5f6fa] text-gray-900 antialiased`}>
        <StoreProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="ml-60 flex-1 min-h-screen p-7 page-enter">
              {children}
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
