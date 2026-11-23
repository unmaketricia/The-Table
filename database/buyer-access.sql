
create table public.table_households (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references auth.users(id) on delete cascade,
 paid boolean not null default false,
 revision bigint not null default 0
);
create table public.table_members (
 household_id uuid not null references public.table_households(id) on delete cascade,
 user_id uuid primary key references auth.users(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade
);
create table public.table_entries (
 household_id uuid not null references public.table_households(id) on delete cascade,
 id text not null, kind text not null check(kind in ('meal','breakfast','grocery','inventory')),
 payload jsonb not null, primary key(household_id,id)
);
create table public.table_purchases (
 transaction_id text primary key,
 owner_id uuid not null references auth.users(id),
 active boolean not null,
 created_at timestamptz not null default now()
);
create table public.table_revocations (transaction_id text primary key);
create table public.table_webhook_events (event_id text primary key, created_at timestamptz not null default now());
create table public.table_invitations (
 token_hash text primary key, household_id uuid not null references public.table_households(id) on delete cascade,
 owner_id uuid not null references auth.users(id), email text not null,
 expires_at timestamptz not null default now()+interval '7 days',
 unique(household_id,email)
);
alter table public.table_households enable row level security;
alter table public.table_members enable row level security;
alter table public.table_entries enable row level security;
alter table public.table_purchases enable row level security;
alter table public.table_revocations enable row level security;
alter table public.table_webhook_events enable row level security;
alter table public.table_invitations enable row level security;
revoke all on public.table_households,public.table_members,public.table_entries,public.table_purchases,public.table_revocations,public.table_webhook_events,public.table_invitations from anon,authenticated;
grant select on public.table_households,public.table_members,public.table_entries to authenticated;
grant insert(owner_id) on public.table_households to authenticated;
grant update(revision) on public.table_households to authenticated;
grant insert,update,delete on public.table_entries to authenticated;
grant all on public.table_households,public.table_members,public.table_entries,public.table_purchases,public.table_revocations,public.table_webhook_events,public.table_invitations to service_role;
create policy household_read on public.table_households for select to authenticated using (
 owner_id=(select auth.uid()) or id in(select household_id from public.table_members where user_id=(select auth.uid()))
);
create policy household_create on public.table_households for insert to authenticated with check(owner_id=(select auth.uid()) and not paid);
create policy household_revision on public.table_households for update to authenticated using (
 owner_id=(select auth.uid()) or id in(select household_id from public.table_members where user_id=(select auth.uid()))
) with check(owner_id=(select auth.uid()) or id in(select household_id from public.table_members where user_id=(select auth.uid())));
create policy members_read on public.table_members for select to authenticated using(user_id=(select auth.uid()) or owner_id=(select auth.uid()));
create policy entries_access on public.table_entries for all to authenticated using(
 exists(select 1 from public.table_households h where h.id=table_entries.household_id and h.paid and (h.owner_id=(select auth.uid()) or exists(select 1 from public.table_members m where m.household_id=h.id and m.user_id=(select auth.uid()))))
) with check(exists(select 1 from public.table_households h where h.id=table_entries.household_id and h.paid and (h.owner_id=(select auth.uid()) or exists(select 1 from public.table_members m where m.household_id=h.id and m.user_id=(select auth.uid())))));

create function public.table_account() returns jsonb language plpgsql security invoker set search_path='' as $$
declare h public.table_households;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 -- Avoid INSERT ON CONFLICT, which would require wider column privileges.
 if not exists(select 1 from public.table_households where owner_id=auth.uid()) then
   begin
     insert into public.table_households(owner_id) values(auth.uid());
   exception when unique_violation then null;
   end;
 end if;
 select hh.* into h from public.table_households hh join public.table_members m on m.household_id=hh.id where m.user_id=auth.uid() and hh.paid limit 1;
 if h.id is null then select * into h from public.table_households where owner_id=auth.uid(); end if;
 return jsonb_build_object('householdId',h.id,'paid',h.paid,'owner',h.owner_id=auth.uid(),'revision',h.revision,
  'members',coalesce((select jsonb_agg(jsonb_build_object('userId',m.user_id)) from public.table_members m where m.household_id=h.id),'[]'::jsonb));
end $$;
create function public.table_snapshot(p_household uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v bigint; entries jsonb;
begin
 select revision into v from public.table_households where id=p_household and paid and (owner_id=auth.uid() or exists(select 1 from public.table_members m where m.household_id=p_household and m.user_id=auth.uid()));
 if v is null then raise exception 'Purchase access required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(payload),'[]'::jsonb) into entries from public.table_entries where household_id=p_household;
 return jsonb_build_object('revision',v,'entries',entries);
end $$;
create function public.table_apply(p_household uuid,p_revision bigint,p_changed jsonb,p_deleted text[]) returns void language plpgsql security invoker set search_path='' as $$
declare v bigint; e jsonb;
begin
 select revision into v from public.table_households where id=p_household and paid and (owner_id=auth.uid() or exists(select 1 from public.table_members m where m.household_id=p_household and m.user_id=auth.uid())) for update;
 if v is null then raise exception 'Purchase access required' using errcode='42501'; end if;
 if v<>p_revision then raise exception 'Entries changed. Refresh and try again.' using errcode='40001'; end if;
 if jsonb_array_length(p_changed)>400 or coalesce(array_length(p_deleted,1),0)>200 then raise exception 'Too many entries'; end if;
 delete from public.table_entries where household_id=p_household and id=any(p_deleted);
 for e in select value from jsonb_array_elements(p_changed) loop
   insert into public.table_entries(household_id,id,kind,payload) values(p_household,e->>'id',e->>'kind',e)
   on conflict(household_id,id) do update set kind=excluded.kind,payload=excluded.payload;
 end loop;
 update public.table_households set revision=revision+1 where id=p_household;
end $$;
create function public.table_record_event(p_event jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare d jsonb:=p_event->'data'; typ text:=p_event->>'event_type'; tx text; u uuid;
begin
 if exists(select 1 from public.table_webhook_events where event_id=p_event->>'event_id') then return; end if;
 if typ='transaction.completed' then
  if d->>'status'<>'completed' or not exists(select 1 from jsonb_array_elements(d->'items') i where i->'price'->>'id'='pri_01m7k57ckk7x3gx2wgw2ymzymb') then return; end if;
  u:=(d->'custom_data'->>'table_user_id')::uuid;
  if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'Verified buyer account missing'; end if;
  tx:=d->>'id';
  perform pg_advisory_xact_lock(hashtextextended(tx,0));
  insert into public.table_purchases(transaction_id,owner_id,active) values(tx,u,not exists(select 1 from public.table_revocations where transaction_id=tx))
   on conflict(transaction_id) do nothing;
  insert into public.table_households(owner_id,paid) values(u,true) on conflict(owner_id) do nothing;
 elsif typ in('adjustment.created','adjustment.updated') and d->>'status'='approved' and
  ((d->>'action'='refund' and d->>'type'='full') or d->>'action'='chargeback') then
  tx:=d->>'transaction_id';
  perform pg_advisory_xact_lock(hashtextextended(tx,0));
  insert into public.table_revocations values(tx) on conflict do nothing;
  update public.table_purchases set active=false where transaction_id=tx returning owner_id into u;
 else return;
 end if;
 if u is not null then
  perform pg_advisory_xact_lock(hashtextextended(u::text,1));
  update public.table_households set paid=exists(select 1 from public.table_purchases p where p.owner_id=u and p.active) where owner_id=u;
 end if;
 insert into public.table_webhook_events(event_id) values(p_event->>'event_id') on conflict do nothing;
end $$;

create function public.table_manage_members(p_actor uuid,p_action text,p_email text default '',p_hash text default '',p_user uuid default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare h public.table_households; inv public.table_invitations; verified_email text; seats integer;
begin
 select lower(email) into verified_email from auth.users where id=p_actor and email_confirmed_at is not null;
 if verified_email is null then raise exception 'Verify your email first'; end if;
 if p_action='accept' then
  select * into inv from public.table_invitations where token_hash=p_hash and expires_at>now();
  if inv.token_hash is null or inv.email<>verified_email then raise exception 'Invitation is invalid or belongs to another email'; end if;
  select * into h from public.table_households where id=inv.household_id for update;
 else
  select * into h from public.table_households where owner_id=p_actor for update;
 end if;
 if h.id is null or not h.paid then raise exception 'An active purchase is required'; end if;
 if p_action='invite' then
  delete from public.table_invitations where household_id=h.id and expires_at<=now();
  select (select count(*) from public.table_members where household_id=h.id)+(select count(*) from public.table_invitations where household_id=h.id) into seats;
  if seats>=3 and not exists(select 1 from public.table_invitations where household_id=h.id and email=lower(trim(p_email))) then raise exception 'Your household already has four users or reserved invitations'; end if;
  if lower(trim(p_email))=verified_email then raise exception 'You already own this household'; end if;
  insert into public.table_invitations(token_hash,household_id,owner_id,email) values(p_hash,h.id,p_actor,lower(trim(p_email)))
   on conflict(household_id,email) do update set token_hash=excluded.token_hash,expires_at=now()+interval '7 days';
 elsif p_action='accept' then
  if h.owner_id=p_actor then raise exception 'You already own this household'; end if;
  if exists(select 1 from public.table_households where owner_id=p_actor and paid) then raise exception 'You already own an active Table'; end if;
  select count(*) into seats from public.table_members where household_id=h.id;
  if seats>=3 then raise exception 'Your household already has four users'; end if;
  insert into public.table_members(household_id,user_id,owner_id) values(h.id,p_actor,h.owner_id);
  delete from public.table_invitations where token_hash=p_hash;
 elsif p_action='remove' then
  delete from public.table_members where household_id=h.id and user_id=p_user;
 else raise exception 'Invalid action';
 end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.table_account(),public.table_snapshot(uuid),public.table_apply(uuid,bigint,jsonb,text[]),public.table_record_event(jsonb),public.table_manage_members(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.table_account(),public.table_snapshot(uuid),public.table_apply(uuid,bigint,jsonb,text[]) to authenticated;
grant execute on function public.table_record_event(jsonb),public.table_manage_members(uuid,text,text,text,uuid) to service_role;

grant select(id,email,email_confirmed_at) on auth.users to service_role;
