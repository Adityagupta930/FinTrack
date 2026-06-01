'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { api, Loan, fmt } from '@/lib/api';
import Modal from '@/components/Modal';
import { Label, Input, AmountInput, Textarea, FormActions } from '@/components/ui';
import { Plus, CheckCircle, Clock, Banknote, Smartphone, TrendingUp, TrendingDown, Users } from 'lucide-react';

export default function LoansPage() {
  const { loans, setLoans, adjustWallet } = useStore();
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Loan | null>(null);
  const [name, setName]         = useState('');
  const [amount, setAmount]     = useState('');
  const [type, setType]         = useState<'given' | 'taken'>('given');
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate]   = useState('');
  const [note, setNote]         = useState('');
  const [payMode, setPayMode]   = useState<'cash' | 'online'>('cash');
  const [loading, setLoading]   = useState(false);

  function openAdd() {
    setEditing(null); setName(''); setAmount(''); setType('given');
    setDate(new Date().toISOString().split('T')[0]); setDueDate(''); setNote(''); setPayMode('cash');
    setOpen(true);
  }
  function openEdit(l: Loan) {
    setEditing(l); setName(l.person_name); setAmount(l.amount.toString());
    setType(l.type); setDate(l.date); setDueDate(l.due_date || '');
    setNote(l.note || ''); setPayMode(l.payment_mode); setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const amt  = parseFloat(amount);
      const data: Omit<Loan, 'id' | 'created_at'> = {
        person_name: name, amount: amt, type, date,
        due_date: dueDate || undefined, note, status: 'pending', payment_mode: payMode,
      };
      if (editing) {
        const updated = await api.loans.update(editing.id, data);
        setLoans(loans.map(l => l.id === editing.id ? updated : l));
      } else {
        const created = await api.loans.create(data);
        setLoans([created, ...loans]);
        // Wallet effect: given = deduct, taken = add
        await adjustWallet(payMode, type === 'given' ? -amt : amt);
      }
      setOpen(false);
    } finally { setLoading(false); }
  }

  async function settle(loan: Loan) {
    if (!confirm(`Mark ₹${loan.amount} ${loan.type === 'given' ? 'from' : 'to'} ${loan.person_name} as settled?`)) return;
    const updated = await api.loans.settle(loan.id);
    setLoans(loans.map(l => l.id === loan.id ? updated : l));
    // Reverse wallet effect on settle
    await adjustWallet(loan.payment_mode, loan.type === 'given' ? loan.amount : -loan.amount);
  }

  async function del(loan: Loan) {
    if (!confirm('Delete this loan?')) return;
    await api.loans.delete(loan.id);
    setLoans(loans.filter(l => l.id !== loan.id));
    // Reverse wallet if still pending
    if (loan.status === 'pending') {
      await adjustWallet(loan.payment_mode, loan.type === 'given' ? loan.amount : -loan.amount);
    }
  }

  const pending  = loans.filter(l => l.status === 'pending');
  const settled  = loans.filter(l => l.status === 'settled');
  const given    = pending.filter(l => l.type === 'given');
  const taken    = pending.filter(l => l.type === 'taken');
  const totalGiven = given.reduce((s, l) => s + l.amount, 0);
  const totalTaken = taken.reduce((s, l) => s + l.amount, 0);
  const net        = totalTaken - totalGiven; // positive = I owe more, negative = others owe me

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Loans & Udhar</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Track money given & taken.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-violet-200">
          <Plus size={15} strokeWidth={2.5} /> Add Loan
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-red-500" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">I Gave (Pending)</p>
          </div>
          <p className="text-[20px] font-black text-red-500">{fmt(totalGiven)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{given.length} people owe me</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-emerald-600" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">I Took (Pending)</p>
          </div>
          <p className="text-[20px] font-black text-emerald-600">{fmt(totalTaken)}</p>
          <p className="text-[11px] text-gray-400 mt-1">I owe {taken.length} people</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-violet-600" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Net Position</p>
          </div>
          <p className={`text-[20px] font-black ${net > 0 ? 'text-red-500' : net < 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
            {net > 0 ? '-' : net < 0 ? '+' : ''}{fmt(Math.abs(net))}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{net > 0 ? 'You owe more' : net < 0 ? 'Others owe you' : 'All clear!'}</p>
        </div>
      </div>

      {/* Pending — Given */}
      {given.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <TrendingUp size={14} className="text-red-500" />
            <p className="text-[13px] font-bold text-gray-900">Money I Gave (Pending)</p>
            <span className="ml-auto text-[12px] font-bold text-red-500">{fmt(totalGiven)}</span>
          </div>
          <LoanList items={given} onSettle={settle} onEdit={openEdit} onDelete={del} />
        </div>
      )}

      {/* Pending — Taken */}
      {taken.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <TrendingDown size={14} className="text-emerald-600" />
            <p className="text-[13px] font-bold text-gray-900">Money I Took (Pending)</p>
            <span className="ml-auto text-[12px] font-bold text-emerald-600">{fmt(totalTaken)}</span>
          </div>
          <LoanList items={taken} onSettle={settle} onEdit={openEdit} onDelete={del} />
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-14 text-gray-300">
          <Users size={32} className="mb-2" />
          <p className="text-[13px]">No pending loans. All clear! 🎉</p>
        </div>
      )}

      {/* Settled */}
      {settled.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <CheckCircle size={14} className="text-gray-400" />
            <p className="text-[13px] font-bold text-gray-900">Settled</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full ml-auto">{settled.length}</span>
          </div>
          <LoanList items={settled} onDelete={del} />
        </div>
      )}

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? 'Edit Loan' : 'Add Loan'}
        subtitle="Track money given or taken">
        <form onSubmit={submit} className="space-y-4">
          {/* Type */}
          <div>
            <Label>Type</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('given')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                  type === 'given' ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-red-300'
                }`}>
                <TrendingUp size={14} /> I Gave
              </button>
              <button type="button" onClick={() => setType('taken')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                  type === 'taken' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-emerald-300'
                }`}>
                <TrendingDown size={14} /> I Took
              </button>
            </div>
          </div>

          <div>
            <Label>Person Name</Label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul, Priya…"
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all" />
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
            <Label>Due Date <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
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
            <Label>Note <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. For rent, emergency…" />
          </div>
          <FormActions onCancel={() => setOpen(false)} loading={loading} label={editing ? 'Update' : 'Add Loan'} />
        </form>
      </Modal>
    </div>
  );
}

function LoanList({ items, onSettle, onEdit, onDelete }: {
  items: Loan[];
  onSettle?: (l: Loan) => void;
  onEdit?: (l: Loan) => void;
  onDelete: (l: Loan) => void;
}) {
  return (
    <div className="divide-y divide-gray-50">
      {items.map(l => {
        const isOverdue = l.due_date && l.status === 'pending' && new Date(l.due_date) < new Date();
        return (
          <div key={l.id} className="group flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-black flex-shrink-0 ${
                l.status === 'settled' ? 'bg-gray-300' : l.type === 'given' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {l.person_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[13px] font-semibold text-gray-900">{l.person_name}</p>
                  {l.status === 'settled' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Settled</span>
                  )}
                  {isOverdue && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full">Overdue</span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    l.payment_mode === 'cash' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'
                  }`}>
                    {l.payment_mode === 'cash' ? '💵' : '📱'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(l.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {l.due_date ? ` · Due: ${new Date(l.due_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                  {l.note ? ` · ${l.note}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className={`text-[13px] font-black tabular-nums ${
                l.status === 'settled' ? 'text-gray-400 line-through' : l.type === 'given' ? 'text-red-500' : 'text-emerald-600'
              }`}>
                {l.type === 'given' ? '-' : '+'}{fmt(l.amount)}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSettle && l.status === 'pending' && (
                  <button onClick={() => onSettle(l)}
                    className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                    title="Mark as settled">
                    <CheckCircle size={11} strokeWidth={2.5} />
                  </button>
                )}
                {onEdit && l.status === 'pending' && (
                  <button onClick={() => onEdit(l)}
                    className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-violet-100 hover:text-violet-600 flex items-center justify-center text-gray-400 transition-colors">
                    <Clock size={11} strokeWidth={2.5} />
                  </button>
                )}
                <button onClick={() => onDelete(l)}
                  className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors">
                  ✕
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
