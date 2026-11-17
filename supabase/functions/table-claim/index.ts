Deno.serve(async(request:Request)=>{
 if(request.method!=="POST")return Response.json({error:"Method not allowed"},{status:405});
 const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,authorization=request.headers.get("Authorization")||"";
 if(!authorization.startsWith("Bearer "))return Response.json({error:"Sign in first"},{status:401});
 const response=await fetch(url+"/auth/v1/user",{headers:{Authorization:authorization,apikey:Deno.env.get("SUPABASE_ANON_KEY")!}});
 if(!response.ok)return Response.json({error:"Sign in again"},{status:401});
 const user=await response.json();if(!user.email_confirmed_at)return Response.json({error:"Confirm your email first"},{status:403});
 const claim=await fetch(url+"/rest/v1/rpc/table_claim_purchases",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_user:user.id})});
 if(!claim.ok){console.error("Purchase claim failed",claim.status);return Response.json({error:"Unable to verify purchase. Please try again."},{status:503})}
 return Response.json({paid:await claim.json()});
});