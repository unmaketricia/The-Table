-- Applied to the dedicated commercial project; existing rows and RLS stay intact.
alter table public.table_entries drop constraint table_entries_kind_check;
alter table public.table_entries add constraint table_entries_kind_check
 check (kind in ('meal','breakfast','grocery','inventory','settings'));
