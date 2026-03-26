-- Tabella per il logging delle operazioni di importazione
create table import_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  total_records integer not null default 0,
  successful_records integer not null default 0,
  failed_records integer not null default 0,
  errors text[] default '{}',
  warnings text[] default '{}',
  import_date timestamp with time zone default now() not null,
  status text not null check (status in ('completed', 'failed', 'partial'))
);

-- Abilita RLS
alter table import_logs enable row level security;

-- Politiche RLS
-- Gli utenti possono vedere solo i propri log di importazione
create policy "Users can view own import logs" on import_logs
  for select using (auth.uid() = user_id);

-- Gli utenti possono creare solo i propri log di importazione
create policy "Users can create own import logs" on import_logs
  for insert with check (auth.uid() = user_id);

-- Gli admin possono vedere tutti i log
create policy "Admins can view all import logs" on import_logs
  for select using (exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Crea indici per performance migliore
create index idx_import_logs_user_id on import_logs(user_id);
create index idx_import_logs_import_date on import_logs(import_date desc);
create index idx_import_logs_status on import_logs(status);

-- Concedi permessi ai ruoli anon e authenticated
grant select on import_logs to anon, authenticated;
grant insert on import_logs to authenticated;