
alter table public.table_purchases alter column owner_id drop not null;
alter table public.table_purchases add column customer_id text;
create index table_purchases_customer_idx on public.table_purchases(customer_id);
create index table_purchases_owner_idx on public.table_purchases(owner_id);
create table public.table_paddle_customers (
 id text primary key,
 email text not null,
 occurred_at timestamptz not null
);
alter table public.table_paddle_customers enable row level security;
revoke all on public.table_paddle_customers from public,anon,authenticated;
grant all on public.table_paddle_customers to service_role;

create function public.table_claim_purchases(p_user uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare verified_email text; active_access boolean;
begin
 select lower(email) into verified_email from auth.users where id=p_user and email_confirmed_at is not null;
 if verified_email is null then raise exception 'A verified account is required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,1));
 update public.table_purchases p set owner_id=p_user
 where p.owner_id is null and p.customer_id in(select c.id from public.table_paddle_customers c where c.email=verified_email);
 select exists(select 1 from public.table_purchases where owner_id=p_user and active) into active_access;
 if active_access then
  insert into public.table_households(owner_id,paid) values(p_user,true)
   on conflict(owner_id) do update set paid=true;
 else
  update public.table_households set paid=false where owner_id=p_user;
 end if;
 return active_access;
end $$;
revoke all on function public.table_claim_purchases(uuid) from public,anon,authenticated;
grant execute on function public.table_claim_purchases(uuid) to service_role;

create or replace function public.table_record_event(p_event jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare d jsonb:=p_event->'data'; typ text:=p_event->>'event_type'; tx text; u uuid; cust text; buyer_email text;
begin
 if exists(select 1 from public.table_webhook_events where event_id=p_event->>'event_id') then return;end if;
 if typ in('customer.created','customer.updated') then
  if d->>'id' is null or d->>'email' is null then return;end if;
  perform pg_advisory_xact_lock(hashtextextended(d->>'id',2));
  insert into public.table_paddle_customers(id,email,occurred_at)
   values(d->>'id',lower(trim(d->>'email')),(p_event->>'occurred_at')::timestamptz)
   on conflict(id) do update set email=excluded.email,occurred_at=excluded.occurred_at
   where excluded.occurred_at>=public.table_paddle_customers.occurred_at;
  select email into buyer_email from public.table_paddle_customers where id=d->>'id';
 elsif typ='transaction.completed' then
  if d->>'status'<>'completed' or not exists(
    select 1 from jsonb_array_elements(d->'items') i where i->'price'->>'id'='pri_01m7k57ckk7x3gx2wgw2ymzymb'
  ) then return;end if;
  tx:=d->>'id';cust:=d->>'customer_id';
  if tx is null or cust is null then raise exception 'Payment customer missing';end if;
  perform pg_advisory_xact_lock(hashtextextended(tx,0));
  insert into public.table_purchases(transaction_id,customer_id,active)
   values(tx,cust,not exists(select 1 from public.table_revocations where transaction_id=tx))
   on conflict(transaction_id) do nothing;
  select c.email into buyer_email from public.table_paddle_customers c where c.id=cust;
 elsif typ in('adjustment.created','adjustment.updated') and d->>'status'='approved' and
  ((d->>'action'='refund' and d->>'type'='full') or d->>'action'='chargeback') then
  tx:=d->>'transaction_id';
  perform pg_advisory_xact_lock(hashtextextended(tx,0));
  insert into public.table_revocations values(tx) on conflict do nothing;
  update public.table_purchases set active=false where transaction_id=tx returning owner_id into u;
  if u is not null then perform public.table_claim_purchases(u);end if;
 else return;
 end if;
 if buyer_email is not null then
  for u in select id from auth.users where lower(email)=buyer_email and email_confirmed_at is not null loop
   perform public.table_claim_purchases(u);
  end loop;
 end if;
 insert into public.table_webhook_events(event_id) values(p_event->>'event_id') on conflict do nothing;
end $$;
revoke all on function public.table_record_event(jsonb) from public,anon,authenticated;
grant execute on function public.table_record_event(jsonb) to service_role;
