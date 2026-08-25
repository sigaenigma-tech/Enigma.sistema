-- ENIGMA OS V4.5.3 — Modo Implantação / Venda Retroativa
-- Execute uma única vez no SQL Editor do Supabase.

alter table public.vendas add column if not exists retroativa boolean not null default false;
alter table public.vendas add column if not exists movimenta_estoque boolean not null default true;

-- Venda retroativa não pertence ao caixa operacional atual.
alter table public.vendas alter column caixa_id drop not null;

create index if not exists vendas_retroativa_timestamp_idx on public.vendas(retroativa, timestamp);
