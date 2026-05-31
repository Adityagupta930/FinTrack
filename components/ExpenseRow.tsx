'use client';
import { CATEGORY_ICONS, INCOME_ICONS, fmt } from '@/lib/api';
import { Pencil, Trash2, Banknote, Smartphone } from 'lucide-react';

interface Item {
  id: string; title: string; amount: number;
  category: string; date: string; note?: string;
  payment_mode?: 'cash' | 'online';
}

interface Props {
  item: Item;
  type?: 'expense' | 'income';
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ExpenseRow({ item, type = 'expense', onEdit, onDelete }: Props) {
  const icons  = type === 'income' ? INCOME_ICONS : CATEGORY_ICONS;
  const icon   = icons[item.category] || '📦';
  const dateStr = new Date(item.date + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="group flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{item.title}</p>
            {item.payment_mode && (
              <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                item.payment_mode === 'cash'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-violet-50 text-violet-600'
              }`}>
                {item.payment_mode === 'cash'
                  ? <><Banknote size={9} /> Cash</>
                  : <><Smartphone size={9} /> Online</>
                }
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            {item.category} · {dateStr}{item.note ? ` · ${item.note}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <span className={`text-[13px] font-bold tabular-nums ${type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
          {type === 'income' ? '+' : '-'}{fmt(item.amount)}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={onEdit} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-violet-100 hover:text-violet-600 flex items-center justify-center text-gray-400 transition-colors">
              <Pencil size={11} strokeWidth={2.5} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors">
              <Trash2 size={11} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
