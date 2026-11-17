
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000301','authenticated','authenticated','guest-a@test.invalid',now(),now(),now()),
 ('00000000-0000-4000-8000-000000000302','authenticated','authenticated','guest-b@test.invalid',now(),now(),now()),
 ('00000000-0000-4000-8000-000000000303','authenticated','authenticated','guest-c@test.invalid',null,now(),now());
set local role service_role;
-- Completion arrives before the customer event. A forged browser user ID is ignored.
select public.table_record_event('{"event_id":"evt_guest_tx","event_type":"transaction.completed","data":{"id":"txn_guest_a","status":"completed","customer_id":"ctm_guest_a","custom_data":{"table_user_id":"00000000-0000-4000-8000-000000000302"},"items":[{"price":{"id":"pri_01m7k57ckk7x3gx2wgw2ymzymb"}}]}}');
do $$ begin if not exists(select 1 from public.table_purchases where transaction_id='txn_guest_a' and owner_id is null)then raise exception 'Guest transaction was not pending';end if;end $$;
select public.table_record_event('{"event_id":"evt_guest_customer","event_type":"customer.created","occurred_at":"2026-11-17T00:00:00Z","data":{"id":"ctm_guest_a","email":"guest-a@test.invalid"}}');
do $$ begin
 if not exists(select 1 from public.table_purchases where transaction_id='txn_guest_a' and owner_id='00000000-0000-4000-8000-000000000301')then raise exception 'Verified email claim failed';end if;
 if exists(select 1 from public.table_households where owner_id='00000000-0000-4000-8000-000000000302' and paid)then raise exception 'Browser metadata granted access';end if;
 begin perform public.table_claim_purchases('00000000-0000-4000-8000-000000000303');raise exception 'Unverified email gained access';
 exception when others then if sqlerrm<>'A verified account is required' then raise;end if;end;
end $$;
-- Buying before creating any account also works.
select public.table_record_event('{"event_id":"evt_guest_future_customer","event_type":"customer.created","occurred_at":"2026-11-17T00:00:00Z","data":{"id":"ctm_guest_future","email":"guest-future@test.invalid"}}');
select public.table_record_event('{"event_id":"evt_guest_future_tx","event_type":"transaction.completed","data":{"id":"txn_guest_future","status":"completed","customer_id":"ctm_guest_future","items":[{"price":{"id":"pri_01m7k57ckk7x3gx2wgw2ymzymb"}}]}}');
reset role;
insert into auth.users(id,aud,role,email,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000304','authenticated','authenticated','guest-future@test.invalid',now(),now(),now());
set local role service_role;
select public.table_claim_purchases('00000000-0000-4000-8000-000000000304');
do $$ begin if not exists(select 1 from public.table_households where owner_id='00000000-0000-4000-8000-000000000304' and paid)then raise exception 'Post-purchase registration failed';end if;end $$;
-- Changed Paddle customer email cannot transfer an already-claimed purchase.
select public.table_record_event('{"event_id":"evt_guest_changed_email","event_type":"customer.updated","occurred_at":"2026-11-17T00:10:00Z","data":{"id":"ctm_guest_a","email":"guest-b@test.invalid"}}');
select public.table_claim_purchases('00000000-0000-4000-8000-000000000302');
do $$ begin if not exists(select 1 from public.table_purchases where transaction_id='txn_guest_a' and owner_id='00000000-0000-4000-8000-000000000301')then raise exception 'Purchase transferred';end if;end $$;
-- Refund removes access and an older completion cannot restore it.
select public.table_record_event('{"event_id":"evt_guest_refund","event_type":"adjustment.created","data":{"transaction_id":"txn_guest_a","action":"refund","status":"approved","type":"full"}}');
select public.table_record_event('{"event_id":"evt_guest_old_tx","event_type":"transaction.completed","data":{"id":"txn_guest_a","status":"completed","customer_id":"ctm_guest_a","items":[{"price":{"id":"pri_01m7k57ckk7x3gx2wgw2ymzymb"}}]}}');
reset role;
do $$ begin if exists(select 1 from public.table_households where owner_id='00000000-0000-4000-8000-000000000301' and paid)then raise exception 'Refund did not revoke access';end if;end $$;
rollback;
