// Shared small UI primitives
import { CalendarDays } from 'lucide-react';

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-900 outline-none placeholder-gray-400
        focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 transition-all ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={2}
      {...props}
      className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-900 outline-none placeholder-gray-400
        focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 transition-all resize-none ${props.className ?? ''}`}
    />
  );
}

export function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Select date';
  return (
    <div className="relative">
      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 focus-within:bg-white transition-all">
        <span className="pl-3 pr-2 py-2.5 flex-shrink-0 text-gray-400"><CalendarDays size={14} /></span>
        <span className="flex-1 py-2.5 text-[13px] text-gray-900 select-none">{display}</span>
        <input
          type="date"
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
    </div>
  );
}

export function AmountInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 focus-within:bg-white transition-all">
      <span className="px-3 py-2.5 text-[13px] font-bold text-gray-400 border-r border-gray-200 bg-white select-none">₹</span>
      <input
        type="number" min="0" step="0.01" required
        value={value} onChange={e => onChange(e.target.value)}
        placeholder="0.00"
        className="flex-1 px-3 py-2.5 bg-transparent text-[13px] text-gray-900 outline-none placeholder-gray-400"
      />
    </div>
  );
}

export function FormActions({ onCancel, loading, label = 'Save', accent = 'violet' }: {
  onCancel: () => void; loading?: boolean; label?: string; accent?: 'violet' | 'emerald';
}) {
  const colors = {
    violet: 'bg-violet-600 hover:bg-violet-700 shadow-violet-200',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
  };
  return (
    <div className="flex gap-2 justify-end pt-2">
      <button type="button" onClick={onCancel}
        className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition">
        Cancel
      </button>
      <button type="submit" disabled={loading}
        className={`px-5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-lg transition disabled:opacity-50 ${colors[accent]}`}>
        {loading ? 'Saving…' : label}
      </button>
    </div>
  );
}
