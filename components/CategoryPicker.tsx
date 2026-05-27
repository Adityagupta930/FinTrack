'use client';
import { CATEGORIES, CATEGORY_ICONS } from '@/lib/api';

interface Props {
  value: string;
  onChange: (v: string) => void;
  categories?: string[];
  icons?: Record<string, string>;
}

export default function CategoryPicker({ value, onChange, categories = CATEGORIES, icons = CATEGORY_ICONS }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((cat) => (
        <button
          key={cat} type="button" onClick={() => onChange(cat)}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
            value === cat
              ? 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-200'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'
          }`}
        >
          {icons[cat]} {cat}
        </button>
      ))}
    </div>
  );
}
