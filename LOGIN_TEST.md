# Login test preview branch

This branch is deployed to Vercel Preview. The root redirects to `/login`; `/api/entries` is disabled so the preview cannot read or write personal app entries. The production main branch and database are unchanged.

# Commercial authentication stage

Requirements: email + password registration/login, email confirmation and password recovery; Google and Facebook after provider configuration; remember the browser for up to 30 days; one owner and at most three additional members; no checkout or payment activation.

`/login/` is a standalone authentication test page. It does not grant access to the personal app or turn the fictional demonstration into private household storage. Neither entry data nor credentials are copied from the personal database.

The selected commercial project is Unmake Studios / The Table (`pwhmbfnjzlljwcwtdsyp`). Email/password and confirmed-email registration are enabled. Google/Facebook are not configured. Dashboard access is required to set allowed email redirect URLs and SMTP. No personal database is connected.

## Configuration before activation

1. Use the existing Unmake Studios / The Table project.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at build time; never use a secret or service role key in the browser.
3. Enable email/password with confirmed emails, a minimum password length of 12, and custom SMTP for verification/recovery. Set the Site URL and exact `/login/` callback URL.
4. Set up Google and Facebook OAuth applications with the correct Supabase callback URL. Enable only configured providers using `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=true` / `NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED=true`.
5. For Google/Facebook public use, complete provider consent/testing requirements. Do not publish buttons for unconfigured providers.
6. Browser session storage expires 30 days after each new session ID and refreshes do not extend it. Server authorization must also enforce the maximum session lifetime before real household records are connected. Supabase native time-box sessions require Pro; an alternative server-side session policy is required if keeping the free plan.
7. Build private household tables and server/database authorization before connecting real entries. Enforce the four-user cap atomically in the backend, counting pending invitations as reserved places. The fictional preview's local three-member cap is not production enforcement.

## Required live verification

- Registration, duplicate registration, email confirmation, wrong password, logout, page reload and a second browser account.
- Password reset through a real email and return to password sign-in.
- Google and Facebook callback success/cancel/error.
- Session renewal, 30-day expiry and rejected expired requests on the backend.
- Two households cannot read or modify one another, including direct API requests.
