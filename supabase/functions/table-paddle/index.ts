import {dispatchWelcomes} from "./welcome.mjs";
import {verifyPaddleSignature} from "./verify.js";
Deno.serve(async (request: Request) => {
  if(request.method!=="POST") return new Response("Method not allowed",{status:405});
  const secret=Deno.env.get("PADDLE_WEBHOOK_SECRET");
  if(!secret) return new Response("Payment verification is not configured",{status:503});
  const raw=await request.text();
  if(raw.length>1000000) return new Response("Request too large",{status:413});
  if(!await verifyPaddleSignature(raw,request.headers.get("Paddle-Signature"),secret))
    return new Response("Invalid signature",{status:401});
  let event;
  try {event=JSON.parse(raw);} catch {return new Response("Invalid JSON",{status:400});}
  if(!event.event_id || !event.data || !event.event_type) return new Response("Invalid event",{status:400});
  const response=await fetch(Deno.env.get("SUPABASE_URL")+"/rest/v1/rpc/table_record_event",{
    method:"POST",headers:{"Content-Type":"application/json","apikey":Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,"Authorization":"Bearer "+Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")},
    body:JSON.stringify({p_event:event})
  });
  if(!response.ok){console.error("Purchase provisioning failed",response.status);return new Response("Please retry",{status:500});}
  if(['transaction.completed','customer.created','customer.updated'].includes(event.event_type)){
   try{await dispatchWelcomes(rpc,Deno.env.get("RESEND_API_KEY"));}
   catch(e){console.error("Welcome email delivery pending",e instanceof Error?e.message:'Delivery failed');return new Response("Welcome delivery pending; please retry",{status:503});}
  }
  return Response.json({received:true});
});

async function rpc(name:string,body:Record<string,unknown>){
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const r=await fetch(Deno.env.get("SUPABASE_URL")+"/rest/v1/rpc/"+name,{method:"POST",headers:{"Content-Type":"application/json",apikey:key,Authorization:"Bearer "+key},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Welcome delivery storage returned '+r.status);const text=await r.text();return text?JSON.parse(text):null;
}
