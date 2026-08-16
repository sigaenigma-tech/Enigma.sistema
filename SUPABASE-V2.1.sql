-- ENIGMA OS V2.1
-- Execute no Supabase > SQL Editor antes de publicar a V2.1.

alter table public.ordens_servico
  add column if not exists diagnostico_tecnico text default '',
  add column if not exists orcamento jsonb default '{"status":"rascunho","desconto":0}'::jsonb,
  add column if not exists entrega jsonb default '{"garantiaDias":90,"observacoes":""}'::jsonb,
  add column if not exists acessorios_recebidos text default '',
  add column if not exists previsao_entrega date;

update public.ordens_servico
set
  diagnostico_tecnico = coalesce(diagnostico_tecnico, ''),
  orcamento = coalesce(orcamento, '{"status":"rascunho","desconto":0}'::jsonb),
  entrega = coalesce(entrega, '{"garantiaDias":90,"observacoes":""}'::jsonb),
  acessorios_recebidos = coalesce(acessorios_recebidos, '')
where diagnostico_tecnico is null
   or orcamento is null
   or entrega is null
   or acessorios_recebidos is null;
