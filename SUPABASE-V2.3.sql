-- ENIGMA OS V2.3
-- Assinatura externa por link/QR Code com token temporário.
-- Execute no Supabase > SQL Editor antes de publicar a V2.3.

create extension if not exists pgcrypto;

create table if not exists public.os_assinaturas_publicas (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  os_id text not null,
  tipo text not null check (tipo in ('entrada','retirada')),
  snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pendente' check (status in ('pendente','concluido','cancelado')),
  nome_aceite text,
  assinatura_data_url text,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '2 hours'),
  concluido_em timestamptz
);

alter table public.os_assinaturas_publicas enable row level security;
revoke all on public.os_assinaturas_publicas from anon, authenticated;

-- O sistema atual ainda não possui autenticação. Estas RPCs expõem somente ações
-- baseadas em token aleatório e não liberam acesso direto à tabela.
create or replace function public.enigma_criar_assinatura(
  p_os_id text,
  p_tipo text,
  p_snapshot jsonb
)
returns table(token text, status text, expira_em timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_expira timestamptz;
begin
  if p_tipo not in ('entrada','retirada') then
    raise exception 'Tipo de assinatura inválido';
  end if;

  update public.os_assinaturas_publicas
     set status = 'cancelado'
   where os_id = p_os_id and tipo = p_tipo and status = 'pendente';

  insert into public.os_assinaturas_publicas(os_id, tipo, snapshot)
  values (p_os_id, p_tipo, coalesce(p_snapshot, '{}'::jsonb))
  returning os_assinaturas_publicas.token, os_assinaturas_publicas.expira_em
       into v_token, v_expira;

  return query select v_token::text, 'pendente'::text, v_expira;
end;
$$;

create or replace function public.enigma_obter_assinatura(p_token text)
returns table(token text, tipo text, snapshot jsonb, status text, expira_em timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.token::text, a.tipo, a.snapshot, a.status, a.expira_em
  from public.os_assinaturas_publicas a
  where a.token::text = p_token
    and a.status in ('pendente','concluido')
    and (a.status = 'concluido' or a.expira_em > now())
  limit 1;
$$;

create or replace function public.enigma_concluir_assinatura(
  p_token text,
  p_nome text,
  p_assinatura text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(p_nome),'') = '' or coalesce(p_assinatura,'') = '' then
    raise exception 'Nome e assinatura são obrigatórios';
  end if;

  update public.os_assinaturas_publicas
     set status = 'concluido',
         nome_aceite = trim(p_nome),
         assinatura_data_url = p_assinatura,
         concluido_em = now()
   where token::text = p_token
     and status = 'pendente'
     and expira_em > now();

  if not found then
    raise exception 'Link inválido, expirado ou já utilizado';
  end if;

  return true;
end;
$$;

create or replace function public.enigma_status_assinatura(p_token text)
returns table(
  token text,
  status text,
  nome_aceite text,
  assinatura_data_url text,
  concluido_em timestamptz,
  expira_em timestamptz
)
language sql
security definer
set search_path = public
as $$
  select a.token::text, a.status, a.nome_aceite, a.assinatura_data_url, a.concluido_em, a.expira_em
  from public.os_assinaturas_publicas a
  where a.token::text = p_token
  limit 1;
$$;

grant execute on function public.enigma_criar_assinatura(text,text,jsonb) to anon, authenticated;
grant execute on function public.enigma_obter_assinatura(text) to anon, authenticated;
grant execute on function public.enigma_concluir_assinatura(text,text,text) to anon, authenticated;
grant execute on function public.enigma_status_assinatura(text) to anon, authenticated;

-- Aprovação externa de orçamento por link/WhatsApp
create table if not exists public.os_aprovacoes_orcamento (
  id uuid primary key default gen_random_uuid(), token uuid not null unique default gen_random_uuid(), os_id text not null,
  snapshot jsonb not null default '{}'::jsonb, status text not null default 'pendente' check (status in ('pendente','aprovado','recusado','cancelado')),
  nome_aceite text, criado_em timestamptz not null default now(), expira_em timestamptz not null default (now()+interval '48 hours'), decidido_em timestamptz
);
alter table public.os_aprovacoes_orcamento enable row level security;
revoke all on public.os_aprovacoes_orcamento from anon, authenticated;
create or replace function public.enigma_criar_aprovacao_orcamento(p_os_id text,p_snapshot jsonb)
returns table(token text,status text,expira_em timestamptz) language plpgsql security definer set search_path=public as $$
declare v_token uuid; v_expira timestamptz; begin
 update public.os_aprovacoes_orcamento set status='cancelado' where os_id=p_os_id and status='pendente';
 insert into public.os_aprovacoes_orcamento(os_id,snapshot) values(p_os_id,coalesce(p_snapshot,'{}'::jsonb)) returning os_aprovacoes_orcamento.token,os_aprovacoes_orcamento.expira_em into v_token,v_expira;
 return query select v_token::text,'pendente'::text,v_expira; end; $$;
create or replace function public.enigma_obter_aprovacao_orcamento(p_token text)
returns table(token text,snapshot jsonb,status text,expira_em timestamptz) language sql security definer set search_path=public as $$
 select a.token::text,a.snapshot,a.status,a.expira_em from public.os_aprovacoes_orcamento a where a.token::text=p_token and a.status in('pendente','aprovado','recusado') and (a.status<>'pendente' or a.expira_em>now()) limit 1; $$;
create or replace function public.enigma_decidir_aprovacao_orcamento(p_token text,p_nome text,p_decisao text)
returns boolean language plpgsql security definer set search_path=public as $$ begin
 if p_decisao not in('aprovado','recusado') then raise exception 'Decisão inválida'; end if;
 if coalesce(trim(p_nome),'')='' then raise exception 'Nome obrigatório'; end if;
 update public.os_aprovacoes_orcamento set status=p_decisao,nome_aceite=trim(p_nome),decidido_em=now() where token::text=p_token and status='pendente' and expira_em>now();
 if not found then raise exception 'Link inválido, expirado ou já utilizado'; end if; return true; end; $$;
create or replace function public.enigma_status_aprovacao_orcamento(p_token text)
returns table(token text,status text,nome_aceite text,decidido_em timestamptz,expira_em timestamptz) language sql security definer set search_path=public as $$
 select a.token::text,a.status,a.nome_aceite,a.decidido_em,a.expira_em from public.os_aprovacoes_orcamento a where a.token::text=p_token limit 1; $$;
grant execute on function public.enigma_criar_aprovacao_orcamento(text,jsonb) to anon,authenticated;
grant execute on function public.enigma_obter_aprovacao_orcamento(text) to anon,authenticated;
grant execute on function public.enigma_decidir_aprovacao_orcamento(text,text,text) to anon,authenticated;
grant execute on function public.enigma_status_aprovacao_orcamento(text) to anon,authenticated;
