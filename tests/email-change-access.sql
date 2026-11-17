begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000401','authenticated','authenticated','email-owner-old@test.invalid',now(),now(),now()),
 ('00000000-0000-4000-8000-000000000402','authenticated','authenticated','email-member-old@test.invalid',now(),now(),now());
set local role service_role;
select public.table_record_event('{"event_id":"evt_email_customer","event_type":"customer.created","occurred_at":"2026-11-17T00:00:00Z","data":{"id":"ctm_email_change","email":"email-owner-old@test.invalid"}}');
select public.table_record_event('{"event_id":"evt_email_purchase","event_type":"transaction.completed","data":{"id":"txn_email_change","status":"completed","customer_id":"ctm_email_change","items":[{"price":{"id":"pri_01m7k57ckk7x3gx2wgw2ymzymb"}}]}}');
reset role;
select set_config('test.email_household',(select id::text from public.table_households where owner_id='00000000-0000-4000-8000-000000000401'),true);
insert into public.table_members(household_id,user_id,owner_id) values(current_setting('test.email_household')::uuid,'00000000-0000-4000-8000-000000000402','00000000-0000-4000-8000-000000000401');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000401',true);
set local role authenticated;
select public.table_apply(current_setting('test.email_household')::uuid,0,'[{"id":"email-change-private-entry","kind":"grocery","name":"Saved grocery"}]'::jsonb,array[]::text[]);
reset role;
-- Simulate completed, verified changes; the application never edits auth.users directly.
update auth.users set email='email-owner-new@test.invalid' where id='00000000-0000-4000-8000-000000000401';
update auth.users set email='email-member-new@test.invalid' where id='00000000-0000-4000-8000-000000000402';
set local role service_role;
select public.table_claim_purchases('00000000-0000-4000-8000-000000000401');
-- A later billing webhook still contains the original checkout email.
select public.table_record_event('{"event_id":"evt_email_customer_again","event_type":"customer.updated","occurred_at":"2026-11-17T01:00:00Z","data":{"id":"ctm_email_change","email":"email-owner-old@test.invalid"}}');
reset role;
do $$ begin
 if not exists(select 1 from public.table_purchases where transaction_id='txn_email_change' and owner_id='00000000-0000-4000-8000-000000000401' and active) then raise exception 'Email change lost purchase ownership';end if;
 if not exists(select 1 from public.table_households where id=current_setting('test.email_household')::uuid and paid) then raise exception 'Email change removed paid access';end if;
 if not exists(select 1 from public.table_members where household_id=current_setting('test.email_household')::uuid and user_id='00000000-0000-4000-8000-000000000402') then raise exception 'Email change removed membership';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000402',true);
set local role authenticated;
do $$ begin
 if (public.table_account()->>'householdId')::uuid<>current_setting('test.email_household')::uuid then raise exception 'Changed member email opened a different household';end if;
 if not exists(select 1 from public.table_entries where id='email-change-private-entry') then raise exception 'Email change lost household entries';end if;
end $$;
reset role;
-- Reusing the old address cannot transfer the claimed purchase to a different account.
insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at) values('00000000-0000-4000-8000-000000000403','authenticated','authenticated','email-owner-old@test.invalid',now(),now(),now());
set local role service_role;
select public.table_claim_purchases('00000000-0000-4000-8000-000000000403');
reset role;
do $$ begin
 if exists(select 1 from public.table_purchases where owner_id='00000000-0000-4000-8000-000000000403') then raise exception 'Old email address transferred purchase ownership';end if;
end $$;
rollback;
