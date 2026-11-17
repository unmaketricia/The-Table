import {buyerIdentity,buyerRpc,buyerFailure} from '@/commercial/server';
export async function GET(request:Request){
 try{const {token}=await buyerIdentity(request);return Response.json(await buyerRpc(token,'table_account'),{headers:{'Cache-Control':'no-store'}})}catch(e){return buyerFailure(e)}
}
