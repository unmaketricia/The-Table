# Buyer access
Commercial deployment only. Leave the personal app on main and its original database.
Host the commercial deployment under /table/app with its own Vercel project.
Paddle live price: pri_01m7k57ckk7x3gx2wgw2ymzymb.
Webhook: https://pwhmbfnjzlljwcwtdsyp.supabase.co/functions/v1/table-paddle
Configure PADDLE_WEBHOOK_SECRET in Supabase Edge Function secrets.
Subscribe to transaction.completed, adjustment.created and adjustment.updated.
Verify buyer login, signed webhook, private storage and household isolation before enabling TABLE_CHECKOUT_ENABLED on the sales website.
Only signed completed transactions with the matching price unlock storage. Browser checkout callbacks never grant access.
Full approved refunds and chargebacks revoke access. Partial refunds require manual review.
Invitations reserve a seat for seven days; the owner copies the link to the invited person. A verified matching email is required to accept.
