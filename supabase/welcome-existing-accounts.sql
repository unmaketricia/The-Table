-- Run once before rolling out the welcome page. Existing active account holders
-- have already signed in, so their next visit should open Home directly.
-- This is a UI preference only; it does not grant access or change permissions.
begin;
with existing as (
 update auth.users u
 set raw_user_meta_data=coalesce(u.raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('table_welcome_seen_at',statement_timestamp())
 where u.last_sign_in_at is not null
 and coalesce(u.raw_user_meta_data->>'table_welcome_seen_at','')=''
 and (
  exists(select 1 from public.table_households h where h.owner_id=u.id and h.paid)
  or exists(select 1 from public.table_members m join public.table_households h on h.id=m.household_id where m.user_id=u.id and h.paid)
 )
 returning u.id
)
select count(*) as existing_accounts_preserved from existing;
commit;
