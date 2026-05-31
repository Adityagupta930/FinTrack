'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { api, fmt } from '@/lib/api';
import Modal from '@/components/Modal';
import { Label, Input, AmountInput, FormActions } from '@/components/ui';
import { Banknote, Smartphone, ArrowLeftRight, Plus, Minus, ArrowRight } from 'lucide-react';

export default function WalletPage() {
  const { wallets, setWallets, transfers, setTransfers, expenses, income } = useStore();

  const cash   = wallets.find(w => w.type === 'cash');
  const online = wallets.find(w => w.type === 'online');

  const [addOpen, setAddOpen]           = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [addType, setAddType]           = useState<'cash' | 'online'>('cash');
  const [addMode, setAddMode]           = useState<'add' | 'subtract'>('add');
  const [addAmount, setAddAmount]       = useState('');
  const [addNote, setAddNote]           = useState('');
  const [fromType, setFromType]         = useState<'cash' | 'online'>('online');
  const [transferAmt, setTransferAmt]   = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [loading, setLoading]           = useState(false);

  async function handleAddBalance(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const amt    = parseFloat(addAmount);
      const wallet = wallets.find(w => w.type === addType);
      if (!wallet) return;
      const newBal  = addMode === 'add' ? wallet.balance + amt : wallet.balance - amt;
      const updated = await api.wallets.update(addType, newBal);
      setWallets(wallets.map(w => w.type === addType ? updated : w));
      setAddOpen(false); setAddAmount(''); setAddNote('');
    } finally { setLoading(false); }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const amt    = parseFloat(transferAmt);
      const toType = fromType === 'cash' ? 'online' : 'cash';
      const from   = wallets.find(w => w.type === fromType);
      const to     = wallets.find(w => w.type === toType);
      if (!from || !to) return;
      const [updFrom, updTo] = await Promise.all([
        api.wallets.update(fromType, from.balance - amt),
        api.wallets.update(toType,   to.balance   + amt),
      ]);
      const transfer = await api.transfers.create({ from_type: fromType, to_type: toType, amount: amt, note: transferNote });
      setWallets(wallets.map(w => w.type === fromType ? updFrom : w.type === toType ? updTo : w));
      setTransfers([transfer, ...transfers]);
      setTransferOpen(false); setTransferAmt(''); setTransferNote('');
    } finally { setLoading(false); }
  }

  const cashExpenses   = expenses.filter(e => e.payment_mode === 'cash').reduce((s, e) => s + e.amount, 0);
  const onlineExpenses = expenses.filter(e => e.payment_mode === 'online').reduce((s, e) => s + e.amount, 0);
  const cashIncome     = income.filter(i => i.payment_mode === 'cash').reduce((s, i) => s + i.amount, 0);
  const onlineIncome   = income.filter(i => i.payment_mode === 'online').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Wallet</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Manage your cash & online balances.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTransferOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-gray-200">
            <ArrowLeftRight size={14} /> Transfer
          </button>
          <button onClick={() => { setAddOpen(true); setAddType('cash'); setAddMode('add'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-violet-200">
            <Plus size={14} /> Add Money
          </button>
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Banknote size={16} />
              </div>
              <span className="font-bold text-sm">Cash</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setAddType('cash'); setAddMode('add'); setAddOpen(true); }}
                className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <Plus size={13} />
              </button>
              <button onClick={() => { setAddType('cash'); setAddMode('subtract'); setAddOpen(true); }}
                className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <Minus size={13} />
              </button>
            </div>
          </div>
          <p className="text-2xl font-black tracking-tight">{fmt(cash?.balance ?? 0)}</p>
          <div className="flex gap-4 mt-3 text-xs text-white/80">
            <span>↑ {fmt(cashIncome)} in</span>
            <span>↓ {fmt(cashExpenses)} out</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Smartphone size={16} />
              </div>
              <span className="font-bold text-sm">Online</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setAddType('online'); setAddMode('add'); setAddOpen(true); }}
                className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <Plus size={13} />
              </button>
              <button onClick={() => { setAddType('online'); setAddMode('subtract'); setAddOpen(true); }}
                className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <Minus size={13} />
              </button>
            </div>
          </div>
          <p className="text-2xl font-black tracking-tight">{fmt(online?.balance ?? 0)}</p>
          <div className="flex gap-4 mt-3 text-xs text-white/80">
            <span>↑ {fmt(onlineIncome)} in</span>
            <span>↓ {fmt(onlineExpenses)} out</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Balance</p>
          <p className="text-[24px] font-black text-gray-900">{fmt((cash?.balance ?? 0) + (online?.balance ?? 0))}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Spent</p>
          <p className="text-[24px] font-black text-red-500">{fmt(cashExpenses + onlineExpenses)}</p>
        </div>
      </div>

      {/* Transfer History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-[13px] font-bold text-gray-900">Transfer History</p>
        </div>
        <div className="px-5 py-2">
          {transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <ArrowLeftRight size={32} className="mb-2" />
              <p className="text-[13px]">No transfers yet.</p>
            </div>
          ) : (
            transfers.map(t => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight size={15} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900">
                      <span className={t.from_type === 'cash' ? 'text-amber-600' : 'text-violet-600'}>
                        {t.from_type === 'cash' ? '💵 Cash' : '📱 Online'}
                      </span>
                      <ArrowRight size={12} className="text-gray-400" />
                      <span className={t.to_type === 'cash' ? 'text-amber-600' : 'text-violet-600'}>
                        {t.to_type === 'cash' ? '💵 Cash' : '📱 Online'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(t.created_at!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {t.note ? ` · ${t.note}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-[13px] font-bold text-gray-900 tabular-nums">{fmt(t.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Subtract Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)}
        title={`${addMode === 'add' ? 'Add to' : 'Subtract from'} ${addType === 'cash' ? 'Cash' : 'Online'}`}
        subtitle={addMode === 'add' ? 'Add money to wallet' : 'Remove money from wallet'}>
        <form onSubmit={handleAddBalance} className="space-y-4">
          <div className="flex gap-2">
            {(['cash', 'online'] as const).map(t => (
              <button key={t} type="button" onClick={() => setAddType(t)}
                className={`flex-1 py-2.5 rounded-xl border text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  addType === t
                    ? t === 'cash' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                {t === 'cash' ? <><Banknote size={14} /> Cash</> : <><Smartphone size={14} /> Online</>}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAddMode('add')}
              className={`flex-1 py-2.5 rounded-xl border text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                addMode === 'add' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
              <Plus size={14} /> Add
            </button>
            <button type="button" onClick={() => setAddMode('subtract')}
              className={`flex-1 py-2.5 rounded-xl border text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                addMode === 'subtract' ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
              <Minus size={14} /> Subtract
            </button>
          </div>
          <div>
            <Label>Amount (₹)</Label>
            <AmountInput value={addAmount} onChange={setAddAmount} />
          </div>
          <div>
            <Label>Note <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
            <Input value={addNote} onChange={e => setAddNote(e.target.value)} placeholder="e.g. ATM withdrawal…" />
          </div>
          <FormActions onCancel={() => setAddOpen(false)} loading={loading} label="Confirm" />
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={transferOpen} onClose={() => setTransferOpen(false)}
        title="Transfer Money" subtitle="Move money between cash and online">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <Label>From</Label>
            <div className="flex gap-2">
              {(['cash', 'online'] as const).map(t => (
                <button key={t} type="button" onClick={() => setFromType(t)}
                  className={`flex-1 py-2.5 rounded-xl border text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    fromType === t
                      ? t === 'cash' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}>
                  {t === 'cash' ? <><Banknote size={14} /> Cash ({fmt(cash?.balance ?? 0)})</> : <><Smartphone size={14} /> Online ({fmt(online?.balance ?? 0)})</>}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-gray-400 mt-2 flex items-center gap-1">
              <ArrowRight size={12} /> To: <span className="font-semibold text-gray-700 ml-1">{fromType === 'cash' ? '📱 Online' : '💵 Cash'}</span>
            </p>
          </div>
          <div>
            <Label>Amount (₹)</Label>
            <AmountInput value={transferAmt} onChange={setTransferAmt} />
          </div>
          <div>
            <Label>Note <span className="text-gray-400 normal-case font-normal">(optional)</span></Label>
            <Input value={transferNote} onChange={e => setTransferNote(e.target.value)} placeholder="e.g. Paid online, got cash…" />
          </div>
          <FormActions onCancel={() => setTransferOpen(false)} loading={loading} label="Transfer" />
        </form>
      </Modal>
    </div>
  );
}
