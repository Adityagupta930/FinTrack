require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===================== EXPENSES =====================
app.get('/api/expenses', async (req, res) => {
  const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/expenses', async (req, res) => {
  const { title, amount, category, date, note, tags } = req.body;
  if (!title || !amount || !category || !date) return res.status(400).json({ error: 'Missing required fields' });
  const { data, error } = await supabase.from('expenses').insert([{ title, amount: parseFloat(amount), category, date, note: note || '', tags: tags || [] }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date, note, tags } = req.body;
  const { data, error } = await supabase.from('expenses').update({ title, amount: parseFloat(amount), category, date, note: note || '', tags: tags || [] }).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { error } = await supabase.from('expenses').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ===================== RECURRING =====================
app.get('/api/recurring', async (req, res) => {
  const { data, error } = await supabase.from('recurring').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/recurring', async (req, res) => {
  const { title, amount, category, day, note } = req.body;
  if (!title || !amount || !category || !day) return res.status(400).json({ error: 'Missing required fields' });
  const { data, error } = await supabase.from('recurring').insert([{ title, amount: parseFloat(amount), category, day: parseInt(day), note: note || '', last_added: '' }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/recurring/:id', async (req, res) => {
  const { title, amount, category, day, note, last_added } = req.body;
  const { data, error } = await supabase.from('recurring').update({ title, amount: parseFloat(amount), category, day: parseInt(day), note: note || '', last_added: last_added || '' }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/recurring/:id', async (req, res) => {
  const { error } = await supabase.from('recurring').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ===================== BUDGETS =====================
app.get('/api/budgets', async (req, res) => {
  const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/budgets', async (req, res) => {
  const { category, amount } = req.body;
  if (!category || !amount) return res.status(400).json({ error: 'Missing required fields' });
  const { data, error } = await supabase.from('budgets').upsert([{ category, amount: parseFloat(amount) }], { onConflict: 'category' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/budgets/:category', async (req, res) => {
  const { error } = await supabase.from('budgets').delete().eq('category', req.params.category);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`FinTrack running on http://localhost:${PORT}`));
