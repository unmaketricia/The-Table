
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000101','authenticated','authenticated','owner-a@test.invalid',now(),now(),now()),
 ('00000000-0000-4000-8000-000000000102','authenticated','authenticated','owner-b@test.invalid',now(),now(),now());
set local role service_role;
select public.table_record_event('{"event_id":"evt_test_a","event_type":"transaction.completed","data":{"id":"txn_test_a","status":"completed","custom_data":{"table_user_id":"00000000-0000-4000-8000-000000000101"},"items":[{"price":{"id":"pri_01m7k57ckk7x3gx2wgw2ymzymb"}}]}}'::jsonb);
select public.table_record_event('{"event_id":"evt_test_a","event_type":"transaction.completed","data":{"id":"txn_test_a","status":"completed","custom_data":{"table_user_id":"00000000-0000-4000-8000-000000000101"},"items":[{"price":{"id":"pri_01m7k57ckk7x3gx2wgw2ymzymb"}}]}}'::jsonb);
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000101',true);
set local role authenticated;
select public.table_account();
select public.table_apply((select id from public.table_households where owner_id=auth.uid()),0,'[{"id":"test-meal","kind":"meal","name":"Private test"}]'::jsonb,array[]::text[]);
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000102',true);
set local role authenticated;
do $$ begin if (select count(*) from public.table_entries)<>0 then raise exception 'Cross-household data leak';end if;end $$;
select public.table_account();
reset role;
do $$ begin
 if (select count(*) from public.table_purchases where transaction_id='txn_test_a')<>1 then raise exception 'Duplicate purchase';end if;
 if (select count(*) from public.table_entries where id='test-meal')<>1 then raise exception 'Save failed';end if;
end $$;
rollback;
