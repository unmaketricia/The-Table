
export async function invitationSignup(body,url,service,fetcher=fetch){
 const reply=(data,status=200)=>({data,status});
 if(!body||!['preview','register'].includes(body.action)||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))return reply({error:'This invitation is invalid.'},400);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const headers={apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'};
 const invitation=await fetcher(url+'/rest/v1/table_invitations?select=email,household_id&token_hash=eq.'+hash+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&limit=1',{headers});
 if(!invitation.ok)return reply({error:'Unable to check this invitation. Please try again.'},503);
 const inv=(await invitation.json())[0];
 if(!inv)return reply({error:'This invitation has expired or has already been accepted. Ask the household owner for a new invitation.'},410);
 const household=await fetcher(url+'/rest/v1/table_households?select=id&id=eq.'+encodeURIComponent(inv.household_id)+'&paid=eq.true&limit=1',{headers});
 if(!household.ok)return reply({error:'Unable to check this invitation. Please try again.'},503);
 if(!(await household.json()).length)return reply({error:'This household invitation is no longer available.'},410);
 if(body.action==='preview')return reply({email:inv.email});
 if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)return reply({error:'Choose a password between 12 and 128 characters.'},400);
 if(body.password!==body.confirmation)return reply({error:'Passwords don’t match.'},400);
 // Possession of the emailed, unexpired invitation proves access to its recipient inbox.
 // Never accept a client email or update an existing account/password.
 const created=await fetcher(url+'/auth/v1/admin/users',{method:'POST',headers,body:JSON.stringify({email:inv.email,password:body.password,email_confirm:true})});
 if(!created.ok){
  const error=await created.json().catch(()=>({}));
  if(/already|registered|exists/i.test(error.msg||error.message||error.error_code||error.code||''))return reply({error:'This email already has an account. Sign in with your existing password to join.',accountExists:true},409);
  return reply({error:'Your account could not be created. Use a strong password and try again.'},400);
 }
 return reply({ok:true,email:inv.email});
}
