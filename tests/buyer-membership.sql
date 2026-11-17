
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at)
select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','buyer-'||n||'@test.invalid',now(),now(),now() from generate_series(201,206) n;
set local role service_role;
select public.table_record_event('{"event_id":"evt_test_member_customer","event_type":"customer.created","occurred_at":"2026-11-17T00:00:00Z","data":{"id":"ctm_test_house","email":"buyer-201@test.invalid"}}');
select public.table_record_event('{"event_id":"evt_test_house","event_type":"transaction.completed","data":{"id":"txn_test_house","status":"completed","customer_id":"ctm_test_house","custom_data":{"table_user_id":"00000000-0000-4000-8000-000000000201"},"items":[{"price":{"id":"pri_01m7k57ckk7x3gx2wgw2ymzymb"}}]}}');
select public.table_manage_members('00000000-0000-4000-8000-000000000201','invite','buyer-202@test.invalid','hash-202');
select public.table_manage_members('00000000-0000-4000-8000-000000000202','accept','','hash-202');
select public.table_manage_members('00000000-0000-4000-8000-000000000201','invite','buyer-203@test.invalid','hash-203');
select public.table_manage_members('00000000-0000-4000-8000-000000000203','accept','','hash-203');
select public.table_manage_members('00000000-0000-4000-8000-000000000201','invite','buyer-204@test.invalid','hash-204');
select public.table_manage_members('00000000-0000-4000-8000-000000000204','accept','','hash-204');
do $$ begin
 begin perform public.table_manage_members('00000000-0000-4000-8000-000000000201','invite','buyer-205@test.invalid','hash-205');
 raise exception 'Seat limit test failed';
 exception when others then if sqlerrm<>'Your household already has four users or reserved invitations' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000202',true);
set local role authenticated;
do $$ declare a jsonb;begin a:=public.table_account();if not (a->>'paid')::boolean or (a->>'owner')::boolean then raise exception 'Invited member access failed';end if;end $$;
reset role;
set local role service_role;
select public.table_record_event('{"event_id":"evt_test_refund","event_type":"adjustment.updated","data":{"transaction_id":"txn_test_house","action":"refund","status":"approved","type":"full"}}');
select public.table_record_event('{"event_id":"evt_test_old_complete","event_type":"transaction.completed","data":{"id":"txn_test_house","status":"completed","customer_id":"ctm_test_house","custom_data":{"table_user_id":"00000000-0000-4000-8000-000000000201"},"items":[{"price":{"id":"pri_01m7k57ckk7x3gx2wgw2ymzymb"}}]}}');
reset role;
do $$ begin if exists(select 1 from public.table_households where owner_id='00000000-0000-4000-8000-000000000201' and paid)then raise exception 'Refund access test failed';end if;end $$;
rollback;
