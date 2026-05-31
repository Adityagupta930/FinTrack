'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { api, Income, INCOME_CATEGORIES, INCOME_ICONS, fmt, getYM } from '@/lib/api';
import ExpenseRow from '@/components/ExpenseRow';
import Modal from '@/components/Modal';
import CategoryPicker from '@/components/CategoryPicker';
import { Label, Input, AmountInput, Textarea, FormActions } from '@/components/ui';
import { Plus, Wallet, Banknote, Smartphone } from 'lucide-react';

function IncomeModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Income | null }) {
  const { income, setIncome, adjustWallet } = useStore();
  const today = new Date().toISOString().split('T')[0];
  const [title,       setTitle]       = useState('');
  const [amount,      setAmount]      = useState('');
  const [date,        setDate]        = useState(today);
  const [category,    setCategory]    = useState('');
  const [note,        setNote]        = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('cash');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || '');
      setAmount(editing?.amount?.toString() || '');
      setDate(editing?.date || today);
      setCategory(editing?.category || '');
      setNote(editing?.note || '');
      setPaymentMode(editing?.payment_mode || 'cash');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setLoading(true);
    try {
      const amt  = parseFloat(amount);
      const data = { title, amount: amt, category, date, note, payment_mode: paymentMode };

      if (editing) {
        const updated = await api.income.update(editing.id, data);
        setIncome(income.map(i => i.id === editing.id ? updated : i));
        // reverse old credit, apply new credit
        const oldMode = editing.payment_mode || 'cash';
        if (oldMode === paymentMode) {
          await adjustWallet(paymentMode, amt - editing.amount);
        } else {
          await adjustWallet(oldMode, -editing.amount);
          await adjustWallet(paymentMode, amt);
        }
      } else {
        const created = await api.income.create(data);
        setIncome([created, ...income]);
        await adjustWallet(paymentMode, amt);
      }
      onClose();
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Income' : 'Add Income'} subtitle="Record your earnings">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Salary, Freelance…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Amount (₹)</Label>
            <AmountInput value={amount} onChange={setAmount} />
          </div>
          <div>
            <Label>Date</Label>
            <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Category</Label>
          <CategoryPicker value={category} onChange={setCategory} categories={INCOME_CATEGORIES} icons={INCOME_ICONS} />
        </div>
        <div>
          <Label>Payment Mode</Label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaymentMode('cash')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                paymentMode === 'cash' ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300'
              }`}>
              <Banknote size={15} /> Cash
            </button>
            <button type="button" onClick={() => setPaymentMode('online')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                paymentMode === 'online' ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300'
              }`}>
              <Smartphone size={15} /> Online
            </button>
          </div>
        </div>
        <div>
          <Label>Note <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
          <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" />
        </div>
        <FormActions onCancel={onClose} loading={loading} label={editing ? 'Update' : 'Add Income'} accent="emerald" />
      </form>
    </Modal>
  );
}

export default function IncomePage() {
  const { income, setIncome, adjustWallet } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Income | null>(null);
  const ym = getYM();

  const monthTotal = income.filter(i => i.date.startsWith(ym)).reduce((s, i) => s + i.amount, 0);
  const allTotal   = income.reduce((s, i) => s + i.amount, 0);

  async function del(item: Income) {
    if (!confirm('Delete this income entry?')) return;
    await api.income.delete(item.id);
    setIncome(income.filter(i => i.id !== item.id));
    // reverse wallet credit
    if (item.payment_mode) {
      await adjustWallet(item.payment_mode, -item.amount);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Income</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Track your earnings and income sources.</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-emerald-200">
          <Plus size={15} strokeWidth={2.5} /> Add Income
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'This Month', value: fmt(monthTotal), color: 'text-emerald-600' },
          { label: 'All Time',   value: fmt(allTotal),   color: 'text-gray-900' },
          { label: 'Entries',    value: String(income.length), color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{s.label}</p>
            <p className={`text-[20px] font-black tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Wallet size={14} className="text-emerald-600" />
          <p className="text-[13px] font-bold text-gray-900">All Income</p>
        </div>
        <div className="px-5 py-2">
          {income.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-300">
              <span className="text-4xl mb-2">💰</span>
              <p className="text-[13px]">No income recorded yet.</p>
            </div>
          ) : (
            income.map(i => (
              <ExpenseRow key={i.id} item={i} type="income"
                onEdit={() => { setEditing(i); setModalOpen(true); }}
                onDelete={() => del(i)} />
            ))
          )}
        </div>
      </div>

      <IncomeModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} editing={editing} />
    </div>
  );
}
