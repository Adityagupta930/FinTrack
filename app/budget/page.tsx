'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { api, Budget, fmt, getYM, CATEGORY_ICONS, CATEGORIES } from '@/lib/api';
import Modal from '@/components/Modal';
import { Label, AmountInput, FormActions } from '@/components/ui';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

export default function BudgetPage() {
  const { budgets, setBudgets, expenses } = useStore();
  const [open, setOpen]       = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);
  const ym = getYM();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await api.budgets.upsert({ category, amount: parseFloat(amount) });
      setBudgets([...budgets.filter(b => b.category !== category), saved]);
      setOpen(false); setCategory(''); setAmount('');
    } finally { setLoading(false); }
  }

  async function del(cat: string) {
    if (!confirm(`Remove budget for ${cat}?`)) return;
    await api.budgets.delete(cat);
    setBudgets(budgets.filter(b => b.category !== cat));
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent  = budgets.reduce((s, b) => {
    return s + expenses.filter(e => e.category === b.category && e.date.startsWith(ym)).reduce((x, e) => x + e.amount, 0);
  }, 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Budget</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Set monthly spending limits per category.</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-violet-200">
          <Plus size={15} strokeWidth={2.5} /> Set Budget
        </button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Budget', value: fmt(totalBudget), color: 'text-gray-900' },
            { label: 'Total Spent',  value: fmt(totalSpent),  color: 'text-red-500' },
            { label: 'Remaining',    value: fmt(Math.max(totalBudget - totalSpent, 0)), color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{s.label}</p>
              <p className={`text-[20px] font-black tracking-tight ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Budget List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <TrendingUp size={14} className="text-violet-600" />
          <p className="text-[13px] font-bold text-gray-900">Monthly Budgets</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full ml-auto">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-300">
              <span className="text-4xl mb-2">🎯</span>
              <p className="text-[13px]">No budgets set yet.</p>
              <button onClick={() => setOpen(true)} className="mt-3 text-[12px] text-violet-600 font-semibold hover:text-violet-700">
                Set your first budget →
              </button>
            </div>
          ) : (
            budgets.map(b => {
              const spent = expenses
                .filter(e => e.category === b.category && e.date.startsWith(ym))
                .reduce((s, e) => s + e.amount, 0);
              const pct   = Math.min((spent / b.amount) * 100, 100);
              const over  = spent > b.amount;
              const warn  = pct >= 80 && !over;
              const barColor = over ? '#ef4444' : warn ? '#f59e0b' : '#10b981';
              const pctColor = over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-emerald-600';

              return (
                <div key={b.category} className="px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{CATEGORY_ICONS[b.category] || '📦'}</span>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{b.category}</p>
                        <p className="text-[11px] text-gray-400">{fmt(spent)} spent of {fmt(b.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[12px] font-bold ${pctColor}`}>{pct.toFixed(0)}%</span>
                      {over && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-500 rounded-full">Over budget</span>}
                      <button onClick={() => del(b.category)}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Set Budget" subtitle="Monthly spending limit per category">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Category</Label>
            <select required value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] outline-none text-gray-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition cursor-pointer">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>
          </div>
          <div>
            <Label>Monthly Limit (₹)</Label>
            <AmountInput value={amount} onChange={setAmount} />
          </div>
          <FormActions onCancel={() => setOpen(false)} loading={loading} label="Save Budget" />
        </form>
      </Modal>
    </div>
  );
}
