'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { api, Recurring, CATEGORY_ICONS, fmt } from '@/lib/api';
import Modal from '@/components/Modal';
import CategoryPicker from '@/components/CategoryPicker';
import { Label, Input, AmountInput, Textarea, FormActions } from '@/components/ui';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';

export default function RecurringPage() {
  const { recurring, setRecurring } = useStore();
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Recurring | null>(null);
  const [title, setTitle]       = useState('');
  const [amount, setAmount]     = useState('');
  const [day, setDay]           = useState('1');
  const [category, setCategory] = useState('');
  const [note, setNote]         = useState('');
  const [loading, setLoading]   = useState(false);

  function openAdd() {
    setEditing(null); setTitle(''); setAmount(''); setDay('1'); setCategory(''); setNote(''); setOpen(true);
  }
  function openEdit(r: Recurring) {
    setEditing(r); setTitle(r.title); setAmount(r.amount.toString()); setDay(r.day.toString()); setCategory(r.category); setNote(r.note || ''); setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setLoading(true);
    try {
      const data = { title, amount: parseFloat(amount), day: parseInt(day), category, note };
      if (editing) {
        const updated = await api.recurring.update(editing.id, data);
        setRecurring(recurring.map(r => r.id === editing.id ? updated : r));
      } else {
        const created = await api.recurring.create({ ...data, last_added: '' });
        setRecurring([created, ...recurring]);
      }
      setOpen(false); setTitle(''); setAmount(''); setDay('1'); setCategory(''); setNote('');
    } finally { setLoading(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this recurring expense?')) return;
    await api.recurring.delete(id);
    setRecurring(recurring.filter(r => r.id !== id));
  }

  const monthlyTotal = recurring.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Recurring</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Auto-recurring monthly expenses.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-violet-200">
          <Plus size={15} strokeWidth={2.5} /> Add Recurring
        </button>
      </div>

      {/* Summary */}
      {recurring.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Monthly Recurring Total</p>
            <p className="text-[20px] font-black text-gray-900 tracking-tight">{fmt(monthlyTotal)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Active</p>
            <p className="text-[20px] font-black text-gray-900">{recurring.length}</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-[13px] font-bold text-gray-900">All Recurring Expenses</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Auto-added every month on the set date.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {recurring.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-300">
              <span className="text-4xl mb-2">🔄</span>
              <p className="text-[13px]">No recurring expenses yet.</p>
            </div>
          ) : (
            recurring.map(r => (
              <div key={r.id} className="group flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                    {CATEGORY_ICONS[r.category] || '📦'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{r.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {r.category} · Every month on day <span className="font-semibold text-gray-600">{r.day}</span>
                      {r.note ? ` · ${r.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-gray-900 tabular-nums">{fmt(r.amount)}</p>
                    <p className="text-[10px] text-gray-400">/month</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(r)}
                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-violet-100 hover:text-violet-600 flex items-center justify-center text-gray-400 transition-colors">
                      <Pencil size={11} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => del(r.id)}
                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors">
                      <Trash2 size={11} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Recurring' : 'Add Recurring'} subtitle="Auto-adds every month">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Netflix, Rent…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount (₹)</Label>
              <AmountInput value={amount} onChange={setAmount} />
            </div>
            <div>
              <Label>Day of Month</Label>
              <Input required type="number" min="1" max="28" value={day} onChange={e => setDay(e.target.value)} placeholder="e.g. 1" />
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
