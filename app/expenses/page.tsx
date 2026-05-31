'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { api, Expense } from '@/lib/api';
import ExpenseRow from '@/components/ExpenseRow';
import ExpenseModal from '@/components/ExpenseModal';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';

export default function ExpensesPage() {
  const { expenses, setExpenses, adjustWallet } = useStore();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Expense | null>(null);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const months = [...new Set(expenses.map(e => e.date.slice(0, 7)))].sort().reverse();
  const cats   = [...new Set(expenses.map(e => e.category))].sort();

  const filtered = expenses.filter(e =>
    (!search      || e.title.toLowerCase().includes(search.toLowerCase()) || (e.note || '').toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter   || e.category === catFilter) &&
    (!monthFilter || e.date.startsWith(monthFilter))
  );

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  async function del(expense: Expense) {
    if (!confirm('Delete this expense?')) return;
    await api.expenses.delete(expense.id);
    setExpenses(expenses.filter(e => e.id !== expense.id));
    // refund wallet
    if (expense.payment_mode) {
      await adjustWallet(expense.payment_mode, expense.amount);
    }
  }

  function openEdit(e: Expense) { setEditing(e); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Expenses</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Manage and track all your expenses.</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-violet-200">
          <Plus size={15} strokeWidth={2.5} /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-xl px-3 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…"
              className="flex-1 py-2.5 bg-transparent text-[13px] outline-none text-gray-900 placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-gray-400" />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] outline-none text-gray-700 focus:border-violet-500 transition cursor-pointer">
              <option value="">All Categories</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] outline-none text-gray-700 focus:border-violet-500 transition cursor-pointer">
              <option value="">All Months</option>
              {months.map(m => {
                const [y, mo] = m.split('-');
                return <option key={m} value={m}>{new Date(+y, +mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</option>;
              })}
            </select>
          </div>
          {(search || catFilter || monthFilter) && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12px] text-gray-500">{filtered.length} results · <span className="font-semibold text-gray-900">₹{totalFiltered.toLocaleString('en-IN')}</span></span>
              <button onClick={() => { setSearch(''); setCatFilter(''); setMonthFilter(''); }}
                className="text-[12px] text-violet-600 hover:text-violet-700 font-medium">Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-[13px] font-bold text-gray-900">{filtered.length} {filtered.length === 1 ? 'expense' : 'expenses'}</p>
          {filtered.length > 0 && (
            <p className="text-[12px] text-gray-400">Total: <span className="font-bold text-gray-900">₹{totalFiltered.toLocaleString('en-IN')}</span></p>
          )}
        </div>
        <div className="px-5 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-300">
              <span className="text-4xl mb-2">🔍</span>
              <p className="text-[13px]">No expenses found.</p>
            </div>
          ) : (
            filtered.map(e => (
              <ExpenseRow key={e.id} item={e}
                onEdit={() => openEdit(e)}
                onDelete={() => del(e)} />
            ))
          )}
        </div>
      </div>

      <ExpenseModal open={modalOpen} onClose={closeModal} editing={editing} />
    </div>
  );
}
