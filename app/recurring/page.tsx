'use client';
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { api, Recurring, CATEGORY_ICONS, fmt } from '@/lib/api';
import Modal from '@/components/Modal';
import CategoryPicker from '@/components/CategoryPicker';
import { Label, Input, AmountInput, Textarea, FormActions } from '@/components/ui';
import { Plus, Pencil, Trash2, RefreshCw, Sun, Calendar, Banknote, Smartphone } from 'lucide-react';

export default function RecurringPage() {
  const { recurring, setRecurring, expenses, setExpenses, adjustWallet } = useStore();
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState<Recurring | null>(null);
  const [title, setTitle]         = useState('');
  const [amount, setAmount]       = useState('');
  const [day, setDay]             = useState('1');
  const [category, setCategory]   = useState('');
  const [note, setNote]           = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'monthly'>('monthly');
  const [payMode, setPayMode]     = useState<'cash' | 'online'>('cash');
  const [loading, setLoading]     = useState(false);

  // Auto-process recurring on page load
  const processRecurring = useCallback(async (currentRecurring: typeof recurring) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const ym = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

    const newExpenses: typeof expenses = [];
    let updatedRecurring = [...currentRecurring];

    for (const r of currentRecurring) {
      const freq = r.frequency || 'monthly';

      if (freq === 'daily') {
        if (r.last_added === todayStr) continue;
        try {
          const created = await api.expenses.create({
            title: r.title, amount: r.amount, category: r.category,
            date: todayStr, note: r.note || '🔄 Daily recurring',
            tags: [], payment_mode: r.payment_mode || 'cash',
          });
          newExpenses.push(created);
          await adjustWallet(r.payment_mode || 'cash', -r.amount);
          await api.recurring.update(r.id, { last_added: todayStr });
          updatedRecurring = updatedRecurring.map(x => x.id === r.id ? { ...x, last_added: todayStr } : x);
        } catch { /* skip */ }

      } else {
        if (r.last_added?.startsWith(ym)) continue;
        const maxDay = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
        const d = Math.min(r.day, maxDay);
        const dateStr = `${ym}-${String(d).padStart(2,'0')}`;
        try {
          const created = await api.expenses.create({
            title: r.title, amount: r.amount, category: r.category,
            date: dateStr, note: r.note || '🔄 Monthly recurring',
            tags: [], payment_mode: r.payment_mode || 'cash',
          });
          newExpenses.push(created);
          await adjustWallet(r.payment_mode || 'cash', -r.amount);
          await api.recurring.update(r.id, { last_added: ym });
          updatedRecurring = updatedRecurring.map(x => x.id === r.id ? { ...x, last_added: ym } : x);
        } catch { /* skip */ }
      }
    }

    if (newExpenses.length > 0) setExpenses((prev: typeof newExpenses) => [...newExpenses, ...prev]);
    setRecurring(updatedRecurring);
  }, [setExpenses, setRecurring, adjustWallet]);

  useEffect(() => {
    if (recurring.length > 0) processRecurring(recurring);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurring.length]);

  function openAdd() {
    setEditing(null); setTitle(''); setAmount(''); setDay('1');
    setCategory(''); setNote(''); setFrequency('monthly'); setPayMode('cash'); setOpen(true);
  }
  function openEdit(r: Recurring) {
    setEditing(r); setTitle(r.title); setAmount(r.amount.toString());
    setDay(r.day.toString()); setCategory(r.category); setNote(r.note || '');
    setFrequency(r.frequency || 'monthly'); setPayMode(r.payment_mode || 'cash'); setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setLoading(true);
    try {
      const data = {
        title, amount: parseFloat(amount),
        day: frequency === 'daily' ? 0 : parseInt(day),
        category, note, frequency, payment_mode: payMode,
      };
      if (editing) {
        const updated = await api.recurring.update(editing.id, data);
        setRecurring(recurring.map(r => r.id === editing.id ? updated : r));
      } else {
        const created = await api.recurring.create({ ...data, last_added: '' });
        setRecurring([created, ...recurring]);
      }
      setOpen(false);
    } finally { setLoading(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this recurring expense?')) return;
    await api.recurring.delete(id);
    setRecurring(recurring.filter(r => r.id !== id));
  }

  const daily   = recurring.filter(r => (r.frequency || 'monthly') === 'daily');
  const monthly = recurring.filter(r => (r.frequency || 'monthly') === 'monthly');
  const dailyTotal   = daily.reduce((s, r) => s + r.amount, 0);
  const monthlyTotal = monthly.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Recurring</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Daily & monthly auto expenses.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-violet-200">
          <Plus size={15} strokeWidth={2.5} /> Add Recurring
        </button>
      </div>

      {/* Summary Cards */}
      {recurring.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-5 text-white shadow-lg shadow-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={16} />
              <span className="font-bold text-sm">Daily</span>
            </div>
            <p className="text-2xl font-black">{fmt(dailyTotal)}</p>
            <p className="text-xs text-white/80 mt-1">{daily.length} active · {fmt(dailyTotal * 30)}/mo est.</p>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} />
              <span className="font-bold text-sm">Monthly</span>
            </div>
            <p className="text-2xl font-black">{fmt(monthlyTotal)}</p>
            <p className="text-xs text-white/80 mt-1">{monthly.length} active</p>
          </div>
        </div>
      )}

      {/* Daily List */}
      {daily.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Sun size={14} className="text-amber-500" />
            <p className="text-[13px] font-bold text-gray-900">Daily Recurring</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full ml-auto">Auto-adds every day</span>
          </div>
          <RecurringList items={daily} onEdit={openEdit} onDelete={del} />
        </div>
      )}

      {/* Monthly List */}
      {monthly.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Calendar size={14} className="text-violet-600" />
            <p className="text-[13px] font-bold text-gray-900">Monthly Recurring</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full ml-auto">Auto-adds every month</span>
          </div>
          <RecurringList items={monthly} onEdit={openEdit} onDelete={del} />
        </div>
      )}

      {recurring.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-14 text-gray-300">
          <RefreshCw size={32} className="mb-2" />
          <p className="text-[13px]">No recurring expenses yet.</p>
        </div>
      )}

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? 'Edit Recurring' : 'Add Recurring'}
        subtitle="Auto-adds on schedule">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Netflix, Gym, Tea…"
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all" />
          </div>

          {/* Frequency */}
          <div>
            <Label>Frequency</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFrequency('daily')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                  frequency === 'daily' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300'
                }`}>
                <Sun size={14} /> Daily
              </button>
              <button type="button" onClick={() => setFrequency('monthly')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                  frequency === 'monthly' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300'
                }`}>
                <Calendar size={14} /> Monthly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount (₹)</Label>
              <AmountInput value={amount} onChange={setAmount} />
            </div>
            {frequency === 'monthly' && (
              <div>
                <Label>Day of Month</Label>
                <Input required type="number" min="1" max="28" value={day} onChange={e => setDay(e.target.value)} placeholder="e.g. 1" />
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <Label>Payment Mode</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPayMode('cash')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                  payMode === 'cash' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300'
                }`}>
                <Banknote size={14} /> Cash
              </button>
              <button type="button" onClick={() => setPayMode('online')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                  payMode === 'online' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300'
                }`}>
                <Smartphone size={14} /> Online
              </button>
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <CategoryPicker value={category} onChange={setCategory} />
          </div>
          <div>
            <Label>Note <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" />
          </div>
          <FormActions onCancel={() => setOpen(false)} loading={loading} label={editing ? 'Update' : 'Add Recurring'} />
        </form>
      </Modal>
    </div>
  );
}

function RecurringList({ items, onEdit, onDelete }: {
  items: Recurring[];
  onEdit: (r: Recurring) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-gray-50">
      {items.map(r => (
        <div key={r.id} className="group flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
              {CATEGORY_ICONS[r.category] || '📦'}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{r.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] text-gray-400">{r.category}</span>
                {(r.frequency || 'monthly') === 'monthly' && (
                  <span className="text-[11px] text-gray-400">· Day {r.day}</span>
                )}
                {r.payment_mode && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    r.payment_mode === 'cash' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'
                  }`}>
                    {r.payment_mode === 'cash' ? '💵 Cash' : '📱 Online'}
                  </span>
                )}
                {r.last_added && (
                  <span className="text-[10px] text-gray-300">· Last: {r.last_added}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
            <div className="text-right">
              <p className="text-[13px] font-bold text-gray-900 tabular-nums">{fmt(r.amount)}</p>
              <p className="text-[10px] text-gray-400">/{(r.frequency || 'monthly') === 'daily' ? 'day' : 'month'}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(r)}
                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-violet-100 hover:text-violet-600 flex items-center justify-center text-gray-400 transition-colors">
                <Pencil size={11} strokeWidth={2.5} />
              </button>
              <button onClick={() => onDelete(r.id)}
                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors">
                <Trash2 size={11} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
