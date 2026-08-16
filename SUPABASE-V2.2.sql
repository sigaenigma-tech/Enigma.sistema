-- ENIGMA OS V2.2
-- Cria o bucket para as fotos da OS. Os dados estruturados da V2.2 continuam
-- usando as colunas JSON já existentes para manter compatibilidade com a V2.1.

insert into storage.buckets (id, name, public)
values ('os-fotos', 'os-fotos', true)
on conflict (id) do update set public = true;

-- Políticas temporárias para o sistema atual, que ainda não possui autenticação.
-- Quando a autenticação for implementada, estas políticas devem ser restringidas.
drop policy if exists "os-fotos leitura publica" on storage.objects;
drop policy if exists "os-fotos inserir anon" on storage.objects;
drop policy if exists "os-fotos atualizar anon" on storage.objects;
drop policy if exists "os-fotos excluir anon" on storage.objects;

create policy "os-fotos leitura publica"
on storage.objects for select
using (bucket_id = 'os-fotos');

create policy "os-fotos inserir anon"
on storage.objects for insert
to anon
with check (bucket_id = 'os-fotos');

create policy "os-fotos atualizar anon"
on storage.objects for update
to anon
using (bucket_id = 'os-fotos')
with check (bucket_id = 'os-fotos');

create policy "os-fotos excluir anon"
on storage.objects for delete
to anon
using (bucket_id = 'os-fotos');
