'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { fmt, getYM, CATEGORY_ICONS, COLORS } from '@/lib/api';
import {
  IndianRupee, CalendarDays, Receipt, Flame,
  CalendarRange, Scale, Plus, ArrowUpRight,
  Banknote, Smartphone, Users
} from 'lucide-react';
import ExpenseRow from '@/components/ExpenseRow';
import ExpenseModal from '@/components/ExpenseModal';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);
const Bar = dynamic(() => import('react-chartjs-2').then(m => m.Bar), { ssr: false });
const Pie = dynamic(() => import('react-chartjs-2').then(m => m.Pie), { ssr: false });

function Card({ label, value, sub, icon: Icon, iconBg, valueColor }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; iconBg: string; valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 md:p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-[16px] md:text-[20px] font-black tracking-tight truncate ${valueColor ?? 'text-gray-900'}`}>{value}</p>
        <p className="text-[10px] md:text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>
      </div>
      <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 ${iconBg}`}>
        <Icon size={16} strokeWidth={2} />
      </div>
    </div>
  );
}

function Box({ title, badge, action, children }: {
  title: string; badge?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <p className="text-[13px] font-bold text-gray-900">{title}</p>
          {badge && <span className="text-[10px] font-semibold px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full">{badge}</span>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 h-64 bg-gray-100 rounded-2xl" />
        <div className="col-span-2 h-64 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-48 bg-gray-100 rounded-2xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { expenses, income, wallets, loans, loading, error } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const ym = getYM();

  const totalSpent  = expenses.reduce((s, e) => s + e.amount, 0);
  const monthSpent  = expenses.filter(e => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
  const monthIncome = income.filter(i => i.date.startsWith(ym)).reduce((s, i) => s + i.amount, 0);
  const netBalance  = monthIncome - monthSpent;

  const weekAgo   = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStr   = weekAgo.toISOString().split('T')[0];
  const weekSpent = expenses.filter(e => e.date >= weekStr).reduce((s, e) => s + e.amount, 0);

  const catTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount; return acc;
  }, {} as Record<string, number>);
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const cashWallet   = wallets.find(w => w.type === 'cash');
  const onlineWallet = wallets.find(w => w.type === 'online');
  const totalWallet  = (cashWallet?.balance ?? 0) + (onlineWallet?.balance ?? 0);

  const pendingLoans   = loans.filter(l => l.status === 'pending');
  const loanGiven      = pendingLoans.filter(l => l.type === 'given').reduce((s, l) => s + l.amount, 0);
  const loanTaken      = pendingLoans.filter(l => l.type === 'taken').reduce((s, l) => s + l.amount, 0);

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const barLabels = months.map(m => new Date(m + '-01').toLocaleString('default', { month: 'short' }));
  const barData   = months.map(m => expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0));
  const pieLabels = Object.keys(catTotals);
  const pieData   = pieLabels.map(c => catTotals[c]);

  if (loading) return <Skeleton />;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-red-500 font-semibold text-sm">Connection Error</p>
      <p className="text-gray-500 text-xs max-w-md text-center bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header - desktop only */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-violet-200">
          <Plus size={15} strokeWidth={2.5} /> Add Expense
        </button>
      </div>
      {/* Mobile Add Button */}
      <div className="md:hidden flex justify-end">
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 active:scale-95 text-white rounded-xl text-[13px] font-semibold shadow-lg shadow-violet-200">
          <Plus size={15} strokeWidth={2.5} /> Add Expense
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card label="Total Spent"  value={fmt(totalSpent)}  sub="All time"
          icon={IndianRupee} iconBg="bg-violet-50 text-violet-600" />
        <Card label="This Month"   value={fmt(monthSpent)}  sub={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          icon={CalendarDays} iconBg="bg-emerald-50 text-emerald-600" />
        <Card label="Transactions" value={String(expenses.length)} sub="Total entries"
          icon={Receipt} iconBg="bg-amber-50 text-amber-600" />
        <Card label="Top Category" value={topCat ? `${CATEGORY_ICONS[topCat[0]] || '📦'} ${topCat[0]}` : '—'} sub="Highest spend"
          icon={Flame} iconBg="bg-pink-50 text-pink-500" />
        <Card label="This Week"    value={fmt(weekSpent)}   sub="Last 7 days"
          icon={CalendarRange} iconBg="bg-cyan-50 text-cyan-600" />
        <Card label="Net Balance"
          value={(netBalance >= 0 ? '+' : '') + fmt(netBalance)}
          sub={`${fmt(monthIncome)} income this month`}
          icon={Scale}
          iconBg={netBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}
          valueColor={netBalance >= 0 ? 'text-emerald-600' : 'text-red-500'} />
      </div>

      {/* Wallet + Loans Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={14} />
            <span className="text-[11px] font-bold uppercase tracking-wide">Cash</span>
          </div>
          <p className="text-[18px] font-black">{fmt(cashWallet?.balance ?? 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-4 text-white shadow-lg shadow-violet-100">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={14} />
            <span className="text-[11px] font-bold uppercase tracking-wide">Online</span>
          </div>
          <p className="text-[18px] font-black">{fmt(onlineWallet?.balance ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-red-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">I Gave</span>
          </div>
          <p className="text-[18px] font-black text-red-500">{fmt(loanGiven)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">pending recovery</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-emerald-600" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">I Owe</span>
          </div>
          <p className="text-[18px] font-black text-emerald-600">{fmt(loanTaken)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">to be returned</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3">
          <Box title="Monthly Spending" badge="Last 6 months">
            <Bar
              data={{ labels: barLabels, datasets: [{ data: barData, backgroundColor: 'rgba(109,99,255,0.85)', hoverBackgroundColor: '#6c63ff', borderRadius: 7, borderSkipped: false }] }}
              options={{
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) } } },
                scales: {
                  x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
                  y: { grid: { color: '#f3f4f6' }, border: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af', callback: v => '₹' + Number(v).toLocaleString('en-IN') } },
                },
              }}
            />
          </Box>
        </div>
        <div className="md:col-span-2">
          <Box title="By Category">
            {pieLabels.length > 0
              ? <Pie
                  data={{ labels: pieLabels, datasets: [{ data: pieData, backgroundColor: COLORS, borderWidth: 3, borderColor: '#fff' }] }}
                  options={{ plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: '#6b7280', padding: 12 } }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(+(ctx.raw as number))}` } } } }}
                />
              : <div className="flex flex-col items-center justify-center h-40 text-gray-300"><span className="text-4xl mb-2">📊</span><p className="text-[12px]">No data yet</p></div>
            }
          </Box>
        </div>
      </div>

      {/* Recent Transactions */}
      <Box title="Recent Transactions"
        action={
          <Link href="/expenses" className="flex items-center gap-1 text-[12px] text-violet-600 hover:text-violet-700 font-semibold transition">
            View all <ArrowUpRight size={13} />
          </Link>
        }>
        {expenses.length === 0
          ? <div className="flex flex-col items-center justify-center py-10 text-gray-300"><span className="text-4xl mb-2">💸</span><p className="text-[13px]">No expenses yet.</p></div>
          : expenses.slice(0, 6).map(e => <ExpenseRow key={e.id} item={e} />)
        }
      </Box>

      <ExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
