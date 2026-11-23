
const APP = 'https://www.un-make.com/table/app';
export function invitationUrl(token) {
 if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid invitation token');
 return APP + '/invite?token=' + token;
}
export function invitationEmail(token) {
 const url=invitationUrl(token);
 return {subject:'You’re invited to The Table',
 text:'There’s a place for you. You’ve been invited to join a household on The Table. Accept your invitation to set up your account and choose a password. If you already have an account, sign in to join. Accept your invitation: '+url+' . This invitation expires in seven days. If you weren’t expecting it, you can ignore this email.',
 html:`<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="UTF-8"><title>You’re invited to The Table</title></head><body style="margin:0;background:#F5EFEB;font-family:Arial,Helvetica,sans-serif;color:#2F4156"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td align="center" style="padding-bottom:28px"><div style="font-size:24px;font-weight:700;letter-spacing:2px;color:#222">UNMAKE</div><div style="margin-top:4px;font-size:15px;font-style:italic;color:#3E6876">Digital Studio</div></td></tr><tr><td style="padding:36px 28px;background:#fff;border:1px solid #E3DDD5;border-radius:16px"><p style="margin:0 0 16px;font-size:12px;font-weight:700;letter-spacing:3px;color:#865A70">THE TABLE</p><h1 style="margin:0 0 20px;font-size:28px;line-height:1.25">There’s a place for you.</h1><p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#626662">You’ve been invited to join a household on The Table. Accept your invitation to set up your account and choose a password. If you already have an account, sign in to join.</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#2F4156" style="border-radius:28px"><a href="${url}" style="display:inline-block;padding:16px 28px;border:1px solid #2F4156;border-radius:28px;font-size:16px;font-weight:700;text-decoration:none;color:#fff">Accept invitation</a></td></tr></table><p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#73766F">This invitation expires in seven days. If you weren’t expecting it, you can safely ignore this email.</p><div style="margin-top:28px;padding-top:20px;border-top:1px solid #E3DDD5"><p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#73766F">Button not working? Copy and paste this link into your browser:</p><a href="${url}" style="font-size:12px;line-height:1.6;color:#3E6876;word-break:break-all">${url}</a></div></td></tr><tr><td align="center" style="padding:24px 12px"><p style="margin:0 0 8px;font-size:12px;color:#73766F">Simple digital tools for everyday life.</p><p style="margin:0;font-size:12px"><a href="https://www.un-make.com" style="color:#3E6876;text-decoration:none">Unmake Studio</a> · <a href="mailto:tricia@un-make.com" style="color:#3E6876;text-decoration:none">Need a hand?</a></p></td></tr></table></td></tr></table></body></html>`};
}
export async function sendInvitation(key,email,token,fetcher=fetch) {
 if(!key) return {sent:false};
 const content=invitationEmail(token);
 try {
  const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'table-invite-'+token},body:JSON.stringify({from:'Unmake Studio <tricia@un-make.com>',to:[email],reply_to:'tricia@un-make.com',...content}),signal:AbortSignal.timeout(15000)});
  if(!response.ok) return {sent:false};
  const data=await response.json();
  return {sent:typeof data.id==='string'&&data.id.length>0};
 } catch { return {sent:false}; }
}
