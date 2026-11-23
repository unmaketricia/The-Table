import {buyerIdentity,buyerFailure,BuyerError} from '@/commercial/server';
import {authConfig} from '@/commercial/auth-config';
export async function POST(request:Request){try{
 const {token}=await buyerIdentity(request),raw=await request.text();if(raw.length>4096)throw new BuyerError('Request too large',413);
 const response=await fetch(authConfig.url+'/functions/v1/table-household',{method:'POST',headers:{Authorization:'Bearer '+token,apikey:authConfig.publishableKey,'Content-Type':'application/json'},body:raw,cache:'no-store'});
 const data=await response.json();return Response.json(data,{status:response.status,headers:{'Cache-Control':'no-store'}});
}catch(e){return buyerFailure(e)}}
