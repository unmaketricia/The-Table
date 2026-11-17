import {authConfig} from '@/commercial/auth-config';
export async function POST(request:Request){
 try{
  const raw=await request.text();
  if(raw.length>4096)return Response.json({error:'Request too large'},{status:413});
  let body;try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400})}
  if(!body||!['preview','register'].includes(body.action))return Response.json({error:'Invalid request'},{status:400});
  const response=await fetch(authConfig.url+'/functions/v1/table-household',{method:'POST',headers:{apikey:authConfig.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({action:body.action,token:body.token,password:body.password,confirmation:body.confirmation}),cache:'no-store'});
  return Response.json(await response.json(),{status:response.status,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Unable to check your invitation. Please try again.'},{status:503});}
}
