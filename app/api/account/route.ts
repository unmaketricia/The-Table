import {buyerIdentity,buyerRpc,buyerFailure,BuyerError} from '@/commercial/server';
import {hasSeenWelcome} from '@/commercial/onboarding';
import {authConfig} from '@/commercial/auth-config';
export async function GET(request:Request){
 try{
  const {token,user}=await buyerIdentity(request);
  const claim=await fetch(authConfig.url+'/functions/v1/table-claim',{method:'POST',headers:{Authorization:'Bearer '+token,apikey:authConfig.publishableKey,'Content-Type':'application/json'},body:'{}',cache:'no-store'});
  if(!claim.ok)throw new BuyerError('Your purchase could not be checked. Please try again.',503);
  const account=await buyerRpc(token,'table_account');
  const contacts=await fetch(authConfig.url+'/functions/v1/table-household',{method:'POST',headers:{Authorization:'Bearer '+token,apikey:authConfig.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({action:'details'}),cache:'no-store'});
  if(!contacts.ok)throw new BuyerError('Your household details could not be loaded. Please try again.',503);
  return Response.json({...account,...await contacts.json(),welcomeSeen:hasSeenWelcome(user.user_metadata)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return buyerFailure(e)}
}
