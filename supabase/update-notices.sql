create extension if not exists pg_net with schema extensions;
create table public.table_update_notices (
 release_id text not null,
 email text not null,
 delivery_key uuid not null default gen_random_uuid(),
 sent_at timestamptz,
 provider_message_id text,
 primary key(release_id,email)
);
alter table public.table_update_notices enable row level security;
revoke all on public.table_update_notices from public,anon,authenticated;
grant select,insert,update on public.table_update_notices to service_role;
