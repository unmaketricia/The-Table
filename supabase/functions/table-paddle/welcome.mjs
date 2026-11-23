const APP='https://www.un-make.com/table/app';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function welcomeEmail(email){
 const address=escapeHtml(email);
 const text=`Your Table is ready.

Thank you for choosing The Table—a little less to think about at mealtime.

Open The Table: ${APP}

Use the same email address you entered during payment: ${email}
If you are new, choose Create account, set a password, and confirm your email. Your purchase will be matched automatically. Already registered? Sign in with your existing account.

Add The Table to your phone
First, open the link above in your phone’s browser and sign in.

iPhone (Safari): Tap Share, choose Add to Home Screen, then tap Add. If you do not see it, scroll through the Share menu.

Android (Chrome): Tap the three-dot menu, choose Install app or Add to Home screen, then confirm.

You can then open The Table using its icon on your phone. There is no separate App Store download.

Need a hand? Reply to this email or contact tricia@un-make.com.

Tricia
Unmake Studio`;
 return {subject:'Your Table is ready — let’s get you started',text,
 html:`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Table is ready</title></head><body style="margin:0;background:#F5EFEB;color:#2F4156;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:36px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px"><tr><td align="center" style="padding-bottom:24px;font-size:22px;font-weight:bold;letter-spacing:2px">UNMAKE STUDIO</td></tr><tr><td style="padding:32px 24px;background:white;border:1px solid #E3DDD5;border-radius:16px"><h1 style="font-size:30px;line-height:1.25;margin:0 0 20px">Your Table is ready.</h1><p style="font-size:16px;line-height:1.6;margin:0 0 24px">Thank you for choosing The Table—a little less to think about at mealtime.</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#2F4156" style="border-radius:24px"><a href="${APP}" style="display:inline-block;padding:16px 28px;color:white;text-decoration:none;font-weight:bold;font-size:16px;border-radius:24px">Open The Table</a></td></tr></table><div style="margin:28px 0;padding:18px;background:#F5EFEB;border-radius:8px"><p style="margin:0 0 8px;line-height:1.6"><strong>Use the email address you entered during payment:</strong></p><p style="margin:0;line-height:1.6;word-break:break-word">${address}</p></div><p style="font-size:16px;line-height:1.6;margin:0 0 12px">New here? Choose <strong>Create account</strong>, set a password, and confirm your email. Your purchase will be matched automatically.</p><p style="font-size:16px;line-height:1.6;margin:0 0 28px">Already registered? Sign in with your existing account.</p><h2 style="font-size:22px;margin:28px 0 12px">Add The Table to your phone</h2><p style="font-size:16px;line-height:1.6;margin:0 0 20px">Open the app link in your phone’s browser and sign in first.</p><h3 style="font-size:16px;margin:20px 0 8px">iPhone · Safari</h3><ol style="padding-left:22px;margin:0;line-height:1.8"><li>Tap the <strong>Share</strong> button.</li><li>Choose <strong>Add to Home Screen</strong> (scroll through the Share menu if needed).</li><li>Tap <strong>Add</strong>.</li></ol><h3 style="font-size:16px;margin:24px 0 8px">Android · Chrome</h3><ol style="padding-left:22px;margin:0;line-height:1.8"><li>Tap the <strong>three-dot menu</strong>.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Follow the steps to confirm.</li></ol><p style="font-size:15px;line-height:1.6;margin:24px 0">You can now open The Table using its icon on your phone. There is no separate App Store download.</p><p style="font-size:15px;line-height:1.6;margin:24px 0 0">Need a hand? Reply to this email.<br><br>Tricia<br>Unmake Studio</p><p style="font-size:12px;line-height:1.6;margin:28px 0 0;padding-top:20px;border-top:1px solid #E3DDD5">Button not working? Open <a href="${APP}" style="color:#2F4156;word-break:break-all">${APP}</a></p></td></tr><tr><td align="center" style="padding:20px;font-size:12px;line-height:1.6;color:#626662">You’re receiving this email because you purchased The Table.<br><a href="mailto:tricia@un-make.com" style="color:#2F4156">tricia@un-make.com</a></td></tr></table></td></tr></table></body></html>`};
}
export async function sendWelcome(key,email,deliveryKey,fetcher=fetch){
 if(!key)throw Error('Welcome email sender is not configured');
 const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'table-welcome-'+deliveryKey},body:JSON.stringify({from:'Unmake Studio <tricia@un-make.com>',to:[email],reply_to:'tricia@un-make.com',...welcomeEmail(email)}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Welcome email provider returned '+response.status);
 const data=await response.json();if(typeof data.id!=='string'||!data.id)throw Error('Welcome email was not accepted');return data.id;
}
export async function dispatchWelcomes(rpc,key,send=sendWelcome){
 const jobs=await rpc('table_welcome_queue',{});let sent=0;
 for(const job of jobs){const id=await send(key,job.email,job.delivery_key);await rpc('table_welcome_sent',{p_email:job.email,p_delivery_key:job.delivery_key,p_message_id:id});sent++;}
 return {sent};
}
