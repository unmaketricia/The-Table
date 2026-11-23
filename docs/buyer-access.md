# Guest checkout and private households
Checkout never requires app sign-in. Paddle collects the buyer email and payment.
The browser callback redirects to /table/thank-you and never grants access.
Signed customer.created/customer.updated notifications map customer IDs to checkout emails.
Signed transaction.completed notifications for pri_01m7k57ckk7x3gx2wgw2ymzymb record the purchase.
A verified app account claims only unclaimed purchases whose Paddle email matches its confirmed email.
Customers can buy before creating an account. Notifications may arrive in either order.
Claimed purchases stay bound to the account and cannot be moved by changing a checkout/customer email.
Every data request requires a verified account and an active paid household; RLS also checks household ownership/membership.
Full approved refunds and chargebacks revoke access. Partial refunds require manual review.
Production notification destination:
https://pwhmbfnjzlljwcwtdsyp.supabase.co/functions/v1/table-paddle
Events: customer.created, customer.updated, transaction.completed, adjustment.created, adjustment.updated.
Usage type: Platform only. Store its endpoint secret as PADDLE_WEBHOOK_SECRET in Supabase Edge Function secrets.
Do not enable TABLE_CHECKOUT_ENABLED on the website until signed delivery and an end-to-end purchase have been verified.
The Table is an installable web app, not a downloadable executable. A signed-in buyer can add it to the phone home screen.
