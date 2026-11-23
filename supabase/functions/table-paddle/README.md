# Purchase welcome email

Deploy index.ts, verify.js, and welcome.mjs to table-paddle with verify_jwt=false. Paddle signature verification remains required. The existing project RESEND_API_KEY sends from Unmake Studio <tricia@un-make.com>. Apply supabase/welcome-emails.sql first.

Confirmed purchases and customer notifications queue one welcome per normalized checkout email. Customer notifications handle Paddle events arriving out of order. Active purchases only; refunds do not enqueue mail. The server-only outbox retains provider acceptance IDs and prevents later retries from sending again. Resend delivery keys also deduplicate concurrent requests for 24 hours. Failed requests return 503 so Paddle retries without repeating purchase provisioning. Auth/signup verification is separate.

The initial authorized catch-up send completed for six distinct existing buyer addresses on 2026-11-18. No automatic resend to those recipients. A temporary authenticated catch-up route was removed after the send; it is not part of production source.

Run: node --test tests/welcome-email.test.mjs
