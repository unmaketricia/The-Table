Deno.serve(async(request:Request)=>{
 if(request.method!=="POST")return Response.json({error:"Method not allowed"},{status:405});
 const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,authorization=request.headers.get("Authorization")||"";
 if(!authorization.startsWith("Bearer "))return Response.json({error:"Sign in first"},{status:401});
 const userResponse=await fetch(url+"/auth/v1/user",{headers:{Authorization:authorization,apikey:Deno.env.get("SUPABASE_ANON_KEY")!}});
 if(!userResponse.ok)return Response.json({error:"Please sign in again"},{status:401});
 const user=await userResponse.json();if(!user.email_confirmed_at)return Response.json({error:"Confirm your email first"},{status:403});
 const raw=await request.text();if(raw.length>4096)return Response.json({error:"Request too large"},{status:413});
 let body;try{body=JSON.parse(raw)}catch{return Response.json({error:"Invalid request"},{status:400})}
 if(!["invite","accept","remove"].includes(body.action))return Response.json({error:"Invalid action"},{status:400});
 if(body.action==="invite"&&(typeof body.email!=="string"||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email)))return Response.json({error:"Enter a valid email"},{status:400});
 const random=crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","");
 const token=body.action==="accept"?body.token:random;
 if(typeof token!=="string"||!/^[a-f0-9]{64}$/.test(token))return Response.json({error:"Invalid invitation"},{status:400});
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
 const response=await fetch(url+"/rest/v1/rpc/table_manage_members",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_actor:user.id,p_action:body.action,p_email:body.email||"",p_hash:hash,p_user:body.userId||null})});
 if(!response.ok){const error=await response.json();const safe=["Your household already has four users or reserved invitations","Your household already has four users","Invitation is invalid or belongs to another email","An active purchase is required","You already own an active Table","You already own this household"];return Response.json({error:safe.includes(error.message)?error.message:"Unable to update this household."},{status:400})}
 return Response.json({ok:true,...(body.action==="invite"?{token:random}:{})});
});
