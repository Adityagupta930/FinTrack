import { supabase } from './supabase';

export interface Expense {
  id: string; title: string; amount: number;
  category: string; date: string; note?: string;
  tags?: string[]; payment_mode?: 'cash' | 'online'; created_at?: string;
}
export interface Income {
  id: string; title: string; amount: number;
  category: string; date: string; note?: string;
  payment_mode?: 'cash' | 'online'; created_at?: string;
}
export interface Recurring {
  id: string; title: string; amount: number;
  category: string; day: number; note?: string;
  last_added?: string; frequency?: 'daily' | 'monthly';
  payment_mode?: 'cash' | 'online';
}
export interface Budget {
  id: string; category: string; amount: number;
}
export interface Wallet {
  id: string; type: 'cash' | 'online'; balance: number; updated_at?: string;
}
export interface Transfer {
  id: string; from_type: string; to_type: string;
  amount: number; note?: string; created_at?: string;
}

async function q<T>(builder: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return data as T;
}

export const api = {
  expenses: {
    list:   () => q<Expense[]>(supabase.from('expenses').select('*').order('created_at', { ascending: false })),
    create: (d: Omit<Expense, 'id' | 'created_at'>) => q<Expense>(supabase.from('expenses').insert([{ ...d, tags: d.tags ?? [] }]).select().single()),
    update: (id: string, d: Partial<Expense>) => q<Expense>(supabase.from('expenses').update(d).eq('id', id).select().single()),
    delete: async (id: string) => { await supabase.from('expenses').delete().eq('id', id); },
  },
  income: {
    list:   () => q<Income[]>(supabase.from('income').select('*').order('created_at', { ascending: false })),
    create: (d: Omit<Income, 'id' | 'created_at'>) => q<Income>(supabase.from('income').insert([d]).select().single()),
    update: (id: string, d: Partial<Income>) => q<Income>(supabase.from('income').update(d).eq('id', id).select().single()),
    delete: async (id: string) => { await supabase.from('income').delete().eq('id', id); },
  },
  recurring: {
    list:   () => q<Recurring[]>(supabase.from('recurring').select('*').order('created_at', { ascending: false })),
    create: (d: Omit<Recurring, 'id'>) => q<Recurring>(supabase.from('recurring').insert([d]).select().single()),
    update: (id: string, d: Partial<Recurring>) => q<Recurring>(supabase.from('recurring').update(d).eq('id', id).select().single()),
    delete: async (id: string) => { await supabase.from('recurring').delete().eq('id', id); },
  },
  budgets: {
    list:   () => q<Budget[]>(supabase.from('budgets').select('*').order('created_at', { ascending: false })),
    upsert: (d: { category: string; amount: number }) => q<Budget>(supabase.from('budgets').upsert([d], { onConflict: 'category' }).select().single()),
    delete: async (category: string) => { await supabase.from('budgets').delete().eq('category', category); },
  },
  wallets: {
    list: () => q<Wallet[]>(supabase.from('wallets').select('*')),
    update: (type: string, balance: number) =>
      q<Wallet>(supabase.from('wallets').update({ balance, updated_at: new Date().toISOString() }).eq('type', type).select().single()),
  },
  transfers: {
    list: () => q<Transfer[]>(supabase.from('transfers').select('*').order('created_at', { ascending: false })),
    create: (d: Omit<Transfer, 'id' | 'created_at'>) => q<Transfer>(supabase.from('transfers').insert([d]).select().single()),
  },
};

export const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Shopping: '🛍️', Entertainment: '🎬',
  Health: '💊', Education: '📚', Bills: '💡', Other: '📦',
};
export const INCOME_ICONS: Record<string, string> = {
  Salary: '💼', Freelance: '💻', Business: '🏢', Investment: '📈', Gift: '🎁', Other: '📦',
};
export const CATEGORIES        = Object.keys(CATEGORY_ICONS);
export const INCOME_CATEGORIES = Object.keys(INCOME_ICONS);
export const COLORS = ['#6c63ff','#10b981','#f59e0b','#ec4899','#ef4444','#8b5cf6','#06b6d4','#f97316'];

export function fmt(n: number | null | undefined) {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN');
}
export function getYM(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
