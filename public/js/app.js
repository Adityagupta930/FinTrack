let expenses = [], recurring = [], budgets = [];
let barChart, pieChart, lineChart, doughnutChart;

const KEYS = { expenses: 'ft_expenses', recurring: 'ft_recurring', budgets: 'ft_budgets', theme: 'ft_theme' };
const ICONS = { Food:'🍔', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬', Health:'💊', Education:'📚', Bills:'💡', Other:'📦' };
const COLORS = ['#6c63ff','#10b981','#f59e0b','#ec4899','#ef4444','#8b5cf6','#06b6d4','#f97316'];

const CHART_OPTS = () => ({
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: isDark() ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }, ticks: { color: isDark() ? '#9ca3af' : '#9ca3af', font: { family: 'Inter' } } },
    y: { grid: { color: isDark() ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }, ticks: { color: isDark() ? '#9ca3af' : '#9ca3af', font: { family: 'Inter' } } }
  }
});

// ===================== THEME =====================
function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

function initTheme() {
  const saved = localStorage.getItem(KEYS.theme) || 'light';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEYS.theme, theme);
  document.getElementById('themeIcon').className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

document.getElementById('themeToggle').addEventListener('click', () => {
  setTheme(isDark() ? 'light' : 'dark');
  render();
});

// ===================== TOAST =====================
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i> ${msg}`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

// ===================== STORAGE =====================
function load() {
  expenses  = JSON.parse(localStorage.getItem(KEYS.expenses)  || '[]');
  recurring = JSON.parse(localStorage.getItem(KEYS.recurring) || '[]');
  budgets   = JSON.parse(localStorage.getItem(KEYS.budgets)   || '[]');
  processRecurring();
  render();
}

function persist() {
  localStorage.setItem(KEYS.expenses,  JSON.stringify(expenses));
  localStorage.setItem(KEYS.recurring, JSON.stringify(recurring));
  localStorage.setItem(KEYS.budgets,   JSON.stringify(budgets));
}

// ===================== RECURRING =====================
function processRecurring() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  recurring.forEach(r => {
    if (r.lastAdded === ym) return;
    const day = Math.min(r.day, new Date(now.getFullYear(), now.getMonth()+1, 0).getDate());
    const date = `${ym}-${String(day).padStart(2,'0')}`;
    expenses.unshift({ id: crypto.randomUUID(), title: r.title, amount: parseFloat(r.amount), category: r.category, date, note: r.note || '🔄 Recurring', createdAt: new Date().toISOString() });
    r.lastAdded = ym;
  });
  persist();
}

function saveRecurring(data) {
  const id = document.getElementById('r-id').value;
  if (id) {
    recurring = recurring.map(r => r.id === id ? { ...r, ...data, id } : r);
    toast('Recurring updated!');
  } else {
    recurring.push({ id: crypto.randomUUID(), ...data, amount: parseFloat(data.amount), day: parseInt(data.day) });
    toast('Recurring expense added! Will auto-add every month. 🔄');
  }
  persist();
  renderRecurring();
}

function deleteRecurring(id) {
  if (!confirm('Delete this recurring expense?')) return;
  recurring = recurring.filter(r => r.id !== id);
  persist();
  renderRecurring();
  toast('Recurring expense deleted.', 'info');
}

function renderRecurring() {
  const el = document.getElementById('recurring-list');
  if (!recurring.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">🔄</div><p>No recurring expenses yet.</p></div>`; return; }
  el.innerHTML = recurring.map(r => `
    <div class="expense-item">
      <div class="expense-left">
        <div class="expense-icon">${ICONS[r.category]||'📦'}</div>
        <div>
          <div class="expense-title">${r.title}</div>
          <div class="expense-meta">${r.category} · Every month on day ${r.day}${r.note ? ' · '+r.note : ''}</div>
        </div>
      </div>
      <div class="expense-right">
        <div class="expense-amount">${fmt(r.amount)}<span style="font-size:11px;color:var(--text3)">/mo</span></div>
        <div class="expense-actions">
          <button class="btn-edit" onclick="editRecurring('${r.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-delete" onclick="deleteRecurring('${r.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('');
}

function editRecurring(id) {
  const r = recurring.find(x => x.id === id);
  if (!r) return;
  document.getElementById('recurringModal').classList.add('open');
  document.getElementById('r-id').value = r.id;
  document.getElementById('r-title').value = r.title;
  document.getElementById('r-amount').value = r.amount;
  document.getElementById('r-day').value = r.day;
  document.getElementById('r-category').value = r.category;
  document.getElementById('r-note').value = r.note || '';
  document.querySelectorAll('.r-chip').forEach(c => c.classList.toggle('selected', c.dataset.val === r.category));
}

// ===================== BUDGET =====================
function saveBudget(cat, amount) {
  const idx = budgets.findIndex(b => b.category === cat);
  if (idx > -1) budgets[idx].amount = parseFloat(amount);
  else budgets.push({ category: cat, amount: parseFloat(amount) });
  persist();
  renderBudget();
  checkBudgetAlerts();
  toast(`Budget set for ${cat}!`);
}

function deleteBudget(cat) {
  budgets = budgets.filter(b => b.category !== cat);
  persist();
  renderBudget();
  toast('Budget removed.', 'info');
}

function checkBudgetAlerts() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  budgets.forEach(b => {
    const spent = expenses.filter(e => e.category === b.category && e.date.startsWith(ym)).reduce((s,e) => s+e.amount, 0);
    const pct = (spent / b.amount) * 100;
    if (pct >= 100) toast(`🚨 Budget exceeded for ${ICONS[b.category]} ${b.category}! Spent ${fmt(spent)} of ${fmt(b.amount)}`, 'error');
    else if (pct >= 80) toast(`⚠️ ${ICONS[b.category]} ${b.category} budget at ${pct.toFixed(0)}% (${fmt(spent)} / ${fmt(b.amount)})`, 'warning');
  });
}

function renderBudget() {
  const el = document.getElementById('budget-list');
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  if (!budgets.length) { el.innerHTML = `<div class="empty"><div class="empty-icon">🎯</div><p>No budgets set yet.</p></div>`; return; }
  el.innerHTML = budgets.map(b => {
    const spent = expenses.filter(e => e.category === b.category && e.date.startsWith(ym)).reduce((s,e) => s+e.amount, 0);
    const pct = Math.min((spent / b.amount) * 100, 100).toFixed(0);
    const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
    return `<div class="budget-item">
      <div class="budget-top">
        <div class="budget-cat">${ICONS[b.category]||'📦'} ${b.category}</div>
        <div class="budget-amounts">${fmt(spent)} <span style="color:var(--text3)">/ ${fmt(b.amount)}</span></div>
        <button class="btn-delete" onclick="deleteBudget('${b.category}')" style="opacity:1"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="budget-bar-wrap">
        <div class="budget-bar" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="budget-pct" style="color:${color}">${pct}% used</div>
    </div>`;
  }).join('');
}

// ===================== EXPENSES CRUD =====================
function saveExpense(data) {
  const id = document.getElementById('expense-id').value;
  if (id) {
    expenses = expenses.map(e => e.id === id ? { ...e, ...data, id } : e);
    toast('Expense updated!');
  } else {
    expenses.unshift({ id: crypto.randomUUID(), ...data, amount: parseFloat(data.amount), createdAt: new Date().toISOString() });
    toast('Expense added!');
  }
  persist();
  render();
  checkBudgetAlerts();
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  expenses = expenses.filter(e => e.id !== id);
  persist();
  render();
  toast('Expense deleted.', 'info');
}

// ===================== EXPORT =====================
function exportCSV() {
  const filtered = getFilteredExpenses();
  if (!filtered.length) { toast('No expenses to export.', 'info'); return; }
  const rows = [['Title','Amount','Category','Date','Note'], ...filtered.map(e => [e.title, e.amount, e.category, e.date, e.note||''])];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `fintrack-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  toast('CSV exported!');
}

function exportPDF() {
  const filtered = getFilteredExpenses();
  if (!filtered.length) { toast('No expenses to export.', 'info'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18); doc.text('FinTrack - Expense Report', 14, 20);
  doc.setFontSize(11); doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
  doc.autoTable({
    startY: 35,
    head: [['Title','Amount (₹)','Category','Date','Note']],
    body: filtered.map(e => [e.title, e.amount.toLocaleString('en-IN'), e.category, e.date, e.note||'']),
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [108,99,255] }
  });
  const total = filtered.reduce((s,e) => s+e.amount, 0);
  doc.text(`Total: ₹${total.toLocaleString('en-IN')}`, 14, doc.lastAutoTable.finalY + 10);
  doc.save(`fintrack-${new Date().toISOString().slice(0,10)}.pdf`);
  toast('PDF exported!');
}

// ===================== HELPERS =====================
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

function getLast6Months() {
  const now = new Date(), months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  return months;
}

function getCatTotals(list) {
  return list.reduce((acc,e) => { acc[e.category] = (acc[e.category]||0) + e.amount; return acc; }, {});
}

function getFilteredExpenses() {
  const search = document.getElementById('search').value.toLowerCase();
  const cat    = document.getElementById('filter-category').value;
  const month  = document.getElementById('filter-month').value;
  const from   = document.getElementById('date-from').value;
  const to     = document.getElementById('date-to').value;
  return expenses.filter(e =>
    (!search || e.title.toLowerCase().includes(search) || (e.note||'').toLowerCase().includes(search)) &&
    (!cat    || e.category === cat) &&
    (!month  || e.date.startsWith(month)) &&
    (!from   || e.date >= from) &&
    (!to     || e.date <= to)
  );
}

function expenseHTML(e) {
  return `<div class="expense-item">
    <div class="expense-left">
      <div class="expense-icon">${ICONS[e.category]||'📦'}</div>
      <div>
        <div class="expense-title">${e.title}</div>
        <div class="expense-meta">${e.category} &nbsp;·&nbsp; ${new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}${e.note ? ' &nbsp;·&nbsp; '+e.note : ''}</div>
      </div>
    </div>
    <div class="expense-right">
      <div class="expense-amount">${fmt(e.amount)}</div>
      <div class="expense-actions">
        <button class="btn-edit" onclick="openEdit('${e.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-delete" onclick="deleteExpense('${e.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  </div>`;
}

function emptyHTML() { return `<div class="empty"><div class="empty-icon">💸</div><p>No expenses found.</p></div>`; }

// ===================== RENDER =====================
function render() {
  renderDashboard();
  renderExpensesList();
  renderAnalytics();
  renderRecurring();
  renderBudget();
}

function renderDashboard() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const thisMonth = expenses.filter(e => e.date.startsWith(ym));

  document.getElementById('total-spent').textContent  = fmt(expenses.reduce((s,e) => s+e.amount, 0));
  document.getElementById('month-spent').textContent  = fmt(thisMonth.reduce((s,e) => s+e.amount, 0));
  document.getElementById('total-count').textContent  = expenses.length;
  document.getElementById('month-name').textContent   = now.toLocaleString('default',{month:'long',year:'numeric'});

  const catTotals = getCatTotals(expenses);
  const top = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('top-category').textContent = top ? `${ICONS[top[0]]||'📦'} ${top[0]}` : '—';
  document.getElementById('recent-list').innerHTML = expenses.slice(0,5).map(expenseHTML).join('') || emptyHTML();

  const months = getLast6Months();
  const labels = months.map(m => { const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short'}); });
  const barData = months.map(m => expenses.filter(e=>e.date.startsWith(m)).reduce((s,e)=>s+e.amount,0));

  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: { labels, datasets: [{ data: barData, backgroundColor: 'rgba(108,99,255,0.8)', hoverBackgroundColor: '#6c63ff', borderRadius: 8, borderSkipped: false }] },
    options: { ...CHART_OPTS(), plugins: { legend: { display: false } } }
  });

  const cats = Object.keys(catTotals);
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: { labels: cats, datasets: [{ data: cats.map(c=>catTotals[c]), backgroundColor: COLORS, borderWidth: 2, borderColor: isDark() ? '#1e1e2e' : '#fff' }] },
    options: { plugins: { legend: { labels: { color: isDark() ? '#9ca3af' : '#6b7280', boxWidth: 10, font: { family:'Inter', size:12 } } } } }
  });
}

function renderExpensesList() {
  const months = [...new Set(expenses.map(e=>e.date.slice(0,7)))].sort().reverse();
  const fm = document.getElementById('filter-month'), cur = fm.value;
  fm.innerHTML = '<option value="">All Months</option>' + months.map(m => {
    const [y,mo] = m.split('-');
    return `<option value="${m}" ${m===cur?'selected':''}>${new Date(y,mo-1).toLocaleString('default',{month:'long',year:'numeric'})}</option>`;
  }).join('');
  const filtered = getFilteredExpenses();
  document.getElementById('expenses-list').innerHTML = filtered.map(expenseHTML).join('') || emptyHTML();
}

function renderAnalytics() {
  const months = getLast6Months();
  const labels = months.map(m => { const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short',year:'2-digit'}); });
  const lineData = months.map(m => expenses.filter(e=>e.date.startsWith(m)).reduce((s,e)=>s+e.amount,0));

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: { labels, datasets: [{ data: lineData, borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.07)', fill: true, tension: 0.4, pointBackgroundColor: '#6c63ff', pointBorderColor: isDark() ? '#1e1e2e' : '#fff', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }] },
    options: { ...CHART_OPTS(), plugins: { legend: { display: false } } }
  });

  const catTotals = getCatTotals(expenses);
  const cats = Object.keys(catTotals);

  if (doughnutChart) doughnutChart.destroy();
  doughnutChart = new Chart(document.getElementById('doughnutChart'), {
    type: 'doughnut',
    data: { labels: cats, datasets: [{ data: cats.map(c=>catTotals[c]), backgroundColor: COLORS, borderWidth: 2, borderColor: isDark() ? '#1e1e2e' : '#fff' }] },
    options: { cutout: '68%', plugins: { legend: { labels: { color: isDark() ? '#9ca3af' : '#6b7280', boxWidth: 10, font: { family:'Inter', size:12 } } } } }
  });

  const total = Object.values(catTotals).reduce((s,v)=>s+v,0);
  document.getElementById('category-stats').innerHTML = Object.entries(catTotals)
    .sort((a,b)=>b[1]-a[1])
    .map(([c,amt],i) => `
      <div class="cat-stat">
        <div class="cat-name">${ICONS[c]||'📦'} ${c}</div>
        <div class="cat-bar-wrap"><div class="cat-bar" style="width:${total?(amt/total*100).toFixed(0):0}%;background:${COLORS[i%COLORS.length]}"></div></div>
        <div class="cat-amt">${fmt(amt)}</div>
      </div>`).join('') || '<p style="color:var(--text3);font-size:13px;padding:16px 0">No data yet</p>';
}

// ===================== MODALS =====================
function openModal(id = null) {
  document.getElementById('modal').classList.add('open');
  document.getElementById('expense-id').value = '';
  document.getElementById('expense-form').reset();
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('f-category').value = '';
  document.querySelectorAll('.cat-chip:not(.r-chip)').forEach(c => c.classList.remove('selected'));
  document.getElementById('modal-title').textContent = id ? 'Edit Expense' : 'Add Expense';
  if (id) {
    const e = expenses.find(x => x.id === id);
    if (!e) return;
    document.getElementById('expense-id').value = e.id;
    document.getElementById('f-title').value = e.title;
    document.getElementById('f-amount').value = e.amount;
    document.getElementById('f-date').value = e.date;
    document.getElementById('f-category').value = e.category;
    document.getElementById('f-note').value = e.note || '';
    document.querySelectorAll('.cat-chip:not(.r-chip)').forEach(c => c.classList.toggle('selected', c.dataset.val === e.category));
  }
}

function openEdit(id) { openModal(id); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }
function closeRecurringModal() { document.getElementById('recurringModal').classList.remove('open'); document.getElementById('recurring-form').reset(); document.getElementById('r-id').value = ''; document.querySelectorAll('.r-chip').forEach(c => c.classList.remove('selected')); document.getElementById('r-category').value = ''; }
function closeBudgetModal() { document.getElementById('budgetModal').classList.remove('open'); document.getElementById('budget-form').reset(); }

// ===================== EVENTS =====================
// Category chips - expense modal
document.querySelectorAll('.cat-chip:not(.r-chip)').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip:not(.r-chip)').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    document.getElementById('f-category').value = chip.dataset.val;
  });
});

// Category chips - recurring modal
document.querySelectorAll('.r-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.r-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    document.getElementById('r-category').value = chip.dataset.val;
  });
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    if (!page) return;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-page="${page}"]`)?.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    const titles = { dashboard:'Dashboard', expenses:'Expenses', recurring:'Recurring', analytics:'Analytics', budget:'Budget' };
    const subs   = { dashboard:"Welcome back! Here's your financial overview.", expenses:'Manage and track all your expenses.', recurring:'Auto-recurring monthly expenses.', analytics:'Deep dive into your spending patterns.', budget:'Set and track monthly spending limits.' };
    document.getElementById('page-title').textContent = titles[page];
    document.getElementById('page-sub').textContent   = subs[page];
  });
});

document.querySelector('.view-all')?.addEventListener('click', e => { e.preventDefault(); document.querySelector('.nav-link[data-page="expenses"]').click(); });

// Expense modal
document.getElementById('openModal').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

document.getElementById('expense-form').addEventListener('submit', e => {
  e.preventDefault();
  const cat = document.getElementById('f-category').value;
  if (!cat) { toast('Please select a category!', 'warning'); return; }
  saveExpense({ title: document.getElementById('f-title').value.trim(), amount: document.getElementById('f-amount').value, date: document.getElementById('f-date').value, category: cat, note: document.getElementById('f-note').value.trim() });
  closeModal();
});

// Recurring modal
document.getElementById('openRecurringModal').addEventListener('click', () => { document.getElementById('recurringModal').classList.add('open'); });
document.getElementById('closeRecurringModal').addEventListener('click', closeRecurringModal);
document.getElementById('cancelRecurringModal').addEventListener('click', closeRecurringModal);
document.getElementById('recurringModal').addEventListener('click', e => { if (e.target.id === 'recurringModal') closeRecurringModal(); });

document.getElementById('recurring-form').addEventListener('submit', e => {
  e.preventDefault();
  const cat = document.getElementById('r-category').value;
  if (!cat) { toast('Please select a category!', 'warning'); return; }
  saveRecurring({ title: document.getElementById('r-title').value.trim(), amount: document.getElementById('r-amount').value, day: document.getElementById('r-day').value, category: cat, note: document.getElementById('r-note').value.trim() });
  closeRecurringModal();
});

// Budget modal
document.getElementById('openBudgetModal').addEventListener('click', () => { document.getElementById('budgetModal').classList.add('open'); });
document.getElementById('closeBudgetModal').addEventListener('click', closeBudgetModal);
document.getElementById('cancelBudgetModal').addEventListener('click', closeBudgetModal);
document.getElementById('budgetModal').addEventListener('click', e => { if (e.target.id === 'budgetModal') closeBudgetModal(); });

document.getElementById('budget-form').addEventListener('submit', e => {
  e.preventDefault();
  saveBudget(document.getElementById('b-category').value, document.getElementById('b-amount').value);
  closeBudgetModal();
});

// Filters
document.getElementById('search').addEventListener('input', renderExpensesList);
document.getElementById('filter-category').addEventListener('change', renderExpensesList);
document.getElementById('filter-month').addEventListener('change', renderExpensesList);
document.getElementById('date-from').addEventListener('change', renderExpensesList);
document.getElementById('date-to').addEventListener('change', renderExpensesList);

// Export
document.getElementById('exportCSV').addEventListener('click', exportCSV);
document.getElementById('exportPDF').addEventListener('click', exportPDF);

// Today date
document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

// Init
initTheme();
load();
