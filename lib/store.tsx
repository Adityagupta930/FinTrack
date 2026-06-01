'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
    setWallets(cur => {
      const wallet = cur.find(w => w.type === type);
      if (!wallet) return cur;
      const newBal = Math.round((wallet.balance + delta) * 100) / 100;
      api.wallets.update(type, newBal).then(updated => {
        setWallets(latest => latest.map(w => w.type === type ? updated : w));
      });
      return cur.map(w => w.type === type ? { ...w, balance: newBal } : w);
    });
  }, []);

  useEffect(() => { reload(); }, [reload]);

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
