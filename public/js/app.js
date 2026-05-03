let expenses = [];
let barChart, pieChart, lineChart, doughnutChart;
const STORAGE_KEY = 'fintrack_expenses';

const ICONS = { Food:'🍔', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬', Health:'💊', Education:'📚', Bills:'💡', Other:'📦' };
const COLORS = ['#7c6ff7','#06d6a0','#fbbf24','#f72585','#ff6b6b','#a78bfa','#00b4d8','#fb923c'];
const CHART_OPTS = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { family: 'Inter' } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { family: 'Inter' } } }
  }
};

// --- Storage ---
function load() {
  expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  render();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// --- CRUD ---
function saveExpense(data) {
  const id = document.getElementById('expense-id').value;
  if (id) {
    expenses = expenses.map(e => e.id === id ? { ...e, ...data, id } : e);
  } else {
    expenses.unshift({ id: crypto.randomUUID(), ...data, amount: parseFloat(data.amount), createdAt: new Date().toISOString() });
  }
  persist();
  render();
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  expenses = expenses.filter(e => e.id !== id);
  persist();
  render();
}

// --- Helpers ---
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

function getLast6Months() {
  const now = new Date(), months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  return months;
}

function getCatTotals(list) {
  return list.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
}

function expenseHTML(e) {
  return `<div class="expense-item">
    <div class="expense-left">
      <div class="expense-icon">${ICONS[e.category] || '📦'}</div>
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

function emptyHTML() {
  return `<div class="empty"><div class="empty-icon">💸</div><p>No expenses yet. Add your first one!</p></div>`;
}

// --- Render ---
function render() {
  renderDashboard();
  renderExpensesList();
  renderAnalytics();
}

function renderDashboard() {
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  document.getElementById('total-spent').textContent = fmt(expenses.reduce((s,e) => s+e.amount, 0));
  document.getElementById('month-spent').textContent = fmt(thisMonth.reduce((s,e) => s+e.amount, 0));
  document.getElementById('total-count').textContent = expenses.length;
  document.getElementById('month-name').textContent = now.toLocaleString('default',{month:'long',year:'numeric'});

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
    options: { ...CHART_OPTS, plugins: { legend: { display: false } } }
  });

  const cats = Object.keys(catTotals);
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: { labels: cats, datasets: [{ data: cats.map(c=>catTotals[c]), backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }] },
    options: { plugins: { legend: { labels: { color: '#6b7280', boxWidth: 10, font: { family: 'Inter', size: 12 } } } } }
  });
}

function renderExpensesList() {
  const search = document.getElementById('search').value.toLowerCase();
  const cat = document.getElementById('filter-category').value;
  const month = document.getElementById('filter-month').value;

  const months = [...new Set(expenses.map(e=>e.date.slice(0,7)))].sort().reverse();
  const fm = document.getElementById('filter-month');
  const cur = fm.value;
  fm.innerHTML = '<option value="">All Months</option>' + months.map(m => {
    const [y,mo] = m.split('-');
    return `<option value="${m}" ${m===cur?'selected':''}>${new Date(y,mo-1).toLocaleString('default',{month:'long',year:'numeric'})}</option>`;
  }).join('');

  const filtered = expenses.filter(e =>
    (!search || e.title.toLowerCase().includes(search) || (e.note||'').toLowerCase().includes(search)) &&
    (!cat || e.category === cat) &&
    (!month || e.date.startsWith(month))
  );

  document.getElementById('expenses-list').innerHTML = filtered.map(expenseHTML).join('') || emptyHTML();
}

function renderAnalytics() {
  const months = getLast6Months();
  const labels = months.map(m => { const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short',year:'2-digit'}); });
  const lineData = months.map(m => expenses.filter(e=>e.date.startsWith(m)).reduce((s,e)=>s+e.amount,0));

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: { labels, datasets: [{ data: lineData, borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.07)', fill: true, tension: 0.4, pointBackgroundColor: '#6c63ff', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }] },
    options: { ...CHART_OPTS, plugins: { legend: { display: false } } }
  });

  const catTotals = getCatTotals(expenses);
  const cats = Object.keys(catTotals);

  if (doughnutChart) doughnutChart.destroy();
  doughnutChart = new Chart(document.getElementById('doughnutChart'), {
    type: 'doughnut',
    data: { labels: cats, datasets: [{ data: cats.map(c=>catTotals[c]), backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }] },
    options: { cutout: '68%', plugins: { legend: { labels: { color: '#6b7280', boxWidth: 10, font: { family: 'Inter', size: 12 } } } } }
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

// --- Modal ---
function openModal(id = null) {
  document.getElementById('modal').classList.add('open');
  document.getElementById('expense-id').value = '';
  document.getElementById('expense-form').reset();
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('f-category').value = '';
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
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
    document.querySelectorAll('.cat-chip').forEach(c => { if (c.dataset.val === e.category) c.classList.add('selected'); });
  }
}

function openEdit(id) { openModal(id); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }

// Category chips
document.querySelectorAll('.cat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    document.getElementById('f-category').value = chip.dataset.val;
  });
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page || link.closest('[data-page]')?.dataset.page;
    if (!page) return;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-page="${page}"]`)?.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    const titles = { dashboard: 'Dashboard', expenses: 'Expenses', analytics: 'Analytics' };
    const subs = { dashboard: "Welcome back! Here's your financial overview.", expenses: 'Manage and track all your expenses.', analytics: 'Deep dive into your spending patterns.' };
    document.getElementById('page-title').textContent = titles[page];
    document.getElementById('page-sub').textContent = subs[page];
  });
});

// View all link
document.querySelector('.view-all')?.addEventListener('click', e => {
  e.preventDefault();
  document.querySelector('.nav-link[data-page="expenses"]').click();
});

// Modal events
document.getElementById('openModal').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

document.getElementById('expense-form').addEventListener('submit', e => {
  e.preventDefault();
  const cat = document.getElementById('f-category').value;
  if (!cat) { alert('Please select a category'); return; }
  saveExpense({
    title: document.getElementById('f-title').value.trim(),
    amount: document.getElementById('f-amount').value,
    date: document.getElementById('f-date').value,
    category: cat,
    note: document.getElementById('f-note').value.trim()
  });
  closeModal();
});

document.getElementById('search').addEventListener('input', renderExpensesList);
document.getElementById('filter-category').addEventListener('change', renderExpensesList);
document.getElementById('filter-month').addEventListener('change', renderExpensesList);

// Today date
document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

// Init
load();
