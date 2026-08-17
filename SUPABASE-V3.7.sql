-- ============================================================
-- ENIGMA OS V3.7
-- Vínculo manual Tabela de Películas <-> Estoque
-- ============================================================

create table if not exists public.pelicula_estoque_links (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.pelicula_grupos(id) on delete cascade,
  estoque_id uuid not null references public.estoque(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (grupo_id, estoque_id)
);

create index if not exists pelicula_estoque_links_grupo_idx on public.pelicula_estoque_links(grupo_id);
create index if not exists pelicula_estoque_links_estoque_idx on public.pelicula_estoque_links(estoque_id);

alter table public.pelicula_estoque_links enable row level security;

drop policy if exists "pelicula_estoque_links_select" on public.pelicula_estoque_links;
drop policy if exists "pelicula_estoque_links_insert" on public.pelicula_estoque_links;
drop policy if exists "pelicula_estoque_links_delete" on public.pelicula_estoque_links;

create policy "pelicula_estoque_links_select" on public.pelicula_estoque_links for select to anon, authenticated using (true);
create policy "pelicula_estoque_links_insert" on public.pelicula_estoque_links for insert to anon, authenticated with check (true);
create policy "pelicula_estoque_links_delete" on public.pelicula_estoque_links for delete to anon, authenticated using (true);

grant select, insert, delete on public.pelicula_estoque_links to anon, authenticated;
