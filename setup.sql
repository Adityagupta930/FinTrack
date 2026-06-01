-- Clear all data
truncate table expenses restart identity cascade;
truncate table income restart identity cascade;
truncate table recurring restart identity cascade;
truncate table budgets restart identity cascade;
truncate table transfers restart identity cascade;

-- Reset wallet balances
update wallets set balance = 0;

-- Create loans table
create table if not exists loans (
  id uuid default gen_random_uuid() primary key,
  person_name text not null,
  amount numeric not null,
  type text not null, -- 'given' (maine diya) or 'taken' (mujhe mila)
  date date not null,
  due_date date,
  note text default '',
  status text default 'pending', -- 'pending' or 'settled'
  payment_mode text default 'cash',
  created_at timestamptz default now()
);

alter table loans enable row level security;
drop policy if exists "allow all" on loans;
create policy "allow all" on loans for all to anon, authenticated using (true) with check (true);
