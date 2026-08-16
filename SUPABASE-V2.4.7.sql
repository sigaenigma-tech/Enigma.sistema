-- ENIGMA OS V2.4.7 — Estoque de Seminovos
-- Execute uma única vez no SQL Editor do Supabase.

create table if not exists public.seminovos (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes_usados(id) on delete restrict,
  marca text not null default '',
  modelo text not null default '',
  armazenamento text not null default '',
  cor text not null default '',
  imei text not null default '',
  serial text not null default '',
  bateria numeric,
  custo_aquisicao numeric not null default 0,
  custo_reparos_previsto numeric not null default 0,
  status text not null default 'em_preparacao',
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seminovos_avaliacao_unique
on public.seminovos (avaliacao_id);

create unique index if not exists seminovos_imei_unique
on public.seminovos (imei)
where imei <> '';

create unique index if not exists seminovos_serial_unique
on public.seminovos (serial)
where serial <> '';

create index if not exists seminovos_status_idx
on public.seminovos (status);

alter table public.seminovos enable row level security;

drop policy if exists "seminovos_select" on public.seminovos;
drop policy if exists "seminovos_insert" on public.seminovos;
drop policy if exists "seminovos_update" on public.seminovos;

create policy "seminovos_select"
on public.seminovos for select
to anon, authenticated
using (true);

create policy "seminovos_insert"
on public.seminovos for insert
to anon, authenticated
with check (true);

create policy "seminovos_update"
on public.seminovos for update
to anon, authenticated
using (true)
with check (true);

grant select, insert, update on public.seminovos to anon, authenticated;
