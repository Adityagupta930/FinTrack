'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { api, Expense, Income, Recurring, Budget, Wallet, Transfer, Loan } from '@/lib/api';

interface Store {
  expenses:  Expense[];
  income:    Income[];
  recurring: Recurring[];
  budgets:   Budget[];
  wallets:   Wallet[];
  transfers: Transfer[];
  loans:     Loan[];
  loading:   boolean;
  error:     string | null;
  reload:    () => Promise<void>;
  setExpenses:  (e: Expense[])   => void;
  setIncome:    (i: Income[])    => void;
  setRecurring: (r: Recurring[]) => void;
  setBudgets:   (b: Budget[])    => void;
  setWallets:   (w: Wallet[])    => void;
  setTransfers: (t: Transfer[])  => void;
  setLoans:     (l: Loan[])      => void;
  adjustWallet: (type: 'cash' | 'online', delta: number) => Promise<void>;
}

const Ctx = createContext<Store>({} as Store);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [expenses,  setExpenses]  = useState<Expense[]>([]);
  const [income,    setIncome]    = useState<Income[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [budgets,   setBudgets]   = useState<Budget[]>([]);
  const [wallets,   setWallets]   = useState<Wallet[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loans,     setLoans]     = useState<Loan[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const processedRef = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const results = await Promise.allSettled([
        api.expenses.list(),
        api.income.list(),
        api.recurring.list(),
        api.budgets.list(),
        api.wallets.list(),
        api.transfers.list(),
        api.loans.list(),
      ]);
      if (results[0].status === 'fulfilled') setExpenses(results[0].value);
      if (results[1].status === 'fulfilled') setIncome(results[1].value);
      if (results[2].status === 'fulfilled') setRecurring(results[2].value);
      if (results[3].status === 'fulfilled') setBudgets(results[3].value);
      if (results[4].status === 'fulfilled') setWallets(results[4].value);
      if (results[5].status === 'fulfilled') setTransfers(results[5].value);
      if (results[6].status === 'fulfilled') setLoans(results[6].value);
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) setError((results[0] as PromiseRejectedResult).reason?.message || 'Failed to load');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Central wallet adjuster — optimistic update + DB sync
  const adjustWallet = useCallback(async (type: 'cash' | 'online', delta: number) => {
    return new Promise<void>(resolve => {
      setWallets(prev => {
        const wallet = prev.find(w => w.type === type);
        if (!wallet) { resolve(); return prev; }
        const newBal = Math.round((wallet.balance + delta) * 100) / 100;
        api.wallets.update(type, newBal).then(updated => {
          setWallets(cur => cur.map(w => w.type === type ? updated : w));
          resolve();
        });
        return prev.map(w => w.type === type ? { ...w, balance: newBal } : w);
      });
    });
  }, []);

  // Process recurring — runs once after initial data load
  const processRecurring = useCallback(async (recurringList: Recurring[]) => {
    if (recurringList.length === 0) return;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const newExpenses: Expense[] = [];

    for (const r of recurringList) {
      const freq = r.frequency || 'monthly';

      if (freq === 'daily') {
        // Already added today?
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
          setRecurring(cur => cur.map(x => x.id === r.id ? { ...x, last_added: todayStr } : x));
        } catch { /* skip on error */ }

      } else {
        // Already added this month?
        if (r.last_added && r.last_added >= ym) continue;
        const maxDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const d = Math.min(r.day || 1, maxDay);
        const dateStr = `${ym}-${String(d).padStart(2, '0')}`;
        try {
          const created = await api.expenses.create({
            title: r.title, amount: r.amount, category: r.category,
            date: dateStr, note: r.note || '🔄 Monthly recurring',
            tags: [], payment_mode: r.payment_mode || 'cash',
          });
          newExpenses.push(created);
          await adjustWallet(r.payment_mode || 'cash', -r.amount);
          await api.recurring.update(r.id, { last_added: ym });
          setRecurring(cur => cur.map(x => x.id === r.id ? { ...x, last_added: ym } : x));
        } catch { /* skip on error */ }
      }
    }

    if (newExpenses.length > 0) {
      setExpenses(cur => [...newExpenses, ...cur]);
    }
  }, [adjustWallet]);

  useEffect(() => { reload(); }, [reload]);

  // After data loads, process recurring once per session
  useEffect(() => {
    if (!loading && recurring.length > 0 && !processedRef.current) {
      processedRef.current = true;
      processRecurring(recurring);
    }
  }, [loading, recurring, processRecurring]);

  return (
    <Ctx.Provider value={{
      expenses, income, recurring, budgets, wallets, transfers, loans,
      loading, error, reload,
      setExpenses, setIncome, setRecurring, setBudgets, setWallets, setTransfers, setLoans,
      adjustWallet,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
