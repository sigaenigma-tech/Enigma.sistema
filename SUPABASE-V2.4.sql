-- ENIGMA OS V2.4
-- Módulo: Avaliação e Compra de Aparelhos Usados
-- Execute uma única vez no SQL Editor do Supabase.

create table if not exists public.avaliacoes_usados (
  id uuid primary key default gen_random_uuid(),
  vendedor jsonb not null default '{}'::jsonb,
  aparelho jsonb not null default '{}'::jsonb,
  inspecao jsonb not null default '{}'::jsonb,
  testes jsonb not null default '{}'::jsonb,
  precificacao jsonb not null default '{}'::jsonb,
  oferta jsonb not null default '{}'::jsonb,
  aquisicao jsonb not null default '{}'::jsonb,
  etapa text not null default 'identificar',
  status text not null default 'avaliacao',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists avaliacoes_usados_created_at_idx
  on public.avaliacoes_usados (created_at desc);

create index if not exists avaliacoes_usados_status_idx
  on public.avaliacoes_usados (status);

alter table public.avaliacoes_usados enable row level security;

drop policy if exists "avaliacoes_usados_anon_select" on public.avaliacoes_usados;
drop policy if exists "avaliacoes_usados_anon_insert" on public.avaliacoes_usados;
drop policy if exists "avaliacoes_usados_anon_update" on public.avaliacoes_usados;
drop policy if exists "avaliacoes_usados_anon_delete" on public.avaliacoes_usados;

-- Compatibilidade com a arquitetura atual da ENIGMA.
-- Quando autenticação de usuários for implantada, estas políticas devem ser substituídas.
create policy "avaliacoes_usados_anon_select"
on public.avaliacoes_usados for select
to anon, authenticated
using (true);

create policy "avaliacoes_usados_anon_insert"
on public.avaliacoes_usados for insert
to anon, authenticated
with check (true);

create policy "avaliacoes_usados_anon_update"
on public.avaliacoes_usados for update
to anon, authenticated
using (true)
with check (true);

create policy "avaliacoes_usados_anon_delete"
on public.avaliacoes_usados for delete
to anon, authenticated
using (true);

grant select, insert, update, delete on public.avaliacoes_usados to anon, authenticated;
