'use client';
import { useState } from 'react';
import Modal from './Modal';
import CategoryPicker from './CategoryPicker';
import { Label, Input, AmountInput, Textarea, FormActions } from './ui';
import { api, Expense } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Banknote, Smartphone } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Expense | null;
}

export default function ExpenseModal({ open, onClose, editing }: Props) {
  const { setExpenses, expenses, wallets, setWallets } = useStore();
  const [title, setTitle]             = useState(editing?.title || '');
  const [amount, setAmount]           = useState(editing?.amount?.toString() || '');
  const [date, setDate]               = useState(editing?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory]       = useState(editing?.category || '');
  const [note, setNote]               = useState(editing?.note || '');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>(editing?.payment_mode || 'cash');
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState('');

  function reset() {
    setTitle(editing?.title || '');
    setAmount(editing?.amount?.toString() || '');
    setDate(editing?.date || new Date().toISOString().split('T')[0]);
    setCategory(editing?.category || '');
    setNote(editing?.note || '');
    setPaymentMode(editing?.payment_mode || 'cash');
    setErr('');
  }

  function handleClose() { reset(); onClose(); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) { setErr('Please select a category'); return; }
    setLoading(true); setErr('');
    try {
      const amt = parseFloat(amount);
      const data = { title, amount: amt, category, date, note, tags: [] as string[], payment_mode: paymentMode };

      if (editing) {
        const updated = await api.expenses.update(editing.id, data);
        setExpenses(expenses.map(x => x.id === editing.id ? updated : x));
        // adjust wallet balance
        const diff = amt - editing.amount;
        const wallet = wallets.find(w => w.type === paymentMode);
        if (wallet) {
          const updated = await api.wallets.update(paymentMode, wallet.balance - diff);
          setWallets(wallets.map(w => w.type === paymentMode ? updated : w));
        }
      } else {
        const created = await api.expenses.create(data);
        setExpenses([created, ...expenses]);
        // deduct from wallet
        const wallet = wallets.find(w => w.type === paymentMode);
        if (wallet) {
          const updated = await api.wallets.update(paymentMode, wallet.balance - amt);
          setWallets(wallets.map(w => w.type === paymentMode ? updated : w));
        }
      }
      handleClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={editing ? 'Edit Expense' : 'Add Expense'} subtitle="Fill in the details below">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lunch, Uber ride…" />
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

        {/* Payment Mode */}
        <div>
          <Label>Payment Mode</Label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaymentMode('cash')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                paymentMode === 'cash'
                  ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300'
              }`}>
              <Banknote size={15} /> Cash
            </button>
            <button type="button" onClick={() => setPaymentMode('online')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                paymentMode === 'online'
                  ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300'
              }`}>
              <Smartphone size={15} /> Online
            </button>
          </div>
        </div>

        <div>
          <Label>Category</Label>
          <CategoryPicker value={category} onChange={setCategory} />
          {err && <p className="text-red-500 text-[12px] mt-2">{err}</p>}
        </div>
        <div>
          <Label>Note <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
          <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" />
        </div>
        <FormActions onCancel={handleClose} loading={loading} label={editing ? 'Update' : 'Add Expense'} />
      </form>
    </Modal>
  );
}
