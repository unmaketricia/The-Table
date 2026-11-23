const release='2026-11-23-custom-menus';
const text="The Table has been updated.\n\nCustom menus now let you:\n• Rename or delete a menu.\n• Add, rename, or remove mealtimes for each custom menu independently.\n• Add an optional name to each meal and plan different dishes for different people at the same mealtime.\n\nHow to load the latest version:\n1. Save any changes first.\n2. Using a browser? Refresh the page, or close the tab and reopen the link below.\n3. Using The Table from your phone's home screen? Close the app completely from your app switcher, then reopen it from its icon.\n4. If you still see the older version, open the app link in Safari or Chrome, refresh it there, then reopen the home screen app.\n\nOpen The Table: https://www.un-make.com/table/app\n\nYour saved menus, groceries, and inventory remain in your account.\n\nNeed a hand? Reply to this email.\n\nTricia\nUnmake Studio";
Deno.serve(async request=>{
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(request.method!=='POST'||!key||request.headers.get('Authorization')!=='Bearer '+key)return new Response('Unauthorized',{status:401});
 try{
  const base=Deno.env.get('SUPABASE_URL')+'/rest/v1/table_update_notices';
  const headers={'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key};
  const rows=await fetch(base+'?release_id=eq.'+release+'&sent_at=is.null&select=email,delivery_key',{headers});
  if(!rows.ok)throw Error('Could not read pending update notices');
  const jobs=await rows.json();let sent=0;
  for(const job of jobs){
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+Deno.env.get('RESEND_API_KEY'),'Idempotency-Key':'table-update-'+job.delivery_key},body:JSON.stringify({from:'Unmake Studio <tricia@un-make.com>',reply_to:'tricia@un-make.com',to:[job.email],subject:'The Table has been updated — refresh your app',text,html:'<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#2F4156;background:#F5EFEB;padding:24px"><div style="max-width:560px;margin:auto;background:white;padding:28px;border-radius:12px"><h1 style="font-size:28px">The Table has been updated.</h1><div style="white-space:pre-line;line-height:1.7">'+text+'</div><p><a href="https://www.un-make.com/table/app" style="display:inline-block;padding:14px 24px;border-radius:24px;background:#2F4156;color:white;text-decoration:none;font-weight:bold">Open The Table</a></p></div></body></html>'}),signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('Email provider returned '+response.status);
   const accepted=await response.json();if(!accepted.id)throw Error('Email provider did not accept the message');
   const mark=await fetch(base+'?release_id=eq.'+release+'&email=eq.'+encodeURIComponent(job.email),{method:'PATCH',headers,body:JSON.stringify({sent_at:new Date().toISOString(),provider_message_id:accepted.id})});
   if(!mark.ok)throw Error('Could not record update notice acceptance');sent++;
  }
  return Response.json({sent});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Update notice failed'},{status:503})}
});
