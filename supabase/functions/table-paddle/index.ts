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
  return Response.json({received:true});
});
