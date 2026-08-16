-- ENIGMA OS V2.4.3 — Price Engine
-- Execute uma única vez no SQL Editor do Supabase.

create table if not exists public.referencias_mercado (
  id uuid primary key default gen_random_uuid(),
  marca text not null,
  modelo text not null,
  armazenamento text not null default '',
  mercado_min numeric not null default 0,
  mercado_max numeric not null default 0,
  fonte text not null default 'Base ENIGMA',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists referencias_mercado_modelo_idx
on public.referencias_mercado (lower(marca), lower(modelo), lower(armazenamento));

alter table public.referencias_mercado enable row level security;

drop policy if exists "referencias_mercado_select" on public.referencias_mercado;
drop policy if exists "referencias_mercado_insert" on public.referencias_mercado;
drop policy if exists "referencias_mercado_update" on public.referencias_mercado;

create policy "referencias_mercado_select"
on public.referencias_mercado for select
to anon, authenticated
using (true);

create policy "referencias_mercado_insert"
on public.referencias_mercado for insert
to anon, authenticated
with check (true);

create policy "referencias_mercado_update"
on public.referencias_mercado for update
to anon, authenticated
using (true)
with check (true);

grant select, insert, update on public.referencias_mercado to anon, authenticated;
