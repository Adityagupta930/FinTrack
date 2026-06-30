'use client';
import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { fmt, CATEGORY_ICONS, COLORS } from '@/lib/api';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, PiggyBank, Calendar, Flame, ShoppingBag } from 'lucide-react';

export default function ReportsPage() {
  const { expenses, income } = useStore();

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => set.add(e.date.slice(0, 7)));
    income.forEach(i => set.add(i.date.slice(0, 7)));
    const today = new Date();
    set.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(set).sort().reverse();
  }, [expenses, income]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const idx = availableMonths.indexOf(selectedMonth);
  function prev() { if (idx < availableMonths.length - 1) setSelectedMonth(availableMonths[idx + 1]); }
  function next() { if (idx > 0) setSelectedMonth(availableMonths[idx - 1]); }

  const monthLabel = new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthExpenses = useMemo(() => expenses.filter(e => e.date.startsWith(selectedMonth)), [expenses, selectedMonth]);
  const monthIncome   = useMemo(() => income.filter(i => i.date.startsWith(selectedMonth)),   [income,   selectedMonth]);

  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome  = monthIncome.reduce((s, i) => s + i.amount, 0);
  const savings      = totalIncome - totalExpense;

  const catMap = useMemo(() => {
    const m: Record<string, number> = {};
    monthExpenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return m;
  }, [monthExpenses]);
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const dayMap = useMemo(() => {
    const m: Record<string, number> = {};
    monthExpenses.forEach(e => { m[e.date] = (m[e.date] || 0) + e.amount; });
    return m;
  }, [monthExpenses]);
  const sortedDays = Object.entries(dayMap).sort((a, b) => a[0].localeCompare(b[0])).reverse();
  const maxDayAmt  = Math.max(...Object.values(dayMap), 1);
  const topDay     = sortedDays[0];

  const cashTotal   = monthExpenses.filter(e => e.payment_mode === 'cash').reduce((s, e) => s + e.amount, 0);
  const onlineTotal = monthExpenses.filter(e => e.payment_mode === 'online').reduce((s, e) => s + e.amount, 0);

  const savingsBg = savings >= 0 ? 'from-emerald-400 to-emerald-500' : 'from-red-400 to-red-500';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Monthly Report</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Month-wise spending breakdown.</p>
      </div>

      {/* Month Navigator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
        <button onClick={prev} disabled={idx >= availableMonths.length - 1}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-[16px] font-black text-gray-900">{monthLabel}</p>
          <p className="text-[11px] text-gray-400">{monthExpenses.length} expenses</p>
        </div>
        <button onClick={next} disabled={idx <= 0}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-red-100">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={14} />
            <span className="text-[11px] font-bold opacity-90">Spent</span>
          </div>
          <p className="text-[18px] font-black leading-tight">{fmt(totalExpense)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl p-4 text-white shadow-lg shadow-emerald-100">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} />
            <span className="text-[11px] font-bold opacity-90">Earned</span>
          </div>
          <p className="text-[18px] font-black leading-tight">{fmt(totalIncome)}</p>
        </div>
        <div className={`bg-gradient-to-br ${savingsBg} rounded-2xl p-4 text-white shadow-lg`}>
          <div className="flex items-center gap-1.5 mb-2">
            <PiggyBank size={14} />
            <span className="text-[11px] font-bold opacity-90">Saved</span>
          </div>
          <p className="text-[18px] font-black leading-tight">{fmt(Math.abs(savings))}</p>
          {savings < 0 && <p className="text-[9px] font-bold opacity-80 mt-0.5">OVERSPENT</p>}
        </div>
      </div>

      {/* Savings Rate */}
      {totalIncome > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-gray-900">Savings Rate</p>
            <span className={`text-[13px] font-black ${savings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {Math.round((savings / totalIncome) * 100)}%
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${savings >= 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
              style={{ width: `${Math.min(Math.abs(savings / totalIncome) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            {savings >= 0
              ? `You saved ${fmt(savings)} this month 🎉`
              : `You overspent by ${fmt(Math.abs(savings))} this month`}
          </p>
        </div>
      )}

      {/* Top Spending Day */}
      {topDay && (
        <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-5 text-white shadow-lg shadow-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={15} />
            <p className="text-[12px] font-bold opacity-90">Highest Spending Day</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-black">
              {new Date(topDay[0] + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-[20px] font-black">{fmt(topDay[1])}</p>
          </div>
        </div>
      )}

      {/* Payment Mode Split */}
      {(cashTotal > 0 || onlineTotal > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[13px] font-bold text-gray-900 mb-4">Payment Mode Split</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">💵 Cash</p>
              <p className="text-[18px] font-black text-gray-900">{fmt(cashTotal)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {totalExpense > 0 ? Math.round((cashTotal / totalExpense) * 100) : 0}% of total
              </p>
            </div>
            <div className="bg-violet-50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-1">📱 Online</p>
              <p className="text-[18px] font-black text-gray-900">{fmt(onlineTotal)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {totalExpense > 0 ? Math.round((onlineTotal / totalExpense) * 100) : 0}% of total
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {sortedCats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <ShoppingBag size={14} className="text-violet-600" />
            <p className="text-[13px] font-bold text-gray-900">Category Breakdown</p>
          </div>
          <div className="p-5 space-y-4">
            {sortedCats.map(([cat, amt], i) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{CATEGORY_ICONS[cat] || '📦'}</span>
                    <span className="text-[13px] font-semibold text-gray-800">{cat}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[13px] font-black text-gray-900">{fmt(amt)}</span>
                    <span className="text-[11px] text-gray-400 ml-1.5">
                      {totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${totalExpense > 0 ? (amt / totalExpense) * 100 : 0}%`, background: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day-wise Spending */}
      {sortedDays.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Calendar size={14} className="text-violet-600" />
            <p className="text-[13px] font-bold text-gray-900">Day-wise Spending</p>
          </div>
          <div className="divide-y divide-gray-50">
            {sortedDays.map(([date, amt]) => (
              <div key={date} className="px-5 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[14px] font-black text-gray-800 leading-none">
                    {new Date(date + 'T00:00:00').getDate()}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold uppercase">
                    {new Date(date + 'T00:00:00').toLocaleString('default', { weekday: 'short' })}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
                      style={{ width: `${(amt / maxDayAmt) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {expenses.filter(e => e.date === date).length} transactions
                  </p>
                </div>
                <span className="text-[13px] font-black text-gray-900 tabular-nums flex-shrink-0">{fmt(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {monthExpenses.length === 0 && monthIncome.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-gray-300">
          <Calendar size={36} className="mb-3" />
          <p className="text-[14px] font-semibold text-gray-400">No data for {monthLabel}</p>
          <p className="text-[12px] text-gray-300 mt-1">Add expenses or income to see your report.</p>
        </div>
      )}
    </div>
  );
}
