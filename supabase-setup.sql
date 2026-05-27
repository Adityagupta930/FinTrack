-- Create all tables
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric not null,
  category text not null,
  date date not null,
  note text default '',
  tags text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists income (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric not null,
  category text default 'Other',
  date date not null,
  note text default '',
  created_at timestamptz default now()
);

create table if not exists recurring (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric not null,
  category text not null,
  day int not null,
  note text default '',
  last_added text default '',
  created_at timestamptz default now()
);

create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  category text unique not null,
  amount numeric not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table expenses  enable row level security;
alter table income    enable row level security;
alter table recurring enable row level security;
alter table budgets   enable row level security;

-- Drop old policies if exist
drop policy if exists "allow all" on expenses;
drop policy if exists "allow all" on income;
drop policy if exists "allow all" on recurring;
drop policy if exists "allow all" on budgets;

-- Allow all operations
create policy "allow all" on expenses  for all using (true) with check (true);
create policy "allow all" on income    for all using (true) with check (true);
create policy "allow all" on recurring for all using (true) with check (true);
create policy "allow all" on budgets   for all using (true) with check (true);
