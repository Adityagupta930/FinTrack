'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, Expense, Income, Recurring, Budget } from '@/lib/api';

interface Store {
  expenses: Expense[];
  income: Income[];
  recurring: Recurring[];
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setExpenses: (e: Expense[]) => void;
  setIncome: (i: Income[]) => void;
  setRecurring: (r: Recurring[]) => void;
  setBudgets: (b: Budget[]) => void;
}

const Ctx = createContext<Store>({} as Store);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [income, setIncome]       = useState<Income[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [budgets, setBudgets]     = useState<Budget[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [e, i, r, b] = await Promise.all([
        api.expenses.list(),
        api.income.list(),
        api.recurring.list(),
        api.budgets.list(),
      ]);
      setExpenses(e);
      setIncome(i);
      setRecurring(r);
      setBudgets(b);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('Supabase error:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <Ctx.Provider value={{ expenses, income, recurring, budgets, loading, error, reload, setExpenses, setIncome, setRecurring, setBudgets }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
