const API = '/api/expenses';
let expenses = [];
let barChart, pieChart, lineChart, doughnutChart;

const CATEGORY_ICONS = {
  Food: '🍔', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Education: '📚',
  Bills: '💡', Other: '📦'
};

const CHART_COLORS = ['#6c63ff','#00d4aa','#ffd93d','#ff6b6b','#ff9f43','#a29bfe','#fd79a8','#74b9ff'];

// --- API ---
async function fetchExpenses() {
  const res = await fetch(API);
  expenses = await res.json();
  render();
}

async function saveExpense(data) {
  const id = document.getElementById('expense-id').value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API}/${id}` : API;
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  await fetchExpenses();
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  await fetchExpenses();
}

// --- Render ---
function render() {
  renderDashboard();
  renderExpensesList();
  renderAnalytics();
}

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 }); }

function renderDashboard() {
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

  document.getElementById('total-spent').textContent = fmt(total);
  document.getElementById('month-spent').textContent = fmt(monthTotal);
  document.getElementById('total-count').textContent = expenses.length;

  const catTotals = getCategoryTotals(expenses);
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('top-category').textContent = topCat ? `${CATEGORY_ICONS[topCat[0]] || '📦'} ${topCat[0]}` : '-';

  // Recent 5
  const recentList = document.getElementById('recent-list');
  const recent = expenses.slice(0, 5);
  recentList.innerHTML = recent.length ? recent.map(expenseHTML).join('') : emptyHTML();

  // Bar chart - last 6 months
  const months = getLast6Months();
  const barData = months.map(m => expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0));
  const labels = months.map(m => { const [y, mo] = m.split('-'); return new Date(y, mo - 1).toLocaleString('default', { month: 'short' }); });

  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: { labels, datasets: [{ data: barData, backgroundColor: '#6c63ff', borderRadius: 8 }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#2a2a4a' }, ticks: { color: '#9090b0' } }, y: { grid: { color: '#2a2a4a' }, ticks: { color: '#9090b0' } } } }
  });

  // Pie chart
  const cats = Object.keys(catTotals);
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: { labels: cats, datasets: [{ data: cats.map(c => catTotals[c]), backgroundColor: CHART_COLORS }] },
    options: { plugins: { legend: { labels: { color: '#9090b0', boxWidth: 12 } } } }
  });
}

function renderExpensesList() {
  const search = document.getElementById('search').value.toLowerCase();
  const cat = document.getElementById('filter-category').value;
  const month = document.getElementById('filter-month').value;

  // Populate month filter
  const months = [...new Set(expenses.map(e => e.date.slice(0, 7)))].sort().reverse();
  const filterMonth = document.getElementById('filter-month');
  const currentVal = filterMonth.value;
  filterMonth.innerHTML = '<option value="">All Months</option>' + months.map(m => {
    const [y, mo] = m.split('-');
    const label = new Date(y, mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    return `<option value="${m}" ${m === currentVal ? 'selected' : ''}>${label}</option>`;
  }).join('');

  let filtered = expenses.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search) || (e.note || '').toLowerCase().includes(search);
    const matchCat = !cat || e.category === cat;
    const matchMonth = !month || e.date.startsWith(month);
    return matchSearch && matchCat && matchMonth;
  });

  document.getElementById('expenses-list').innerHTML = filtered.length ? filtered.map(expenseHTML).join('') : emptyHTML();
}

function renderAnalytics() {
  const months = getLast6Months();
  const lineData = months.map(m => expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0));
  const labels = months.map(m => { const [y, mo] = m.split('-'); return new Date(y, mo - 1).toLocaleString('default', { month: 'short', year: '2-digit' }); });

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: { labels, datasets: [{ data: lineData, borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#6c63ff' }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#2a2a4a' }, ticks: { color: '#9090b0' } }, y: { grid: { color: '#2a2a4a' }, ticks: { color: '#9090b0' } } } }
  });

  const catTotals = getCategoryTotals(expenses);
  const cats = Object.keys(catTotals);

  if (doughnutChart) doughnutChart.destroy();
  doughnutChart = new Chart(document.getElementById('doughnutChart'), {
    type: 'doughnut',
    data: { labels: cats, datasets: [{ data: cats.map(c => catTotals[c]), backgroundColor: CHART_COLORS }] },
    options: { plugins: { legend: { labels: { color: '#9090b0', boxWidth: 12 } } }, cutout: '65%' }
  });

  const total = Object.values(catTotals).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  document.getElementById('category-stats').innerHTML = sorted.map(([cat, amt], i) => `
    <div class="cat-stat">
      <span>${CATEGORY_ICONS[cat] || '📦'} ${cat}</span>
      <div class="cat-bar-wrap"><div class="cat-bar" style="width:${total ? (amt/total*100).toFixed(0) : 0}%;background:${CHART_COLORS[i % CHART_COLORS.length]}"></div></div>
      <span>${fmt(amt)}</span>
    </div>`).join('');
}

function expenseHTML(e) {
  return `<div class="expense-item">
    <div class="expense-left">
      <div class="expense-icon">${CATEGORY_ICONS[e.category] || '📦'}</div>
      <div>
        <div class="expense-title">${e.title}</div>
        <div class="expense-meta">${e.category} • ${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${e.note ? ' • ' + e.note : ''}</div>
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
  return `<div class="empty"><i class="fa-solid fa-receipt"></i><p>No expenses found</p></div>`;
}

function getCategoryTotals(list) {
  return list.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// --- Modal ---
function openModal(id = null) {
  document.getElementById('modal').classList.add('open');
  document.getElementById('expense-id').value = '';
  document.getElementById('expense-form').reset();
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal-title').textContent = 'Add Expense';
  if (id) {
    const e = expenses.find(x => x.id === id);
    if (!e) return;
    document.getElementById('modal-title').textContent = 'Edit Expense';
    document.getElementById('expense-id').value = e.id;
    document.getElementById('f-title').value = e.title;
    document.getElementById('f-amount').value = e.amount;
    document.getElementById('f-date').value = e.date;
    document.getElementById('f-category').value = e.category;
    document.getElementById('f-note').value = e.note || '';
  }
}

function openEdit(id) { openModal(id); }

function closeModal() { document.getElementById('modal').classList.remove('open'); }

// --- Navigation ---
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.getElementById('page-title').textContent = link.textContent.trim();
    if (page === 'analytics') renderAnalytics();
  });
});

// --- Events ---
document.getElementById('openModal').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });

document.getElementById('expense-form').addEventListener('submit', async e => {
  e.preventDefault();
  await saveExpense({
    title: document.getElementById('f-title').value.trim(),
    amount: document.getElementById('f-amount').value,
    date: document.getElementById('f-date').value,
    category: document.getElementById('f-category').value,
    note: document.getElementById('f-note').value.trim()
  });
  closeModal();
});

document.getElementById('search').addEventListener('input', renderExpensesList);
document.getElementById('filter-category').addEventListener('change', renderExpensesList);
document.getElementById('filter-month').addEventListener('change', renderExpensesList);

// --- Init ---
fetchExpenses();
