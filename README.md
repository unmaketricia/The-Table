# the-table

Migrated from the latest ChatGPT Site source. Next.js on Vercel with server-side Supabase PostgreSQL storage.

## Deploy

1. Import this repository into Vercel as a Next.js project.
2. Set `DATABASE_URL` in Vercel's server-side environment variables to the Supabase transaction pooler URI (including the database password). Never use a `NEXT_PUBLIC_` prefix.
3. Deploy. The database uses the `the_table` schema; migration SQL is in `database/schema.sql`. Existing saved data is transferred separately and is never committed to GitHub.

## Local development

Copy `.env.example` to `.env.local`, configure `DATABASE_URL`, then run `npm ci` and `npm run dev`.

## Accounts and data

The app includes email and password registration, sign in, sign out, and a 30-day secure session cookie. Passwords are stored as scrypt hashes. Entries are scoped to the signed-in account. On the first registration after this migration, any existing unassigned entries are attached to that account; accounts registered afterward start with their own entries.

The same account flow is available through `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, and `/api/auth/me`. Entry reads and writes at `/api/entries` require a valid session.

## Validation

`npm run typecheck` and `npm run build`.
