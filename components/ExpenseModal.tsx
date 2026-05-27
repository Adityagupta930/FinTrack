'use client';
import { useState } from 'react';
import Modal from './Modal';
import CategoryPicker from './CategoryPicker';
import { Label, Input, AmountInput, Textarea, FormActions } from './ui';
import { api, Expense } from '@/lib/api';
import { useStore } from '@/lib/store';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Expense | null;
}

export default function ExpenseModal({ open, onClose, editing }: Props) {
  const { setExpenses, expenses } = useStore();
  const [title, setTitle]       = useState(editing?.title || '');
  const [amount, setAmount]     = useState(editing?.amount?.toString() || '');
  const [date, setDate]         = useState(editing?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(editing?.category || '');
  const [note, setNote]         = useState(editing?.note || '');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  function reset() {
    setTitle(editing?.title || '');
    setAmount(editing?.amount?.toString() || '');
    setDate(editing?.date || new Date().toISOString().split('T')[0]);
    setCategory(editing?.category || '');
    setNote(editing?.note || '');
    setErr('');
  }

  function handleClose() { reset(); onClose(); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) { setErr('Please select a category'); return; }
    setLoading(true); setErr('');
    try {
      const data = { title, amount: parseFloat(amount), category, date, note, tags: [] as string[] };
      if (editing) {
        const updated = await api.expenses.update(editing.id, data);
        setExpenses(expenses.map(x => x.id === editing.id ? updated : x));
      } else {
        const created = await api.expenses.create(data);
        setExpenses([created, ...expenses]);
      }
      handleClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose}
      title={editing ? 'Edit Expense' : 'Add Expense'}
      subtitle="Fill in the details below">
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
