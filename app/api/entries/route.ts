import {buyerIdentity,buyerRpc,buyerFailure,BuyerError} from '@/commercial/server';
import {InventoryError,planInventoryChange,type Entry} from '@/lib/inventory';
export async function GET(request:Request){
 try{const {token}=await buyerIdentity(request);const account=await buyerRpc(token,'table_account');if(!account.paid)throw new BuyerError('Purchase access required',403);
 return Response.json(await buyerRpc(token,'table_snapshot',{p_household:account.householdId}),{headers:{'Cache-Control':'no-store'}})}catch(e){return buyerFailure(e)}
}
export async function POST(request:Request){
 try{
 const {token}=await buyerIdentity(request),account=await buyerRpc(token,'table_account');
 if(!account.paid)throw new BuyerError('Purchase access required',403);
 const raw=await request.text();if(raw.length>1000000)throw new BuyerError('Request too large',413);
 let body;try{body=JSON.parse(raw)}catch{throw new BuyerError('Invalid request')}
 const {action,items}=body as {action:string;items:Entry[]};
 if(!['save','delete'].includes(action)||!Array.isArray(items)||items.length>200)throw new BuyerError('Invalid entries');
 for(const item of items)if(!item||typeof item.id!=='string'||!item.id||item.id.length>100||!['meal','breakfast','grocery','inventory'].includes(item.kind)||JSON.stringify(item).length>10000)throw new BuyerError('Invalid entry');
 const snapshot=await buyerRpc(token,'table_snapshot',{p_household:account.householdId});
 let plan;try{plan=planInventoryChange(snapshot.entries,items,action as 'save'|'delete')}catch(e){if(e instanceof InventoryError)throw new BuyerError(e.message,409);throw e}
 await buyerRpc(token,'table_apply',{p_household:account.householdId,p_revision:snapshot.revision,p_changed:plan.changed,p_deleted:plan.deleted.map(e=>e.id)});
 return Response.json({ok:true,entries:plan.entries},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return buyerFailure(e)}
}
