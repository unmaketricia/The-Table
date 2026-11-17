# Household invitation emails

Set RESEND_API_KEY in this project's Edge Functions secrets. Use a Resend sending key authorized for the verified un-make.com domain. The Supabase Auth SMTP password is separate and is not available to Edge Functions.

Sender: Unmake Studio <tricia@un-make.com>. This original branded household template matches the auth email styling but contains a household invitation link, not an auth auto-login link. Works for existing and new users; verified recipient email must match the database invitation. One-minute owner cooldown; invitation expires after seven days; owner plus three seats remain enforced by table_manage_members. A failed send returns an error and never a sent success.

Deploy index.ts plus invitation.mjs with verify_jwt=false: index.ts verifies the caller through the Supabase Auth user endpoint before any invitation operation. Server-only service-role and Resend keys must never be placed in browser environment variables.
