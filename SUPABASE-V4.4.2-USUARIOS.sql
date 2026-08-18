-- ENIGMA OS V4.4.2
alter table public.enigma_usuarios add column if not exists username text;
create unique index if not exists enigma_usuarios_username_unique on public.enigma_usuarios (lower(username)) where username is not null;
-- Opcional para os admins antigos:
-- update public.enigma_usuarios set username='jaxcf' where email='jaxcf@hotmail.com';
-- update public.enigma_usuarios set username='paolla' where email='paollabaldissera89@gmail.com';
