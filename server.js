const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'expenses.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all expenses
app.get('/api/expenses', (req, res) => {
  res.json(readData());
});

// Add expense
app.post('/api/expenses', (req, res) => {
  const { title, amount, category, date, note } = req.body;
  if (!title || !amount || !category || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const expense = { id: uuidv4(), title, amount: parseFloat(amount), category, date, note: note || '', createdAt: new Date().toISOString() };
  const data = readData();
  data.unshift(expense);
  writeData(data);
  res.status(201).json(expense);
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
  const data = readData();
  const index = data.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  data[index] = { ...data[index], ...req.body, id: req.params.id };
  writeData(data);
  res.json(data[index]);
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  const data = readData();
  const filtered = data.filter(e => e.id !== req.params.id);
  if (filtered.length === data.length) return res.status(404).json({ error: 'Not found' });
  writeData(filtered);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`FinTrack running on http://localhost:${PORT}`));
