-- Service-only welcome email delivery log. One welcome per checkout email.
create table if not exists public.table_welcome_outbox (
 email text primary key check(email=lower(trim(email))),
 transaction_id text not null references public.table_purchases(transaction_id),
 delivery_key uuid not null default gen_random_uuid(),
 created_at timestamptz not null default now(),
 sent_at timestamptz,
 provider_message_id text
);
alter table public.table_welcome_outbox enable row level security;
revoke all on public.table_welcome_outbox from public, anon, authenticated;
grant select,insert,update on public.table_welcome_outbox to service_role;
create or replace function public.table_welcome_queue()
returns table(email text,delivery_key uuid)
language plpgsql security invoker set search_path='' as $$
begin
 insert into public.table_welcome_outbox(email,transaction_id)
 select distinct on (lower(trim(c.email))) lower(trim(c.email)),p.transaction_id
 from public.table_purchases p join public.table_paddle_customers c on c.id=p.customer_id
 where p.active and c.email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
 order by lower(trim(c.email)),p.created_at,p.transaction_id
 on conflict do nothing;
 return query select w.email,w.delivery_key from public.table_welcome_outbox w
 where w.sent_at is null and exists (
  select 1 from public.table_purchases p join public.table_paddle_customers c on c.id=p.customer_id
  where p.active and lower(trim(c.email))=w.email
 ) order by w.created_at,w.email limit 20;
end $$;
create or replace function public.table_welcome_sent(p_email text,p_delivery_key uuid,p_message_id text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if coalesce(length(p_message_id),0)=0 then raise exception 'Missing provider message ID';end if;
 update public.table_welcome_outbox set sent_at=coalesce(sent_at,now()),provider_message_id=coalesce(provider_message_id,p_message_id)
 where email=p_email and delivery_key=p_delivery_key;
 if not found then raise exception 'Welcome delivery not found';end if;
end $$;
revoke all on function public.table_welcome_queue() from public,anon,authenticated;
revoke all on function public.table_welcome_sent(text,uuid,text) from public,anon,authenticated;
grant execute on function public.table_welcome_queue() to service_role;
grant execute on function public.table_welcome_sent(text,uuid,text) to service_role;
