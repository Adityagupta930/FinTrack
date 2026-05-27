'use client';
import { useStore } from '@/lib/store';
import { fmt, COLORS, CATEGORY_ICONS } from '@/lib/api';
import dynamic from 'next/dynamic';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

const Line     = dynamic(() => import('react-chartjs-2').then(m => m.Line),     { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), { ssr: false });

export default function AnalyticsPage() {
  const { expenses } = useStore();

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const labels   = months.map(m => new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }));
  const lineData = months.map(m => expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0));

  const catTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount; return acc;
  }, {} as Record<string, number>);
  const cats  = Object.keys(catTotals);
  const total = Object.values(catTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-black text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Deep dive into your spending patterns.</p>
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="text-[13px] font-bold text-gray-900">Spending Trend</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full">Last 6 months</span>
        </div>
        <div className="p-5">
          <Line
            data={{
              labels,
              datasets: [{
                data: lineData,
                borderColor: '#6c63ff',
                backgroundColor: 'rgba(108,99,255,0.06)',
                fill: true, tension: 0.4,
                pointBackgroundColor: '#6c63ff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
              }],
            }}
            options={{
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) } } },
              scales: {
                x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
                y: { grid: { color: '#f3f4f6' }, border: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af', callback: v => '₹' + Number(v).toLocaleString('en-IN') } },
              },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Doughnut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-[13px] font-bold text-gray-900">Category Split</p>
          </div>
          <div className="p-5">
            {cats.length > 0 ? (
              <Doughnut
                data={{ labels: cats, datasets: [{ data: cats.map(c => catTotals[c]), backgroundColor: COLORS, borderWidth: 3, borderColor: '#fff' }] }}
                options={{ cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: '#6b7280', padding: 12 } }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(ctx.parsed)}` } } } }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                <span className="text-4xl mb-2">📊</span>
                <p className="text-[12px]">No data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-[13px] font-bold text-gray-900">Top Categories</p>
          </div>
          <div className="p-5">
            {cats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                <span className="text-4xl mb-2">📦</span>
                <p className="text-[12px]">No data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt], i) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-[12px] w-28 text-gray-600 font-medium flex-shrink-0 truncate">
                      {CATEGORY_ICONS[cat] || '📦'} {cat}
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${total ? (amt / total * 100).toFixed(0) : 0}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-900 w-20 text-right flex-shrink-0 tabular-nums">
                      {fmt(amt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
