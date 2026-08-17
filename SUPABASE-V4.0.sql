-- ENIGMA OS V4.0
-- Liga permanentemente a OS ao cadastro único de clientes.
alter table public.ordens_servico
  add column if not exists cliente_id uuid null;

create index if not exists ordens_servico_cliente_id_idx
  on public.ordens_servico (cliente_id);
