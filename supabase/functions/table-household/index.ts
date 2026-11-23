import {sendInvitation} from './invitation.mjs';
import {invitationSignup} from './signup.mjs';
import {householdContacts,leaveHousehold} from './operations.mjs';
Deno.serve(async(request:Request)=>{
 if(request.method!=="POST")return Response.json({error:"Method not allowed"},{status:405});
 const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,authorization=request.headers.get("Authorization")||"";
 const raw=await request.text();if(raw.length>4096)return Response.json({error:"Request too large"},{status:413});
 let body;try{body=JSON.parse(raw)}catch{return Response.json({error:"Invalid request"},{status:400})}
 if(!body||typeof body!=="object")return Response.json({error:"Invalid request"},{status:400});
 if(["preview","register"].includes(body.action)){
  try{const result=await invitationSignup(body,url,service);return Response.json(result.data,{status:result.status,headers:{"Cache-Control":"no-store"}});}
  catch{return Response.json({error:"Unable to check this invitation. Please try again."},{status:503});}
 }
 if(!authorization.startsWith("Bearer "))return Response.json({error:"Sign in first"},{status:401});
 const userResponse=await fetch(url+"/auth/v1/user",{headers:{Authorization:authorization,apikey:Deno.env.get("SUPABASE_ANON_KEY")!}});
 if(!userResponse.ok)return Response.json({error:"Please sign in again"},{status:401});
 const user=await userResponse.json();if(!user.email_confirmed_at)return Response.json({error:"Confirm your email first"},{status:403});
 if(body.action==="details"){
  try{
   const accountResponse=await fetch(url+"/rest/v1/rpc/table_account",{method:"POST",headers:{Authorization:authorization,apikey:Deno.env.get("SUPABASE_ANON_KEY")!,"Content-Type":"application/json"},body:"{}"});
   if(!accountResponse.ok)throw Error("Unable to access this household");
   const contacts=await householdContacts(url,service,user,await accountResponse.json());
   return Response.json(contacts,{headers:{"Cache-Control":"no-store"}});
  }catch{return Response.json({error:"Unable to load household details."},{status:503});}
 }
 if(body.action==="leave"){
  const ok=await leaveHousehold(url,service,user.id);
  return Response.json(ok?{ok:true}:{error:"Unable to leave this household. Please try again."},{status:ok?200:503});
 }
 if(!["invite","accept","remove"].includes(body.action))return Response.json({error:"Invalid action"},{status:400});
 if(body.action==="invite"&&(typeof body.email!=="string"||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email)))return Response.json({error:"Enter a valid email"},{status:400});
 const resendKey=Deno.env.get("RESEND_API_KEY");
 if(body.action==="invite"){
  if(!resendKey)return Response.json({error:"Invitation emails are temporarily unavailable. Please contact support."},{status:503});
  body.email=body.email.trim().toLowerCase();
  const recent=await fetch(url+"/rest/v1/table_invitations?select=token_hash&owner_id=eq."+encodeURIComponent(user.id)+"&expires_at=gt."+encodeURIComponent(new Date(Date.now()+7*86400000-60000).toISOString())+"&limit=1",{headers:{apikey:service,Authorization:"Bearer "+service}});
  if(!recent.ok)return Response.json({error:"Unable to check invitations. Please try again."},{status:503});
  if((await recent.json()).length)return Response.json({error:"Please wait one minute before sending another invitation."},{status:429});
 }
 const random=crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","");
 const token=body.action==="accept"?body.token:random;
 if(typeof token!=="string"||!/^[a-f0-9]{64}$/.test(token))return Response.json({error:"Invalid invitation"},{status:400});
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
 const response=await fetch(url+"/rest/v1/rpc/table_manage_members",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_actor:user.id,p_action:body.action,p_email:body.email||"",p_hash:hash,p_user:body.userId||null})});
 if(!response.ok){const error=await response.json();const safe=["Your household already has four users or reserved invitations","Your household already has four users","Invitation is invalid or belongs to another email","An active purchase is required","You already own an active Table","You already own this household"];return Response.json({error:safe.includes(error.message)?error.message:"Unable to update this household."},{status:400})}
 if(body.action==="invite"){
  const delivery=await sendInvitation(resendKey,body.email,random);
  if(!delivery.sent)return Response.json({error:"The invitation email could not be sent. Please try again in one minute."},{status:502});
  return Response.json({ok:true,emailSent:true});
 }
 return Response.json({ok:true});
});
