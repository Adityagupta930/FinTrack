-- ============================================
-- FinTrack — Full Supabase Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- EXPENSES
create table if not exists expenses (
  id           uuid default gen_random_uuid() primary key,
  title        text not null,
  amount       numeric not null,
  category     text not null,
  date         date not null,
  note         text default '',
  tags         text[] default '{}',
  payment_mode text default 'cash',
  created_at   timestamptz default now()
);

-- Add payment_mode if table already exists
alter table expenses add column if not exists payment_mode text default 'cash';

-- INCOME
create table if not exists income (
  id           uuid default gen_random_uuid() primary key,
  title        text not null,
  amount       numeric not null,
  category     text default 'Other',
  date         date not null,
  note         text default '',
  payment_mode text default 'cash',
  created_at   timestamptz default now()
);

alter table income add column if not exists payment_mode text default 'cash';

-- RECURRING
create table if not exists recurring (
  id           uuid default gen_random_uuid() primary key,
  title        text not null,
  amount       numeric not null,
  category     text not null,
  day          int not null default 1,
  note         text default '',
  last_added   text default '',
  frequency    text default 'monthly',
  payment_mode text default 'cash',
  created_at   timestamptz default now()
);

-- Add missing columns if table already exists
alter table recurring add column if not exists frequency    text default 'monthly';
alter table recurring add column if not exists payment_mode text default 'cash';

-- BUDGETS
create table if not exists budgets (
  id         uuid default gen_random_uuid() primary key,
  category   text unique not null,
  amount     numeric not null,
  created_at timestamptz default now()
);

-- WALLETS
create table if not exists wallets (
  id         uuid default gen_random_uuid() primary key,
  type       text unique not null,
  balance    numeric not null default 0,
  updated_at timestamptz default now()
);

-- Seed wallets if empty
insert into wallets (type, balance)
  values ('cash', 0), ('online', 0)
  on conflict (type) do nothing;

-- TRANSFERS
create table if not exists transfers (
  id         uuid default gen_random_uuid() primary key,
  from_type  text not null,
  to_type    text not null,
  amount     numeric not null,
  note       text default '',
  created_at timestamptz default now()
);

-- LOANS
create table if not exists loans (
  id           uuid default gen_random_uuid() primary key,
  person_name  text not null,
  amount       numeric not null,
  type         text not null,
  date         date not null,
  due_date     date,
  note         text default '',
  status       text default 'pending',
  payment_mode text default 'cash',
  created_at   timestamptz default now()
);

-- ============================================
-- Enable RLS on all tables
-- ============================================
alter table expenses  enable row level security;
alter table income    enable row level security;
alter table recurring enable row level security;
alter table budgets   enable row level security;
alter table wallets   enable row level security;
alter table transfers enable row level security;
alter table loans     enable row level security;

-- Drop old policies
drop policy if exists "allow all" on expenses;
drop policy if exists "allow all" on income;
drop policy if exists "allow all" on recurring;
drop policy if exists "allow all" on budgets;
drop policy if exists "allow all" on wallets;
drop policy if exists "allow all" on transfers;
drop policy if exists "allow all" on loans;

-- Allow all operations (for personal use)
create policy "allow all" on expenses  for all using (true) with check (true);
create policy "allow all" on income    for all using (true) with check (true);
create policy "allow all" on recurring for all using (true) with check (true);
create policy "allow all" on budgets   for all using (true) with check (true);
create policy "allow all" on wallets   for all using (true) with check (true);
create policy "allow all" on transfers for all using (true) with check (true);
create policy "allow all" on loans     for all using (true) with check (true);
