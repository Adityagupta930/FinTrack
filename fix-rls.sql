-- Drop all old policies
drop policy if exists "allow all" on expenses;
drop policy if exists "allow all" on income;
drop policy if exists "allow all" on recurring;
drop policy if exists "allow all" on budgets;
drop policy if exists "allow all" on wallets;
drop policy if exists "allow all" on transfers;

-- Recreate with proper permissions
create policy "allow all" on expenses  for all to anon, authenticated using (true) with check (true);
create policy "allow all" on income    for all to anon, authenticated using (true) with check (true);
create policy "allow all" on recurring for all to anon, authenticated using (true) with check (true);
create policy "allow all" on budgets   for all to anon, authenticated using (true) with check (true);
create policy "allow all" on wallets   for all to anon, authenticated using (true) with check (true);
create policy "allow all" on transfers for all to anon, authenticated using (true) with check (true);
