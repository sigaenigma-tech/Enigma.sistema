-- ENIGMA OS V4.4.4 — ATRIBUIÇÃO DE VENDAS
-- Execute antes de publicar a V4.4.4.

alter table public.vendas
  add column if not exists vendedor_id uuid null references auth.users(id) on delete set null,
  add column if not exists vendedor_nome text null;

create index if not exists vendas_vendedor_id_idx on public.vendas(vendedor_id);
create index if not exists vendas_timestamp_vendedor_idx on public.vendas(timestamp, vendedor_id);

-- Vendas antigas continuarão aparecendo no ranking como "Sem vendedor identificado".
-- Novas vendas passam a gravar automaticamente o usuário autenticado.
