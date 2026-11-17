import {buyerIdentity,buyerRpc,buyerFailure,BuyerError} from '@/commercial/server';
import {authConfig} from '@/commercial/auth-config';
export async function GET(request:Request){
 try{
  const {token}=await buyerIdentity(request);
  const claim=await fetch(authConfig.url+'/functions/v1/table-claim',{method:'POST',headers:{Authorization:'Bearer '+token,apikey:authConfig.publishableKey,'Content-Type':'application/json'},body:'{}',cache:'no-store'});
  if(!claim.ok)throw new BuyerError('Your purchase could not be checked. Please try again.',503);
  return Response.json(await buyerRpc(token,'table_account'),{headers:{'Cache-Control':'no-store'}});
 }catch(e){return buyerFailure(e)}
}
