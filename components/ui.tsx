// Shared small UI primitives

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

// DatePicker — allows any past or future date
export function DatePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const today = new Date().toISOString().split('T')[0];

  // Quick date shortcuts
  const shortcuts = [
    { label: 'Today',      date: today },
    { label: 'Yesterday',  date: (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })() },
    { label: '2 days ago', date: (() => { const d = new Date(); d.setDate(d.getDate()-2); return d.toISOString().split('T')[0]; })() },
    { label: 'Last week',  date: (() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().split('T')[0]; })() },
  ];

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        max={today}
        required
        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-900 outline-none
          focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 transition-all"
      />
      <div className="flex gap-1.5 flex-wrap">
        {shortcuts.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => onChange(s.date)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
              value === s.date
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
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
