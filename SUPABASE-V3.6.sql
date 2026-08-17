-- ============================================================
-- ENIGMA OS V3.6
-- Base interna de compatibilidade de películas
-- ============================================================

create table if not exists public.pelicula_grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  marca text,
  modelos jsonb not null default '[]'::jsonb,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pelicula_grupos_nome_idx
  on public.pelicula_grupos (lower(nome));

create index if not exists pelicula_grupos_marca_idx
  on public.pelicula_grupos (lower(marca));

create index if not exists pelicula_grupos_modelos_gin_idx
  on public.pelicula_grupos using gin (modelos);

alter table public.pelicula_grupos enable row level security;

drop policy if exists "pelicula_grupos_select" on public.pelicula_grupos;
drop policy if exists "pelicula_grupos_insert" on public.pelicula_grupos;
drop policy if exists "pelicula_grupos_update" on public.pelicula_grupos;

create policy "pelicula_grupos_select"
on public.pelicula_grupos
for select
to anon, authenticated
using (true);

create policy "pelicula_grupos_insert"
on public.pelicula_grupos
for insert
to anon, authenticated
with check (true);

create policy "pelicula_grupos_update"
on public.pelicula_grupos
for update
to anon, authenticated
using (true)
with check (true);

grant select, insert, update
on public.pelicula_grupos
to anon, authenticated;

select id,nome,marca,modelos,ativo
from public.pelicula_grupos
order by marca,nome;
